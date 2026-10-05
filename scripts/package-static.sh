#!/usr/bin/env bash
set -euo pipefail
project="${1:?project directory required}"
archive="${2:?archive path required}"
test -f "$project/dist/index.html"
test -f "$project/.openai/hosting.json"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/dist/.openai"
cp -R "$project/dist/." "$stage/dist/"
cp "$project/.openai/hosting.json" "$stage/dist/.openai/hosting.json"
tar -C "$stage" -czf "$archive" dist
tar -tzf "$archive"
