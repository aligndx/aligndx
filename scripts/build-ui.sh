#!/bin/bash
set -euo pipefail

# Disable telemetry for Next.js
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_OUTPUT_MODE='static'

echo "Building Static UI..."
cd ui
npm ci
npm run build
cd ..

echo "UI build completed."
