#!/usr/bin/env node
const path = require("node:path");
const { loadConfig } = require("./config");
const { LightingRouter } = require("./router");
const { WorkLouderTransport } = require("./vendor-kit");
const { SpotifyPlaybackSource } = require("./spotify");

const command = process.argv[2] || "simulate";
const explicitConfig = process.env.MICRO_ROUTER_CONFIG;
const controlConfig = path.join(__dirname, "..", "config", "device-writes-enabled.json");
const selectedConfig = command === "control" ? controlConfig : explicitConfig;
const { config, path: configPath } = loadConfig(selectedConfig);
const transport = new WorkLouderTransport(config);
const router = new LightingRouter(config, transport);
const spotify = new SpotifyPlaybackSource(config.spotify);
const maximumTicks = Number.parseInt(process.env.MICRO_ROUTER_MAX_TICKS || "0", 10);
let stopping = false;

function line(value) {
  process.stdout.write(`${JSON.stringify({ at: new Date().toISOString(), ...value })}\n`);
}

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  try { await transport.disconnect(); } catch (error) { line({ level: "warn", message: error.message }); }
  line({ event: "stopped", rollback: "No firmware configuration was changed; Codex remains the Layer 1 owner." });
  process.exitCode = code;
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

async function once() {
  const status = await transport.status();
  line({ event: "status", config: configPath, device: transport.device, status });
  await stop();
}

async function loop(mode) {
  line({ event: "started", mode, config: configPath, writesEnabled: config.safety.deviceWritesEnabled });
  let ticks = 0;
  while (!stopping) {
    try {
      const [status, playback] = await Promise.all([
        transport.status(),
        spotify.getState()
      ]);
      const result = await router.tick(status.selectedLayerIndex, { spotifyPlaying: playback.isPlaying });
      result.spotifyState = playback.state;
      if (playback.error) result.spotifyError = playback.error;
      if (result.changed || (result.action === "write" && router.writeCount % 10 === 1)) line({ event: "route", ...result });
    } catch (error) {
      line({ level: "error", message: error.message });
      await transport.disconnect().catch(() => {});
      router.invalidateTransportState();
      await new Promise((resolve) => setTimeout(resolve, config.device.reconnectDelayMs));
    }
    ticks += 1;
    if (maximumTicks > 0 && ticks >= maximumTicks) {
      line({ event: "test-complete", ticks, writes: router.writeCount });
      await stop();
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, config.device.pollIntervalMs));
  }
}

async function main() {
  if (command === "status") return once();
  if (!["simulate", "observe", "control"].includes(command)) {
    throw new Error(`Unknown command: ${command}`);
  }
  if (command === "control" && !config.safety.deviceWritesEnabled) {
    throw new Error("Control mode requires deviceWritesEnabled=true");
  }
  return loop(command);
}

main().catch(async (error) => {
  line({ level: "fatal", message: error.message });
  await stop(1);
});
