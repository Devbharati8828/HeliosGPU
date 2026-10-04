export class WebGPUEngine {
  static instance = null;

  constructor() {
    this.adapter = null;
    this.device = null;
    this.isInitialized = false;
  }

  static initPromise = null;

  static async getInstance() {
    if (!WebGPUEngine.instance) {
      WebGPUEngine.instance = new WebGPUEngine();
      WebGPUEngine.initPromise = WebGPUEngine.instance.init().catch(err => {
        WebGPUEngine.instance = null;
        WebGPUEngine.initPromise = null;
        throw err;
      });
    }
    await WebGPUEngine.initPromise;
    return WebGPUEngine.instance;
  }

  async init() {
    if (this.isInitialized) return;

    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    this.adapter = await navigator.gpu.requestAdapter();

    if (!this.adapter) {
      throw new Error("No appropriate WebGPU adapter found.");
    }

    this.device = await this.adapter.requestDevice();
    this.isInitialized = true;
    
    // Listen for device loss
    this.device.lost.then((info) => {
      console.error(`WebGPU device lost: ${info.message}`);
      this.isInitialized = false;
      WebGPUEngine.instance = null;
    });

    // Engine ready
  }

  getDevice() {
    if (!this.isInitialized) {
      throw new Error("WebGPUEngine is not initialized. Call init() first.");
    }
    return this.device;
  }
}
