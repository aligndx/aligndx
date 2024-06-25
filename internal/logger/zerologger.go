package logger

import (
	"context"
	"fmt"
	"os"
	"runtime"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/pkgerrors"
)

type ZeroLogger struct {
	logger zerolog.Logger
	ctx    context.Context
	pretty bool
}

func NewZeroLogger(loggerType string, ctx context.Context, pretty bool) *ZeroLogger {
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
	var logger zerolog.Logger

	if pretty {
		output := zerolog.ConsoleWriter{Out: os.Stdout}
		logger = zerolog.New(output).With().Timestamp().Logger()
	} else {
		logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
	}

	return &ZeroLogger{logger: logger, ctx: ctx, pretty: pretty}
}
func (l *ZeroLogger) Debug(msg string, fields ...map[string]interface{}) {
	l.logWithFields(zerolog.DebugLevel, msg, fields...)
}

func (l *ZeroLogger) Info(msg string, fields ...map[string]interface{}) {
	l.logWithFields(zerolog.InfoLevel, msg, fields...)
}

func (l *ZeroLogger) Warn(msg string, fields ...map[string]interface{}) {
	l.logWithFields(zerolog.WarnLevel, msg, fields...)
}

func (l *ZeroLogger) Error(msg string, fields ...map[string]interface{}) {
	l.logWithFields(zerolog.ErrorLevel, msg, fields...)
}

func (l *ZeroLogger) Fatal(msg string, fields ...map[string]interface{}) {
	l.logWithFields(zerolog.FatalLevel, msg, fields...)
}

func (l *ZeroLogger) logWithFields(level zerolog.Level, msg string, fields ...map[string]interface{}) {
	eventFields := make(map[string]interface{})

	// Capture the caller information if the level is Debug, Error, or Fatal
	if level == zerolog.DebugLevel || level == zerolog.ErrorLevel || level == zerolog.FatalLevel {
		_, file, line, ok := runtime.Caller(3) // Adjust the caller depth to skip the wrapper
		if ok {
			eventFields["caller"] = fmt.Sprintf("%s:%d", file, line)
		}
	}

	if len(fields) > 0 {
		for _, fieldMap := range fields {
			for k, v := range fieldMap {
				eventFields[k] = v
			}
		}
	}

	event := l.logger.WithLevel(level)
	for k, v := range eventFields {
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
