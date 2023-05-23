package auth

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestValidateToken(t *testing.T) {
	isoDate := time.Now().AddDate(1, 0, 0).Format(time.RFC3339)
	validToken := fmt.Sprintf("6ecd27306f2cb00502c76069acb4038781001c66c73aa570bcf3db1efcf6e503~%s~session", isoDate)
	result := validateTokenTimestamp(validToken)
	assert.True(t, result)
	invalidToken := "6ecd27306f2cb00502c76069acb4038781001c66c73aa570bcf3db1efcf6e503~2022-04-16T14:48:00+02:00~session"
	result = validateTokenTimestamp(invalidToken)
	assert.False(t, result)
}
