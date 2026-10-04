import { WebGPUEngine } from './WebGPUEngine.js';
import shadowWGSL from './shaders/shadow.wgsl?raw';

export class ShadowCompute {
  constructor() {
    this.device = null;
    this.pipeline = null;
    this.isReady = false;
  }

  async init() {
    const engine = await WebGPUEngine.getInstance();
    this.device = engine.getDevice();

    const shaderModule = this.device.createShaderModule({
      label: 'Shadow Compute Shader',
      code: shadowWGSL,
    });

    this.pipeline = await this.device.createComputePipelineAsync({
      label: 'Shadow Compute Pipeline',
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    this.isReady = true;
  }

  /**
   * Computes shadows for a given elevation grid.
   * @param {Float32Array} elevations - The DEM heightmap
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @param {number} cellSize - Meters per pixel
   * @param {Array<number>} sunDir - [x, y, z] vector towards the sun
   * @returns {Promise<Float32Array>} - Shadow map (1.0 = lit, 0.0 = shadowed)
   */
  async compute(elevations, width, height, cellSize, sunDir) {
    if (!this.isReady) await this.init();

    // 1. Create Uniforms Buffer
    // Struct: gridWidth(u32), gridHeight(u32), cellSize(f32), pad(f32), sunDir(vec3<f32>), maxSteps(u32)
    const uniformsArray = new ArrayBuffer(32);
    const uniformsView = new DataView(uniformsArray);
    uniformsView.setUint32(0, width, true);
    uniformsView.setUint32(4, height, true);
    uniformsView.setFloat32(8, cellSize, true);
    uniformsView.setFloat32(12, 0, true); // pad
    uniformsView.setFloat32(16, sunDir[0], true);
    uniformsView.setFloat32(20, sunDir[1], true);
    uniformsView.setFloat32(24, sunDir[2], true);
    uniformsView.setUint32(28, Math.max(width, height), true); // maxSteps

    const uniformsBuffer = this.device.createBuffer({
      size: uniformsArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(uniformsBuffer, 0, uniformsArray);

    // 2. Create Elevation Storage Buffer
    const elevationBuffer = this.device.createBuffer({
      size: elevations.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(elevationBuffer, 0, elevations);

    // 3. Create Shadow Map Storage Buffer
    const shadowMapSize = width * height * 4; // 1 float32 per pixel
    const shadowBuffer = this.device.createBuffer({
      size: shadowMapSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // 4. Create Readback Buffer
    const readbackBuffer = this.device.createBuffer({
      size: shadowMapSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // 5. Create Bind Group
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformsBuffer } },
        { binding: 1, resource: { buffer: elevationBuffer } },
        { binding: 2, resource: { buffer: shadowBuffer } },
      ],
    });

    // 6. Encode and Submit Commands
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    
    // Workgroup size is 16x16
    const workgroupCountX = Math.ceil(width / 16);
    const workgroupCountY = Math.ceil(height / 16);
    passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY, 1);
    passEncoder.end();

    // Copy result to readback buffer
    commandEncoder.copyBufferToBuffer(shadowBuffer, 0, readbackBuffer, 0, shadowMapSize);
    
    this.device.queue.submit([commandEncoder.finish()]);

    // 7. Read back results
    await readbackBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = readbackBuffer.getMappedRange();
    
    // Clone data because arrayBuffer is detached on unmap
    const shadowData = new Float32Array(arrayBuffer.slice(0)); 
    readbackBuffer.unmap();

    // Clean up GPU resources
    uniformsBuffer.destroy();
    elevationBuffer.destroy();
    shadowBuffer.destroy();
    readbackBuffer.destroy();

    return shadowData;
  }
}
