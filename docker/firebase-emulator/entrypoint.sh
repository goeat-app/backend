#!/bin/sh
set -e

DATA_DIR="/data"
PROJECT="${EMULATOR_PROJECT_ID:-demo-goeat}"

mkdir -p "$DATA_DIR"

if [ -n "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
  exec firebase emulators:start \
    --only auth \
    --project "$PROJECT" \
    --import="$DATA_DIR" \
    --export-on-exit="$DATA_DIR"
fi

exec firebase emulators:start \
  --only auth \
  --project "$PROJECT" \
  --export-on-exit="$DATA_DIR"
