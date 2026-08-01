const { execFile } = require("node:child_process");

const SPOTIFY_STATE_SCRIPT = [
  "if application \"Spotify\" is running then",
  "tell application \"Spotify\" to return player state as text",
  "else",
  "return \"stopped\"",
  "end if"
];

function querySpotifyState(timeoutMs = 1500) {
  const args = SPOTIFY_STATE_SCRIPT.flatMap((line) => ["-e", line]);
  return new Promise((resolve, reject) => {
    execFile("/usr/bin/osascript", args, { timeout: timeoutMs, encoding: "utf8" }, (error, stdout) => {
      if (error) return reject(error);
      const state = stdout.trim().toLowerCase();
      resolve(["playing", "paused", "stopped"].includes(state) ? state : "unavailable");
    });
  });
}

class SpotifyPlaybackSource {
  constructor(config, query = querySpotifyState, clock = () => Date.now()) {
    this.config = config;
    this.query = query;
    this.clock = clock;
    this.cached = { state: "unavailable", isPlaying: false, checkedAt: 0 };
  }

  async getState({ force = false } = {}) {
    const now = this.clock();
    if (!force && this.cached.checkedAt && now - this.cached.checkedAt < this.config.pollIntervalMs) {
      return this.cached;
    }
    try {
      const state = await this.query(this.config.queryTimeoutMs);
      this.cached = { state, isPlaying: state === "playing", checkedAt: now };
    } catch (error) {
      this.cached = { state: "unavailable", isPlaying: false, checkedAt: now, error: error.message };
    }
    return this.cached;
  }
}

module.exports = { SpotifyPlaybackSource, querySpotifyState, SPOTIFY_STATE_SCRIPT };
