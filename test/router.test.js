const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { loadConfig } = require("../src/config");
const { LightingRouter } = require("../src/router");

function config(writes) {
  const loaded = loadConfig(path.join(__dirname, "..", "config", writes ? "device-writes-enabled.json" : "default.json")).config;
  return loaded;
}

test("Layer 1 yields lighting ownership to Codex", async () => {
  const sent = [];
  const router = new LightingRouter(config(true), { sendLighting: async (frame) => sent.push(frame) });
  const result = await router.tick(1);
  assert.equal(result.action, "yield");
  assert.equal(sent.length, 0);
});

test("Layer 2 renders Spotify in simulation without writes", async () => {
  const sent = [];
  const router = new LightingRouter(config(false), { sendLighting: async (frame) => sent.push(frame) });
  const result = await router.tick(2, { spotifyPlaying: true });
  assert.equal(result.action, "simulate");
  assert.equal(result.frame.keys.color, 0x1db954);
  assert.equal(sent.length, 0);
});

test("Layer 2 writes immediately then uses a low-rate keepalive", async () => {
  const sent = [];
  let now = 1000;
  const router = new LightingRouter(config(true), { sendLighting: async (frame) => sent.push(frame) }, () => now);
  assert.equal((await router.tick(2, { spotifyPlaying: true })).action, "write");
  assert.equal(sent.length, 1);
  now += 50;
  assert.equal((await router.tick(2, { spotifyPlaying: true })).action, "hold");
  now += 700;
  assert.equal((await router.tick(2, { spotifyPlaying: true })).action, "write");
  assert.equal(sent.length, 2);
});

test("switching back to Layer 1 stops all router writes", async () => {
  const sent = [];
  let now = 1000;
  const router = new LightingRouter(config(true), { sendLighting: async (frame) => sent.push(frame) }, () => now);
  await router.tick(2, { spotifyPlaying: true });
  now += 200;
  const result = await router.tick(1);
  assert.equal(result.action, "yield");
  assert.equal(sent.length, 1);
});

test("Layer 2 writes an all-off frame when Spotify is not playing", async () => {
  const sent = [];
  const router = new LightingRouter(config(true), { sendLighting: async (frame) => sent.push(frame) }, () => 1000);
  const result = await router.tick(2, { spotifyPlaying: false });
  assert.equal(result.action, "write");
  assert.equal(result.spotifyPlaying, false);
  assert.deepEqual(sent[0], {
    ambient: { effect: 0, brightness: 0, speed: 0, magic: 0, color: 0 },
    keys: { effect: 0, brightness: 0, speed: 0, magic: 0, color: 0 }
  });
});

test("a playing-to-paused change selects the off frame", async () => {
  const sent = [];
  let now = 1000;
  const router = new LightingRouter(config(true), { sendLighting: async (frame) => sent.push(frame) }, () => now);
  await router.tick(2, { spotifyPlaying: true });
  now += 200;
  const result = await router.tick(2, { spotifyPlaying: false });
  assert.equal(result.action, "write");
  assert.equal(result.changed, true);
  assert.equal(sent[1].keys.effect, 0);
  assert.equal(sent[1].ambient.brightness, 0);
});

test("a layer transition bypasses the keepalive delay", async () => {
  const sent = [];
  let now = 1000;
  const router = new LightingRouter(config(true), { sendLighting: async (frame) => sent.push(frame) }, () => now);
  await router.tick(2, { spotifyPlaying: true });
  now += 50;
  await router.tick(1, { spotifyPlaying: true });
  now += 50;
  const result = await router.tick(2, { spotifyPlaying: true });
  assert.equal(result.action, "write");
  assert.equal(result.changed, true);
  assert.equal(sent.length, 2);
});

test("a transport reconnect forces an immediate lighting refresh", async () => {
  const sent = [];
  let now = 1000;
  const router = new LightingRouter(config(true), { sendLighting: async (frame) => sent.push(frame) }, () => now);

  await router.tick(2, { spotifyPlaying: true });
  now += 100;
  router.invalidateTransportState();
  const refreshed = await router.tick(2, { spotifyPlaying: true });

  assert.equal(refreshed.action, "write");
  assert.equal(sent.length, 2);
});
