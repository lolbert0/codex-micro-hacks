const fs = require("node:fs");
const path = require("node:path");

function assertNumber(value, name, min, max) {
  if (typeof value !== "number" || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
}

function validateSide(side, name) {
  assertNumber(side.effect, `${name}.effect`, 0, 6);
  assertNumber(side.brightness, `${name}.brightness`, 0, 1);
  assertNumber(side.speed, `${name}.speed`, 0, 1);
  assertNumber(side.magic, `${name}.magic`, 0, 255);
  assertNumber(side.color, `${name}.color`, 0, 0xffffff);
}

function validateConfig(config) {
  if (config.schemaVersion !== 1) throw new Error("Unsupported schemaVersion");
  if (config.layers.codex === config.layers.spotify) throw new Error("Codex and Spotify layers must differ");
  assertNumber(config.layers.codex, "layers.codex", 1, 6);
  assertNumber(config.layers.spotify, "layers.spotify", 1, 6);
  validateSide(config.lighting.spotify.ambient, "lighting.spotify.ambient");
  validateSide(config.lighting.spotify.keys, "lighting.spotify.keys");
  validateSide(config.lighting.off.ambient, "lighting.off.ambient");
  validateSide(config.lighting.off.keys, "lighting.off.keys");
  assertNumber(config.device.pollIntervalMs, "device.pollIntervalMs", 50, 1000);
  assertNumber(config.device.writeIntervalMs, "device.writeIntervalMs", 50, 1000);
  assertNumber(config.device.lightingKeepaliveMs, "device.lightingKeepaliveMs", 250, 5000);
  assertNumber(config.device.rpcTimeoutMs, "device.rpcTimeoutMs", 250, 5000);
  assertNumber(config.device.reconnectDelayMs, "device.reconnectDelayMs", 100, 5000);
  assertNumber(config.spotify.pollIntervalMs, "spotify.pollIntervalMs", 100, 5000);
  assertNumber(config.spotify.queryTimeoutMs, "spotify.queryTimeoutMs", 250, 5000);
  assertNumber(config.safety.maximumWritesPerSecond, "safety.maximumWritesPerSecond", 1, 20);
  return config;
}

function loadConfig(file) {
  const resolved = path.resolve(file || path.join(__dirname, "..", "config", "default.json"));
  return { config: validateConfig(JSON.parse(fs.readFileSync(resolved, "utf8"))), path: resolved };
}

module.exports = { loadConfig, validateConfig };
