package logger

import (
	"strconv"
	"strings"
)

type LogLevel int

const (
	DebugLevel LogLevel = iota
	InfoLevel
	WarnLevel
	ErrorLevel
	FatalLevel
)

func ParseLevel(s string) LogLevel {
	// Try numeric
	if i, err := strconv.Atoi(strings.TrimSpace(s)); err == nil {
		switch LogLevel(i) {
		case DebugLevel, InfoLevel, WarnLevel, ErrorLevel, FatalLevel:
			return LogLevel(i)
		}
	}

	// Fallback to name
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "debug":
		return DebugLevel
	case "info":
		return InfoLevel
	case "warn", "warning":
		return WarnLevel
	case "error":
		return ErrorLevel
	case "fatal":
		return FatalLevel
	default:
		return InfoLevel
	}
}
