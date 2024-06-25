package logger

import (
	"context"
	"fmt"
	"os"
	"runtime"

	"github.com/rs/zerolog"
)

type ZeroLogger struct {
	logger zerolog.Logger
	ctx    context.Context
}

func NewZeroLogger(loggerType string, ctx context.Context) *ZeroLogger {
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	return &ZeroLogger{logger: logger, ctx: ctx}
}

func (l *ZeroLogger) Debug(msg string, fields map[string]interface{}) {
	l.logWithFields(zerolog.DebugLevel, msg, fields)
}

func (l *ZeroLogger) Info(msg string, fields map[string]interface{}) {
	l.logWithFields(zerolog.InfoLevel, msg, fields)
}

func (l *ZeroLogger) Warn(msg string, fields map[string]interface{}) {
	l.logWithFields(zerolog.WarnLevel, msg, fields)
}

func (l *ZeroLogger) Error(msg string, fields map[string]interface{}) {
	l.logWithFields(zerolog.ErrorLevel, msg, fields)
}

func (l *ZeroLogger) Fatal(msg string, fields map[string]interface{}) {
	l.logWithFields(zerolog.FatalLevel, msg, fields)
}

func (l *ZeroLogger) logWithFields(level zerolog.Level, msg string, fields map[string]interface{}) {
	// Capture the caller information
	_, file, line, ok := runtime.Caller(2) // Adjust the caller depth to skip the wrapper
	if ok {
		fields["caller"] = fmt.Sprintf("%s:%d", file, line)
	}

	event := l.logger.WithLevel(level)
	for k, v := range fields {
		switch value := v.(type) {
		case string:
			event = event.Str(k, value)
		case int:
			event = event.Int(k, value)
		case float64:
			event = event.Float64(k, value)
		case bool:
			event = event.Bool(k, value)
		case []string:
			event = event.Strs(k, value)
		case map[string]interface{}:
			event = event.Fields(value)
		default:
			event = event.Interface(k, value)
		}
	}
	event.Msg(msg)
}
