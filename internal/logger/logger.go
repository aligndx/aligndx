package logger

import (
	"context"
)

type Logger interface {
	Debug(msg string, fields ...map[string]interface{})
	Info(msg string, fields ...map[string]interface{})
	Warn(msg string, fields ...map[string]interface{})
	Error(msg string, fields ...map[string]interface{})
	Fatal(msg string, fields ...map[string]interface{})
}

type LoggerWrapper struct {
	logger Logger
}

func NewLoggerWrapper(loggerType string, ctx context.Context) *LoggerWrapper {
	var logger Logger

	switch loggerType {
	default:
		logger = NewZeroLogger(loggerType, ctx, true)
	}

	return &LoggerWrapper{logger: logger}
}

func (lw *LoggerWrapper) Debug(msg string, fields ...map[string]interface{}) {
	lw.logger.Debug(msg, fields...)
}

func (lw *LoggerWrapper) Info(msg string, fields ...map[string]interface{}) {
	lw.logger.Info(msg, fields...)
}

func (lw *LoggerWrapper) Warn(msg string, fields ...map[string]interface{}) {
	lw.logger.Warn(msg, fields...)
}

func (lw *LoggerWrapper) Error(msg string, fields ...map[string]interface{}) {
	lw.logger.Error(msg, fields...)
}

func (lw *LoggerWrapper) Fatal(msg string, fields ...map[string]interface{}) {
	lw.logger.Fatal(msg, fields...)
}
