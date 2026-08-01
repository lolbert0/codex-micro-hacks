#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PIDFILE="$ROOT/runtime/router.pid"
SESSION="codex-micro-router"

if /usr/bin/screen -list | grep -q "\.$SESSION[[:space:]]"; then
    printf 'running\n'
else
    printf 'stopped\n'
fi
