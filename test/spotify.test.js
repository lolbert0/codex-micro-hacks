const test = require("node:test");
const assert = require("node:assert/strict");
const { SpotifyPlaybackSource } = require("../src/spotify");

test("only the exact playing state enables lighting", async () => {
  for (const state of ["paused", "stopped", "unavailable"]) {
    const source = new SpotifyPlaybackSource(
      { pollIntervalMs: 500, queryTimeoutMs: 1000 },
      async () => state,
      () => 1000
    );
    assert.equal((await source.getState()).isPlaying, false);
  }
  const playing = new SpotifyPlaybackSource(
    { pollIntervalMs: 500, queryTimeoutMs: 1000 },
    async () => "playing",
    () => 1000
  );
  assert.equal((await playing.getState()).isPlaying, true);
});

test("Spotify query failures fail closed", async () => {
  const source = new SpotifyPlaybackSource(
    { pollIntervalMs: 500, queryTimeoutMs: 1000 },
    async () => { throw new Error("not running"); },
    () => 1000
  );
  const result = await source.getState();
  assert.equal(result.state, "unavailable");
  assert.equal(result.isPlaying, false);
});

test("playback state is cached for the configured interval", async () => {
  let calls = 0;
  let now = 1000;
  const source = new SpotifyPlaybackSource(
    { pollIntervalMs: 500, queryTimeoutMs: 1000 },
    async () => { calls += 1; return "playing"; },
    () => now
  );
  await source.getState();
  now += 200;
  await source.getState();
  assert.equal(calls, 1);
  now += 500;
  await source.getState();
  assert.equal(calls, 2);
});
