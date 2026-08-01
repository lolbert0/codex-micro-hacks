const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { loadConfig, validateConfig } = require("../src/config");

test("default configuration is safe and valid", () => {
  const { config } = loadConfig(path.join(__dirname, "..", "config", "default.json"));
  assert.equal(config.safety.deviceWritesEnabled, false);
  assert.equal(config.layers.spotify, 2);
  assert.equal(config.lighting.spotify.keys.color, 0x1db954);
});

test("rejects identical layer assignments", () => {
  const { config } = loadConfig(path.join(__dirname, "..", "config", "default.json"));
  const invalid = structuredClone(config);
  invalid.layers.spotify = invalid.layers.codex;
  assert.throws(() => validateConfig(invalid), /must differ/);
});
