package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
	"strings"

	"github.com/gofiber/fiber/v2"
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

func main() {

	configDir := getConfigDir()

	fmt.Print(configDir)

	app := fiber.New()

	app.Static("/", "./dist")

	app.Get("/configNames", func(c *fiber.Ctx) error {
		files, _ := ioutil.ReadDir(configDir)
		configNames := make([]string, len(files))
		for idx, file := range files {
			filename := strings.TrimSpace(file.Name())
			configNames[idx] = filename
		}
		return c.JSON(configNames)
	})

	app.Get("/config/:name", func(c *fiber.Ctx) error {
		filename := c.Params("name")

		if file, err := ioutil.ReadFile(path.Join(configDir, filename)); err != nil {
			return c.Status(404).JSON(&fiber.Map{
				"message": "Invalid config file",
				"status":  404,
			})
		} else {
			return c.Status(200).JSON(string(file))
		}
	})

	app.Put("/config/:name", func(c *fiber.Ctx) error {
		filename := c.Params("name")
		fileContent := c.Body()

		if !json.Valid(fileContent) {
			return c.Status(400).JSON(&fiber.Map{
				"message": "Invalid JSON",
				"status":  400,
			})
		}

		filePath := path.Join(configDir, filename)
		log.Printf("Writing file %s to path %s", filename, filePath)
		if err := ioutil.WriteFile(filePath, fileContent, 0777); err != nil {
			return c.Status(400).JSON(&fiber.Map{
				"message": "Invalid filetype",
				"status":  400,
			})
		}
		return c.Status(200).JSON(&fiber.Map{
			"message": "Config updated!",
			"status":  200,
		})
	})

	app.Post("/config/:name", func(c *fiber.Ctx) error {
		filename := c.Params("name")
		fileContent := []byte("{\n  \"hello\": \"World!\"\n}")
		filePath := path.Join(configDir, filename)
		ext := path.Ext(filename)

		if ext == "" {
			ext = "empty"
		}

		validExt := []string{".json", ".yaml", ".yml"}

		if !slices.Contains(validExt, ext) {
			return c.Status(400).JSON(&fiber.Map{
				"message": fmt.Sprint("Invalid filetype got [", ext, "] expected [", strings.Join(validExt, ", "), "]"),
				"status":  400,
			})
		}

		if err := ioutil.WriteFile(filePath, fileContent, 0777); err != nil {
			return c.Status(400).JSON(&fiber.Map{
				"message": "Invalid filetype",
				"status":  400,
			})
		}
		return c.Status(200).JSON(&fiber.Map{
			"message": "Config created!",
			"status":  200,
		})
	})

	app.Listen(":3003")
}
