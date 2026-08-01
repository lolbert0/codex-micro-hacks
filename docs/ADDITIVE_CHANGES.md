# Additive Changes

This repository is a sidecar implementation. It does not contain a modified copy of the original Codex Micro firmware or the Codex desktop integration.

## Native behavior retained

- Device firmware remains unchanged.
- Profile 0 remains the Default profile.
- Layer 1 remains assigned to Codex.
- Codex continues to own Layer 1 agent keys, commands, and lighting.
- Existing hardware layer switching remains intact.

## Added by this project

1. A read-only device-status poller that observes the selected hardware layer.
2. A local Spotify playback-state source using Spotify's macOS scripting interface.
3. A routing state machine:
   - Layer 1: yield without a device write.
   - Layer 2 + playing: send the Spotify lighting frame.
   - Layer 2 + any other state: send an all-off frame.
4. A Work Louder device-library adapter for real-time, non-persistent RGB updates.
5. Wireless request timeouts, reconnect behavior, write-rate controls, and lighting keepalives.
6. Simulation, observation, status, bounded-test, and control commands.
7. Reversible background lifecycle scripts.
8. Configuration validation and automated tests.

## Data and permissions

- Spotify state is evaluated locally.
- No Spotify Web API credentials are required.
- No audio is captured or stored.
- Runtime logs and personal device identifiers are excluded from the repository.
- macOS Input Monitoring is required for HID access.
- macOS Automation access may be required to query Spotify.

## Rollback boundary

Stopping the router ends all additive behavior. The project does not send a reset frame on exit and does not restore or flash firmware because it never changes firmware in the first place.
