# Codex Micro Spotify Router

An unofficial, reversible sidecar that adds Spotify-aware RGB lighting to a Work Louder Codex Micro without replacing its firmware or changing its original Codex mappings.

## What this adds

- Layer-aware RGB routing for the Codex Micro.
- Complete lighting ownership yield on Layer 1, preserving native Codex behavior.
- Spotify-green key backlighting and breathing underglow on Layer 2 while Spotify is playing.
- Automatic all-off lighting on Layer 2 when Spotify is paused, stopped, closed, or unavailable.
- Fast layer polling, bounded wireless timeouts, reconnect refreshes, and low-rate lighting keepalives.
- Safe simulation and observation modes.
- Reversible background start, status, and stop commands.
- Automated tests for configuration, routing, Spotify state handling, and the vendor payload contract.

## What this does not change

- Codex Micro firmware
- Keymaps or agent-key assignments
- The Default profile
- Native Layer 1 lighting or agent-status behavior
- Login items, unless you explicitly create one yourself

Stopping the router is the rollback. Layer 1 receives no RGB writes from this project.

## Current Layer 2 lighting

| Zone | Effect | Brightness | Speed | Color |
| --- | --- | ---: | ---: | --- |
| Keys | Solid | 60% | 0.50 | `#1DB954` |
| Underglow | Breath | 35% | 0.25 | `#1DB954` |

Only Spotify's exact `playing` state enables those lights. Every other state fails closed to an all-off frame.

## Requirements

- macOS
- Work Louder Input installed in `/Applications/input.app`
- A connected Codex Micro
- Node.js available at `/usr/local/bin/node`
- Spotify for macOS
- Input Monitoring permission for Node or the terminal/runtime that starts the router
- Automation permission to read Spotify's playback state

The project uses Work Louder Input's locally installed device library. It does not contain or redistribute Work Louder firmware.

## Install and verify

```sh
npm install
npm test
npm run status
npm run simulate
```

`simulate` reads routing state without writing RGB. Run the write-enabled mode only after the tests and simulation succeed:

```sh
npm run control
```

For a bounded live check:

```sh
MICRO_ROUTER_MAX_TICKS=100 npm run control
```

## Background controls

```sh
npm run router:start
npm run router:status
npm run router:stop
```

The background runner uses the macOS-provided `screen` utility so the authorized Node process can remain active. It is not installed as a login item.

## Safety modes

- `npm run simulate`: read the device and preview decisions; never write RGB.
- `npm run observe`: long-running write-safe observation.
- `npm run control`: apply Layer 2 RGB using `config/device-writes-enabled.json`.
- `npm run status`: make one read-only device-status query.

## Timing and reliability

- Layer polling: 100 ms
- Spotify polling: 300 ms
- Lighting keepalive: 750 ms
- Device RPC timeout: 700 ms
- Reconnect delay: 250 ms
- Maximum configured write rate: 10 writes/second

Layer or playback-state transitions bypass the keepalive delay. After a transport reconnect, the desired frame is immediately resent.

## Configuration

- `config/default.json` is write-safe and has `deviceWritesEnabled: false`.
- `config/device-writes-enabled.json` is loaded only by control mode.
- `config/rollback-snapshot.json` is a sanitized example of the pre-install baseline record.

Keep personal device serial numbers, local hashes, logs, and machine-specific paths out of commits.

## Repository contents

- `src/`: router, Spotify state source, configuration validation, CLI, and vendor transport adapter.
- `scripts/`: reversible background lifecycle commands.
- `config/`: safe and write-enabled configurations plus a sanitized rollback example.
- `test/`: automated behavior and contract tests.
- `macos/`: optional helper-app source and a deliberately disabled login-item template.
- `docs/ADDITIVE_CHANGES.md`: boundary between native Codex behavior and this sidecar.
- `PUBLISHING.md`: checklist for creating the personal GitHub repository.

## Disclaimer

This is an unofficial personal project and is not affiliated with or endorsed by Work Louder, Spotify, OpenAI, or Codex. Product names and trademarks belong to their respective owners.
