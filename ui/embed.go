package ui

import (
	"embed"
	"io/fs"
)

//go:embed all:out
var outDir embed.FS

var OutDirFS, _ = fs.Sub(outDir, "out")
