package auth

import (
	"bufio"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io/ioutil"
	"os"
	"strings"
	"time"
)

const (
	tokenFilePath = "./tokens"
)

func IsTokenValid(token string) (bool, error) {
	f, err := os.OpenFile(tokenFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	defer f.Close()
	if err != nil {
		return false, err
	}
	s := bufio.NewScanner(f)
	for s.Scan() {
		tokenAndDate := s.Text()
		fileToken := strings.Split(tokenAndDate, "~")[0]
		if hashToken(token) != fileToken {
			continue
		}

		dateString := strings.Split(tokenAndDate, "~")[1]
		date, err := time.Parse(time.RFC3339, dateString)
		if err != nil {
			return false, err
		}
		if token == fileToken && date.Unix() < time.Now().Unix() {
			return false, errors.New("Token expired")
		}
	}
	return true, err
}

func GenerateToken(expireDate time.Time, meta string) (string, error) {
	token := generateSecureToken(32)
	hashedToken := hashToken(token)
	f, err := os.OpenFile(tokenFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	defer f.Close()

	if err != nil {
		return "", err
	}

	line := hashedToken + "~" + expireDate.Format(time.RFC3339) + "~" + meta + "\n"

	if _, err := f.WriteString(line); err != nil {
		return "", err
	}

	return token, nil
}

func GetTokens() ([]string, error) {
	file, err := ioutil.ReadFile(tokenFilePath)
	if err != nil {
		return nil, err
	}
	return strings.Split(string(file), "\n"), nil
}

func hashToken(token string) string {
	byteHash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(byteHash[:])
}

func generateSecureToken(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return "rsb_" + hex.EncodeToString(b)
}
