#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PIDFILE="$ROOT/runtime/router.pid"
SESSION="codex-micro-router"

if ! /usr/bin/screen -list | grep -q "\.$SESSION[[:space:]]"; then
    rm -f "$PIDFILE"
    printf 'Codex Micro Router is not running. Default ownership is unchanged.\n'
    exit 0
fi

/usr/bin/screen -S "$SESSION" -X quit
rm -f "$PIDFILE"
printf 'Codex Micro Router stopped. Codex remains the Layer 1 lighting owner.\n'
