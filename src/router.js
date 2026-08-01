class LightingRouter {
  constructor(config, transport, clock = () => Date.now()) {
    this.config = config;
    this.transport = transport;
    this.clock = clock;
    this.lastWriteAt = 0;
    this.lastLayer = undefined;
    this.lastSpotifyPlaying = undefined;
    this.writeCount = 0;
    this.lastFrameKey = undefined;
  }

  normalizeLayer(rawLayer) {
    if (!Number.isInteger(rawLayer)) return undefined;
    return rawLayer;
  }

  desiredFrame(rawLayer, spotifyPlaying = false) {
    const layer = this.normalizeLayer(rawLayer);
    if (layer === this.config.layers.spotify) {
      return spotifyPlaying ? this.config.lighting.spotify : this.config.lighting.off;
    }
    return null;
  }

  invalidateTransportState() {
    this.lastWriteAt = 0;
    this.lastLayer = undefined;
    this.lastSpotifyPlaying = undefined;
    this.lastFrameKey = undefined;
  }

  async tick(rawLayer, { force = false, spotifyPlaying = false } = {}) {
    const layer = this.normalizeLayer(rawLayer);
    const frame = this.desiredFrame(layer, spotifyPlaying);
    const changed = layer !== this.lastLayer || spotifyPlaying !== this.lastSpotifyPlaying;
    this.lastLayer = layer;
    this.lastSpotifyPlaying = spotifyPlaying;

    if (!frame) return { action: "yield", layer, changed, spotifyPlaying };
    if (!this.config.safety.deviceWritesEnabled) return { action: "simulate", layer, frame, changed, spotifyPlaying };

    const frameKey = spotifyPlaying ? "spotify-playing" : "spotify-off";
    const minimumGap = Math.max(
      this.config.device.writeIntervalMs,
      Math.ceil(1000 / this.config.safety.maximumWritesPerSecond)
    );
    const now = this.clock();
    const frameChanged = frameKey !== this.lastFrameKey || changed;
    if (!force && !frameChanged && now - this.lastWriteAt < this.config.device.lightingKeepaliveMs) {
      return { action: "hold", layer, changed: false, spotifyPlaying };
    }
    if (!force && !frameChanged && now - this.lastWriteAt < minimumGap) {
      return { action: "rate-limited", layer, changed: false, spotifyPlaying };
    }

    await this.transport.sendLighting(frame);
    this.lastWriteAt = now;
    this.lastFrameKey = frameKey;
    this.writeCount += 1;
    return { action: "write", layer, frame, changed, spotifyPlaying };
  }
}

module.exports = { LightingRouter };
