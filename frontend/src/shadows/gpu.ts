import shadowWgsl from './shadow.wgsl?raw';
import { DEM_GRID_SIZE, type DemData } from './dem';

let devicePromise: Promise<GPUDevice | null> | undefined;

// Process-scoped so React Strict Mode remounts never destroy a live device.
export function getGpuDevice(): Promise<GPUDevice | null> {
  if (!devicePromise) {
    devicePromise = (async () => {
      if (!navigator.gpu) return null;
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return null;
        const device = await adapter.requestDevice();
        device.lost.then(() => { devicePromise = undefined; });
        return device;
      } catch (error) {
        console.error('WebGPU device initialization failed.', error);
        devicePromise = undefined;
        return null;
      }
    })();
  }
  return devicePromise;
}

const terrainWgsl = /* wgsl */ `
struct Camera {
  viewProjection: mat4x4<f32>,
  mapSize: f32,
  gridScale: f32,
  heightCenter: f32,
  heightExaggeration: f32,
}
@group(0) @binding(0) var<storage, read> elevation: array<f32>;
@group(0) @binding(1) var shadowMask: texture_2d<f32>;
@group(0) @binding(2) var<uniform> camera: Camera;
struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) gridPosition: vec2<u32>,
  @location(1) normal: vec3<f32>,
}
fn heightAt(grid: vec2<i32>) -> f32 {
  let limit = i32(camera.mapSize) - 1;
  let x = u32(clamp(grid.x, 0, limit));
  let y = u32(clamp(grid.y, 0, limit));
  return elevation[y * u32(camera.mapSize) + x];
}
@vertex
fn terrainVertex(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
  let cellIndex = vertexIndex / 6u;
  let side = u32(camera.mapSize) - 1u;
  let cell = vec2<u32>(cellIndex % side, cellIndex / side);
  let corner = array<vec2<u32>, 6>(
    vec2<u32>(0u, 0u), vec2<u32>(1u, 0u), vec2<u32>(0u, 1u),
    vec2<u32>(0u, 1u), vec2<u32>(1u, 0u), vec2<u32>(1u, 1u),
  )[vertexIndex % 6u];
  let grid = cell + corner;
  let gridFloat = vec2<f32>(grid);
  let h = heightAt(vec2<i32>(grid));
  let world = vec3<f32>(
    (gridFloat.x - camera.mapSize * 0.5) * camera.gridScale,
    (h - camera.heightCenter) * camera.heightExaggeration,
    (gridFloat.y - camera.mapSize * 0.5) * camera.gridScale,
  );
  let dhdx = heightAt(vec2<i32>(grid) + vec2<i32>(1, 0)) - heightAt(vec2<i32>(grid) - vec2<i32>(1, 0));
  let dhdz = heightAt(vec2<i32>(grid) + vec2<i32>(0, 1)) - heightAt(vec2<i32>(grid) - vec2<i32>(0, 1));
  var output: VertexOut;
  output.position = camera.viewProjection * vec4<f32>(world, 1.0);
  output.gridPosition = grid;
  output.normal = normalize(vec3<f32>(-dhdx * camera.heightExaggeration, 2.0 * camera.gridScale, -dhdz * camera.heightExaggeration));
  return output;
}
@fragment
fn terrainFragment(input: VertexOut) -> @location(0) vec4<f32> {
  let shadow = textureLoad(shadowMask, vec2<i32>(input.gridPosition), 0).r;
  let slopeLight = clamp(dot(input.normal, normalize(vec3<f32>(0.35, 0.8, -0.45))), 0.18, 1.0);
  let coolShadow = vec3<f32>(0.055, 0.115, 0.18);
  let warmSun = vec3<f32>(0.82, 0.42, 0.13) * slopeLight;
  return vec4<f32>(mix(coolShadow, warmSun, shadow), 1.0);
}`;

export class ShadowGpuRenderer {
  readonly device: GPUDevice;
  private readonly context: GPUCanvasContext;
  private readonly elevationBuffer: GPUBuffer;
  private readonly shadowTexture: GPUTexture;
  private readonly computeParamsBuffer: GPUBuffer;
  private readonly cameraBuffer: GPUBuffer;
  private readonly computePipeline: GPUComputePipeline;
  private readonly terrainPipeline: GPURenderPipeline;
  private readonly computeBindGroup: GPUBindGroup;
  private readonly terrainBindGroup: GPUBindGroup;
  private dem: DemData | undefined;

  constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
    this.device = device;
    this.context = canvas.getContext('webgpu') as GPUCanvasContext;
    if (!this.context) throw new Error('Unable to create a WebGPU canvas.');
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device, format: canvasFormat, alphaMode: 'opaque' });
    this.elevationBuffer = device.createBuffer({ size: DEM_GRID_SIZE * DEM_GRID_SIZE * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    this.shadowTexture = device.createTexture({ size: [DEM_GRID_SIZE, DEM_GRID_SIZE], format: 'rgba8unorm', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING });
    this.computeParamsBuffer = device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.cameraBuffer = device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: shadowWgsl }), entryPoint: 'main' } });
    const terrainModule = device.createShaderModule({ code: terrainWgsl });
    this.terrainPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: terrainModule, entryPoint: 'terrainVertex' },
      fragment: { module: terrainModule, entryPoint: 'terrainFragment', targets: [{ format: canvasFormat }] },
      primitive: { topology: 'triangle-list', cullMode: 'back' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
    });
    const shadowView = this.shadowTexture.createView();
    this.computeBindGroup = device.createBindGroup({ layout: this.computePipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: this.elevationBuffer } },
      { binding: 1, resource: shadowView },
      { binding: 2, resource: { buffer: this.computeParamsBuffer } },
    ] });
    this.terrainBindGroup = device.createBindGroup({ layout: this.terrainPipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: this.elevationBuffer } },
      { binding: 1, resource: shadowView },
      { binding: 2, resource: { buffer: this.cameraBuffer } },
    ] });
  }

  setDem(dem: DemData) {
    this.dem = dem;
    this.device.queue.writeBuffer(this.elevationBuffer, 0, dem.data);
  }

  render(sunDirection: [number, number, number], viewProjection: Float32Array, computeShadows = true) {
    if (!this.dem) return;
    const computeParams = new ArrayBuffer(48);
    new Float32Array(computeParams).set([...sunDirection, this.dem.gridScale]);
    new Uint32Array(computeParams)[4] = DEM_GRID_SIZE;
    this.device.queue.writeBuffer(this.computeParamsBuffer, 0, computeParams);
    const camera = new Float32Array(20);
    camera.set(viewProjection);
    camera[16] = DEM_GRID_SIZE;
    camera[17] = this.dem.gridScale;
    camera[18] = (this.dem.minHeight + this.dem.maxHeight) * 0.5;
    camera[19] = Math.max(1.4, Math.min(4.5, (this.dem.maxHeight - this.dem.minHeight) / 950));
    this.device.queue.writeBuffer(this.cameraBuffer, 0, camera);
    const colorTexture = this.context.getCurrentTexture();
    const depthTexture = this.device.createTexture({ size: [colorTexture.width, colorTexture.height], format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT });
    const encoder = this.device.createCommandEncoder();
    if (computeShadows) {
      const compute = encoder.beginComputePass();
      compute.setPipeline(this.computePipeline);
      compute.setBindGroup(0, this.computeBindGroup);
      compute.dispatchWorkgroups(DEM_GRID_SIZE / 8, DEM_GRID_SIZE / 8);
      compute.end();
    }
    const pass = encoder.beginRenderPass({
      colorAttachments: [{ view: colorTexture.createView(), clearValue: { r: 0.018, g: 0.027, b: 0.047, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
      depthStencilAttachment: { view: depthTexture.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'discard' },
    });
    pass.setPipeline(this.terrainPipeline);
    pass.setBindGroup(0, this.terrainBindGroup);
    pass.draw(6 * (DEM_GRID_SIZE - 1) * (DEM_GRID_SIZE - 1));
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
}
