#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
APP="$ROOT/dist/Codex Micro Router.app"
CONTENTS="$APP/Contents"

mkdir -p "$CONTENTS/MacOS"
cp "$ROOT/macos/Info.plist" "$CONTENTS/Info.plist"
clang "$ROOT/macos/RouterLauncher.c" -o "$CONTENTS/MacOS/CodexMicroRouter"
codesign --force --deep --sign - "$APP"
printf '%s\n' "$APP"
