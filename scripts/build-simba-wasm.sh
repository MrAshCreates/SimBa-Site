#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INTERPRETER="$ROOT/simba_interpreter"
OUT_DIR="$ROOT/app/lib/simba-wasm"

export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$INTERPRETER/target}"

if ! command -v rustup >/dev/null 2>&1; then
  echo "rustup is required to build the SimBa WASM interpreter." >&2
  echo "Install it from https://rustup.rs then re-run: npm run build:wasm" >&2
  exit 1
fi

rustup target add wasm32-unknown-unknown >/dev/null
if ! command -v wasm-bindgen >/dev/null 2>&1; then
  cargo install wasm-bindgen-cli --locked
fi

cargo build --release --lib --target wasm32-unknown-unknown --manifest-path "$INTERPRETER/Cargo.toml"

mkdir -p "$OUT_DIR"
wasm-bindgen \
  "$CARGO_TARGET_DIR/wasm32-unknown-unknown/release/simba.wasm" \
  --out-dir "$OUT_DIR" \
  --target web \
  --out-name simba

rm -f "$OUT_DIR/simba_bg.js"

echo "Wrote WASM bindings to $OUT_DIR"
