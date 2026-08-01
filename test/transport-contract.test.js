const test = require("node:test");
const assert = require("node:assert/strict");

test("vendor RGB payload preserves the saved Spotify values", () => {
  const frame = {
    ambient: { effect: 4, brightness: 0.35, speed: 0.25, magic: 1, color: 0x1db954 },
    keys: { effect: 1, brightness: 0.6, speed: 0.5, magic: 1, color: 0x1db954 }
  };
  const minimize = (side) => ({ e: side.effect, b: side.brightness, s: side.speed, m: side.magic, c: side.color });
  const payload = { ambient: minimize(frame.ambient), keys: minimize(frame.keys) };
  assert.deepEqual(payload, {
    ambient: { e: 4, b: 0.35, s: 0.25, m: 1, c: 1947988 },
    keys: { e: 1, b: 0.6, s: 0.5, m: 1, c: 1947988 }
  });
});
