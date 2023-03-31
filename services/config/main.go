package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redsuperbat/rsb-config/services/config/auth"
	"k8s.io/utils/strings/slices"
)

func getConfigDir() string {
	configDir, present := os.LookupEnv("RSB_CONFIG_DIR")
	if !present {
		if wd, err := os.Getwd(); err == nil {
			configDir = wd + "/config"
			log.Printf("No config directory specified, defaulting to %s", configDir)
		} else {
			log.Panic(err.Error())
		}
	}
	return configDir
}

func resp(c *fiber.Ctx, code int, messages ...string) error {
	var message string
	if len(messages) == 0 {
		message = http.StatusText(code)
	} else {
		message = strings.Join(messages, ", ")
	}

	return c.Status(code).JSON(&fiber.Map{
		"status":  code,
		"message": message,
	})
}

func authMiddleware(c *fiber.Ctx) error {
	authHeader := c.GetReqHeaders()["Authorization"]
	if authHeader == "" {
		return resp(c, 401)
	}

	token := authHeader[len("Bearer "):]
	if token == "" {
		return resp(c, 401)
	}
	valid, err := auth.IsTokenValid(token)

	if err != nil {
		log.Print(err.Error())
		return resp(c, 401)
	}

	if !valid {
		return resp(c, 401)
	}

	return c.Next()
}

func main() {

	configDir := getConfigDir()

	fmt.Print(configDir)

	app := fiber.New()

	app.Static("/", "./dist")

	api := app.Group("/api")

	api.Use(authMiddleware)

	api.Get("/configNames", func(c *fiber.Ctx) error {
		files, _ := os.ReadDir(configDir)
		configNames := make([]string, len(files))
		for idx, file := range files {
			filename := strings.TrimSpace(file.Name())
			configNames[idx] = filename
		}
		return c.JSON(configNames)
	})

	api.Get("/config/:name", func(c *fiber.Ctx) error {
		filename := c.Params("name")

		if file, err := os.ReadFile(path.Join(configDir, filename)); err != nil {
			return resp(c, 404, "Invalid config file")
		} else {
			c.Set("Content-Type", "application/json")
			return c.Status(200).Send(file)
		}
	})

	api.Put("/config/:name", func(c *fiber.Ctx) error {
		filename := c.Params("name")
		fileContent := c.Body()

		if !json.Valid(fileContent) {
			return resp(c, 400, "Invalid JSON")
		}

		filePath := path.Join(configDir, filename)
		log.Printf("Writing file %s to path %s", filename, filePath)
		if err := os.WriteFile(filePath, fileContent, 0777); err != nil {
			return resp(c, 400, "Invalid filetype")
		}
		return resp(c, 200, "Config updated!")
	})

	api.Post("/config/:name", func(c *fiber.Ctx) error {
		filename := c.Params("name")
		fileContent := []byte("{\n  \"hello\": \"World!\"\n}")
		filePath := path.Join(configDir, filename)
		ext := path.Ext(filename)

		if ext == "" {
			ext = "empty"
		}

		validExt := []string{".json", ".yaml", ".yml"}

		if !slices.Contains(validExt, ext) {
			message := fmt.Sprint("Invalid filetype got [", ext, "] expected [", strings.Join(validExt, ", "), "]")
			return resp(c, 400, message)
		}

		if err := os.WriteFile(filePath, fileContent, 0777); err != nil {
			return resp(c, 400, "Invalid filetype")
		}
		return resp(c, 200, "Config created!")
	})

	api.Post("/client-token", func(c *fiber.Ctx) error {
		var Body struct {
			duration time.Time
			note     string
		}

		c.BodyParser(&Body)

		if token, err := auth.GenerateToken(Body.duration, "client_"+Body.note); err != nil {
			log.Print(err.Error())
			return resp(c, 500)
		} else {
			return c.Status(200).JSON(&fiber.Map{
				"token": token,
			})
		}
	})

	api.Get("/client-token", func(c *fiber.Ctx) error {
		tokens, err := auth.GetTokens()
		if err != nil {
			log.Print(err.Error())
			return resp(c, 500)
		}

		type ClientToken struct {
			Note string `json:"note"`
			Id   string `json:"id"`
		}

		clientTokens := []ClientToken{}
		for _, token := range tokens {
			if strings.Contains(strings.Split(token, "~")[2], "client") {
				note := strings.Split(token, "~")[2][len("client_"):]
				id := strings.Split(token, "~")[0]
				clientTokens = append(clientTokens, ClientToken{Note: note, Id: id})
			}
		}
		return c.Status(200).JSON(clientTokens)
	})

	authGroup := app.Group("/auth")

	authGroup.Post("/login", func(c *fiber.Ctx) error {
		var Creds struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		c.BodyParser(&Creds)
		username := os.Getenv("RSB_ADMIN_USERNAME")
		password := os.Getenv("RSB_ADMIN_PASSWORD")

		log.Println("User", Creds.Username, "logging in...")
		log.Println(Creds, username, password)

		if Creds.Password != password {
			return resp(c, 401)
		}

		if Creds.Username != username {
			return resp(c, 401)
		}

		if token, err := auth.GenerateToken(time.Now().Add(time.Minute*30), "session"); err != nil {
			log.Print(err.Error())
			return resp(c, 401)
		} else {
			return c.Status(200).JSON(&fiber.Map{
				"token": token,
			})
		}
	})

	app.Listen(":3003")
}
