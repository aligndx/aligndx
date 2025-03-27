package logger

import (
	"context"

	"github.com/aligndx/aligndx/internal/config"
)

type Logger interface {
	Debug(msg string, fields ...map[string]interface{})
	Info(msg string, fields ...map[string]interface{})
	Warn(msg string, fields ...map[string]interface{})
	Error(msg string, fields ...map[string]interface{})
	Fatal(msg string, fields ...map[string]interface{})
}

type LoggerWrapper struct {
	logger   Logger
	minLevel LogLevel
}

func NewLoggerWrapper(loggerType string, ctx context.Context) *LoggerWrapper {
	var logger Logger
	configManager := config.NewConfigManager()
	cfg := configManager.GetConfig()

	switch loggerType {
	default:
		logger = NewZeroLogger(loggerType, ctx, true)
	}
	minLevel := ParseLevel(cfg.Logging.Level)

	return &LoggerWrapper{logger: logger, minLevel: minLevel}

}

func (lw *LoggerWrapper) Debug(msg string, fields ...map[string]interface{}) {
	if DebugLevel >= lw.minLevel {
		lw.logger.Debug(msg, fields...)
	}
}

func (lw *LoggerWrapper) Info(msg string, fields ...map[string]interface{}) {
	if InfoLevel >= lw.minLevel {
		lw.logger.Info(msg, fields...)
	}
}

func (lw *LoggerWrapper) Warn(msg string, fields ...map[string]interface{}) {
	if WarnLevel >= lw.minLevel {
		lw.logger.Warn(msg, fields...)
	}
}

func (lw *LoggerWrapper) Error(msg string, fields ...map[string]interface{}) {
	if ErrorLevel >= lw.minLevel {
		lw.logger.Error(msg, fields...)
	}
}

func (lw *LoggerWrapper) Fatal(msg string, fields ...map[string]interface{}) {
	if FatalLevel >= lw.minLevel {
		lw.logger.Fatal(msg, fields...)
	}
}
