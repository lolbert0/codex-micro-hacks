#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RUNTIME="$ROOT/runtime"
PIDFILE="$RUNTIME/router.pid"
LOGFILE="$RUNTIME/router.log"
SESSION="codex-micro-router"

mkdir -p "$RUNTIME"
if /usr/bin/screen -list | grep -q "\.$SESSION[[:space:]]"; then
    printf 'Codex Micro Router is already running.\n'
    exit 0
fi

rm -f "$PIDFILE"
cd "$ROOT"
/usr/bin/screen -dmS "$SESSION" /bin/sh -c "exec /usr/local/bin/node \"$ROOT/src/cli.js\" control >>\"$LOGFILE\" 2>&1"
sleep 0.5
if ! /usr/bin/screen -list | grep -q "\.$SESSION[[:space:]]"; then
    printf 'Codex Micro Router failed to remain running. Check: %s\n' "$LOGFILE" >&2
    exit 1
fi
printf 'Codex Micro Router started. Log: %s\n' "$LOGFILE"
