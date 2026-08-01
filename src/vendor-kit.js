const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const INPUT_MODULES = "/Applications/input.app/Contents/Resources/app.asar.unpacked/node_modules";
const KIT_PATH = path.join(INPUT_MODULES, "@worklouder", "wl-device-kit");

function loadVendorKit() {
  if (!fs.existsSync(KIT_PATH)) {
    throw new Error("Work Louder Input device library was not found. Install or update Input, then retry.");
  }
  const projectModules = path.join(__dirname, "..", "node_modules");
  process.env.NODE_PATH = [projectModules, INPUT_MODULES, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
  Module.Module._initPaths();

  // The base kit imports its firmware-flashing serial dependency eagerly even
  // though this router only uses HID. Avoid loading an unrelated native module
  // into Input's signed runtime; the stub is never called by the HID path.
  const originalLoad = Module.Module._load;
  Module.Module._load = function loadWithoutSerial(request, parent, isMain) {
    if (request === "serialport") {
      return { SerialPort: class SerialPortNotAvailable {
        static async list() { return []; }
      } };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(KIT_PATH);
  } finally {
    Module.Module._load = originalLoad;
  }
}

class WorkLouderTransport {
  constructor(config) {
    this.config = config;
    this.comm = null;
    this.api = null;
    this.rpc = null;
    this.device = null;
  }

  async connect() {
    if (this.comm?.isConnected()) return;
    const kit = loadVendorKit();
    const devices = new kit.WLDeviceDiscovery().findWLDevices([this.config.device.type]);
    this.device = devices.find((device) => Number(device.devicePid) === this.config.device.productId);
    if (!this.device) throw new Error("Codex Micro was not found");
    this.comm = new kit.WLDeviceCommImpl();
    await this.comm.connect(this.device);
    this.api = new kit.WLRPCApi(this.comm);
    this.rpc = this.api.getRpcClient();
  }

  async status() {
    await this.connect();
    return this.withTimeout(this.api.getDeviceStatus(), "Device status");
  }

  async sendLighting(frame) {
    await this.connect();
    const minimize = (side) => ({
      e: side.effect,
      b: side.brightness,
      s: side.speed,
      m: side.magic,
      c: side.color
    });
    await this.withTimeout(this.rpc.sendRpcCall({
      method: "v.oai.rgbcfg",
      params: { ambient: minimize(frame.ambient), keys: minimize(frame.keys) }
    }), "Lighting update");
  }

  async withTimeout(promise, label) {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`${label} timed out after ${this.config.device.rpcTimeoutMs} ms`)), this.config.device.rpcTimeoutMs);
        })
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async disconnect() {
    if (this.comm) await this.comm.disconnect();
    this.comm = null;
    this.api = null;
    this.rpc = null;
  }
}

module.exports = { WorkLouderTransport, loadVendorKit };
