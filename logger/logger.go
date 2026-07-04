// Package logger provides a lightweight leveled logger for Kiro-Go.
//
// Levels (from most to least verbose):
//
//	DEBUG < INFO < WARN < ERROR
//
// The active level is configured via logger.Init at startup.
// Priority: LOG_LEVEL environment variable > provided fallback (usually
// taken from config.json "logLevel"). If neither is set or the value is
// unrecognized, the level defaults to INFO.
//
// Implementation: this package is a thin wrapper over rs/zerolog. The public
// API (Debugf/Infof/Warnf/Errorf/Fatalf, SetLevel/SetOutput/Init, SetSink) is
// kept stable so the ~45 call sites across the project need no changes. Two
// destinations are always written:
//
//	① console  — human-readable lines via zerolog.ConsoleWriter
//	② sink      — a registered callback (e.g. the admin "Global Logs" panel
//	             store), driven by a zerolog Hook
package logger

import (
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/rs/zerolog"
)

// Level represents a log severity. Kept as a distinct type (rather than
// re-exporting zerolog.Level) so existing call sites that reference
// logger.LevelInfo etc. continue to compile unchanged.
type Level int32

const (
	LevelDebug Level = iota
	LevelInfo
	LevelWarn
	LevelError
)

var (
	currentLevel atomic.Int32

	// mu guards rebuilds of the underlying logger (SetOutput / construction).
	mu sync.RWMutex
	zl zerolog.Logger

	// sink, when set, receives a copy of every emitted log line so a consumer
	// (e.g. the admin panel store) can persist it. It must never block: the
	// registered function is expected to hand off asynchronously. The logger
	// package deliberately does NOT import config, to avoid an import cycle;
	// main.go wires the sink at startup.
	sink atomic.Pointer[func(level, message string)]
)

func init() {
	currentLevel.Store(int32(LevelInfo))
	rebuild(os.Stderr)
	// zerolog's global timestamp format; ConsoleWriter overrides display below.
	zerolog.TimeFieldFormat = time.RFC3339
}

// sinkHook forwards every event to the registered sink (if any). zerolog calls
// Run with the level and the final message, which is exactly the (level,
// message) shape our sink expects — no byte parsing required.
type sinkHook struct{}

func (sinkHook) Run(_ *zerolog.Event, level zerolog.Level, message string) {
	emitSink(sinkLevelName(level), message)
}

// rebuild reconstructs the zerolog logger writing human-readable lines to w,
// with the sink hook attached. Called at init and whenever SetOutput changes
// the destination (mainly for tests).
func rebuild(w io.Writer) {
	cw := zerolog.ConsoleWriter{
		Out:        w,
		TimeFormat: "2006/01/02 15:04:05",
		// NoColor: the previous hand-rolled logger never emitted ANSI codes,
		// and this process commonly runs under air (output captured through a
		// pipe) on Windows, where color escapes turn into garbage in the
		// captured log. Keep plain text so console output is byte-for-byte the
		// familiar "2006/01/02 15:04:05 LEVEL message" shape in every sink.
		NoColor: true,
		// Render levels as the fixed-width upper-case tags the project has
		// always used (DEBUG / INFO  / WARN  / ERROR), so console output looks
		// unchanged from the previous hand-rolled logger.
		FormatLevel: func(i interface{}) string {
			s, _ := i.(string)
			switch strings.ToLower(s) {
			case "debug":
				return "DEBUG"
			case "info":
				return "INFO "
			case "warn":
				return "WARN "
			case "error":
				return "ERROR"
			case "fatal":
				return "FATAL"
			}
			return strings.ToUpper(s)
		},
	}

	mu.Lock()
	zl = zerolog.New(cw).Hook(sinkHook{}).With().Timestamp().Logger()
	mu.Unlock()
}

func logger() *zerolog.Logger {
	mu.RLock()
	l := zl
	mu.RUnlock()
	return &l
}

// SetSink registers a function that receives every log line (level + formatted
// message). Pass nil to detach. The callback must not block the caller.
func SetSink(fn func(level, message string)) {
	if fn == nil {
		sink.Store(nil)
		return
	}
	sink.Store(&fn)
}

// emitSink forwards a line to the registered sink, if any.
func emitSink(level, message string) {
	if p := sink.Load(); p != nil {
		(*p)(level, message)
	}
}

// sinkLevelName maps a zerolog level to the canonical string the sink (and its
// tests) expect. NOTE: warn is reported as "warning" to preserve the exact
// strings the admin panel and existing tests rely on.
func sinkLevelName(l zerolog.Level) string {
	switch l {
	case zerolog.DebugLevel:
		return "debug"
	case zerolog.InfoLevel:
		return "info"
	case zerolog.WarnLevel:
		return "warning"
	case zerolog.ErrorLevel, zerolog.FatalLevel:
		return "error"
	}
	return "info"
}

// ParseLevel converts a textual level ("debug", "info", "warn", "error")
// to a Level. The ok flag is false when the input is empty or unknown.
func ParseLevel(s string) (Level, bool) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "debug", "trace":
		return LevelDebug, true
	case "info":
		return LevelInfo, true
	case "warn", "warning":
		return LevelWarn, true
	case "error", "err":
		return LevelError, true
	}
	return LevelInfo, false
}

// LevelName returns the canonical lowercase name of a Level.
func LevelName(l Level) string {
	switch l {
	case LevelDebug:
		return "debug"
	case LevelInfo:
		return "info"
	case LevelWarn:
		return "warn"
	case LevelError:
		return "error"
	}
	return "info"
}

// SetLevel sets the active log level.
func SetLevel(l Level) {
	currentLevel.Store(int32(l))
}

// GetLevel returns the active log level.
func GetLevel() Level {
	return Level(currentLevel.Load())
}

// SetOutput redirects console output to w. Useful for tests. The sink hook is
// preserved. To get plain (non-colored, parse-friendly) output in tests, pass
// any writer; ConsoleWriter does not emit ANSI codes when the target is not a
// TTY.
func SetOutput(w io.Writer) {
	rebuild(w)
}

// Init configures the logger. The LOG_LEVEL environment variable, if set,
// overrides the supplied fallback (typically config.GetLogLevel()).
func Init(fallback string) {
	value := fallback
	if env := os.Getenv("LOG_LEVEL"); env != "" {
		value = env
	}
	if l, ok := ParseLevel(value); ok {
		SetLevel(l)
	}
}

func enabled(l Level) bool {
	return Level(currentLevel.Load()) <= l
}

// Debugf logs a formatted message at DEBUG level.
func Debugf(format string, v ...interface{}) {
	if enabled(LevelDebug) {
		logger().Debug().Msg(fmt.Sprintf(format, v...))
	}
}

// Infof logs a formatted message at INFO level.
func Infof(format string, v ...interface{}) {
	if enabled(LevelInfo) {
		logger().Info().Msg(fmt.Sprintf(format, v...))
	}
}

// Warnf logs a formatted message at WARN level.
func Warnf(format string, v ...interface{}) {
	if enabled(LevelWarn) {
		logger().Warn().Msg(fmt.Sprintf(format, v...))
	}
}

// Errorf logs a formatted message at ERROR level.
func Errorf(format string, v ...interface{}) {
	if enabled(LevelError) {
		logger().Error().Msg(fmt.Sprintf(format, v...))
	}
}

// Fatalf logs a formatted message at ERROR level and terminates the process.
// The message is emitted unconditionally (level gate does not apply to fatal),
// matching the previous behavior.
func Fatalf(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	// Use Error (not zerolog's Fatal) so the sink hook runs and the panel
	// records the line before we exit; then terminate explicitly.
	logger().Error().Msg(msg)
	os.Exit(1)
}
