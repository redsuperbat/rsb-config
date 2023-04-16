package auth

import (
	"bufio"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"os"
	"strings"
	"time"
)

const (
	tokenFilePath = "./tokens"
)

func validateTokenTimestamp(serverToken string) bool {
	dateString := strings.Split(serverToken, "~")[1]
	date, err := time.Parse(time.RFC3339, dateString)
	if err != nil {
		log.Println(err)
		return false
	}
	if date.Unix() < time.Now().Unix() {
		return false
	}
	return true
}

func IsTokenValid(clientToken string) bool {
	f, err := os.Open(tokenFilePath)
	if err != nil {
		log.Println(err)
		return false
	}
	defer f.Close()
	s := bufio.NewScanner(f)
	for s.Scan() {
		serverToken := s.Text()
		serverHash := strings.Split(serverToken, "~")[0]
		clientHash := hashToken(clientToken)
		if clientHash != serverHash {
			continue
		}
		return validateTokenTimestamp(serverToken)
	}
	if err := s.Err(); err != nil {
		log.Println(err)
	}
	return false
}

func GenerateToken(expireDate time.Time, meta string) (string, error) {
	token := generateSecureToken(32)
	hashedToken := hashToken(token)
	f, err := os.OpenFile(tokenFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	if err != nil {
		return "", err
	}
	defer f.Close()

	line := hashedToken + "~" + expireDate.Format(time.RFC3339) + "~" + meta + "\n"

	if _, err := f.WriteString(line); err != nil {
		return "", err
	}

	return token, nil
}

func GetTokens() ([]string, error) {
	file, err := os.ReadFile(tokenFilePath)
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
