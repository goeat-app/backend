#!/bin/sh
set -e

DATA_DIR="/data/export"
PROJECT="${EMULATOR_PROJECT_ID:-demo-goeat}"

mkdir -p "$DATA_DIR"

if [ -f "$DATA_DIR/firebase-export-metadata.json" ]; then
  echo "📂 Importando dados de $DATA_DIR..."
  exec firebase emulators:start \
    --only auth \
    --project "$PROJECT" \
    --import="$DATA_DIR" \
    --export-on-exit="$DATA_DIR"
fi

echo "🆕 Iniciando sem dados..."
exec firebase emulators:start \
  --only auth \
  --project "$PROJECT" \
  --export-on-exit="$DATA_DIR"