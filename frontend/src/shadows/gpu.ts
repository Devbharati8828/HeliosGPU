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

// ── TERRAIN RENDER SHADER ─────────────────────────────────────────────────────
// Only this shader block is responsible for the visual appearance of the
// Shadows-mode terrain mesh. The compute shadow shader (shadow.wgsl) is
// untouched — it still writes 0/1 into shadowMask which we read here.
const terrainWgsl = /* wgsl */ `
// Camera uniform layout (24 x f32 = 96 bytes):
//   [0..15]  viewProjection      mat4x4<f32>
//   [16]     mapSize             f32
//   [17]     gridScale           f32
//   [18]     heightCenter        f32
//   [19]     heightExaggeration  f32
//   [20]     minHeight           f32   (metres — DEM-local minimum)
//   [21]     maxHeight           f32   (metres — DEM-local maximum)
//   [22,23]  _pad0, _pad1        f32 x 2
struct Camera {
  viewProjection:     mat4x4<f32>,
  mapSize:            f32,
  gridScale:          f32,
  heightCenter:       f32,
  heightExaggeration: f32,
  minHeight:          f32,
  maxHeight:          f32,
  _pad0:              f32,
  _pad1:              f32,
}
@group(0) @binding(0) var<storage, read> elevation: array<f32>;
@group(0) @binding(1) var shadowMask: texture_2d<f32>;
@group(0) @binding(2) var<uniform> camera: Camera;

struct VertexOut {
  @builtin(position)  position:     vec4<f32>,
  @location(0) @interpolate(flat) gridPosition: vec2<u32>,
  @location(1)        normal:       vec3<f32>,
  @location(2)        elevNorm:     f32,   // [0,1] normalised within DEM min/max
}

fn heightAt(grid: vec2<i32>) -> f32 {
  let limit = i32(camera.mapSize) - 1;
  let x = u32(clamp(grid.x, 0, limit));
  let y = u32(clamp(grid.y, 0, limit));
  return elevation[y * u32(camera.mapSize) + x];
}

// Smooth cubic remap — same as GLSL smoothstep
fn remap01(edge0: f32, edge1: f32, t: f32) -> f32 {
  let x = clamp((t - edge0) / (edge1 - edge0), 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

@vertex
fn terrainVertex(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
  let cellIndex = vertexIndex / 6u;
  let side      = u32(camera.mapSize) - 1u;
  let cell      = vec2<u32>(cellIndex % side, cellIndex / side);
  let corner    = array<vec2<u32>, 6>(
    vec2<u32>(0u, 0u), vec2<u32>(1u, 0u), vec2<u32>(0u, 1u),
    vec2<u32>(0u, 1u), vec2<u32>(1u, 0u), vec2<u32>(1u, 1u),
  )[vertexIndex % 6u];
  let grid      = cell + corner;
  let gridFloat = vec2<f32>(grid);
  let h         = heightAt(vec2<i32>(grid));
  let world     = vec3<f32>(
    (gridFloat.x - camera.mapSize * 0.5) * camera.gridScale,
    (h - camera.heightCenter) * camera.heightExaggeration,
    (gridFloat.y - camera.mapSize * 0.5) * camera.gridScale,
  );
  let dhdx = heightAt(vec2<i32>(grid) + vec2<i32>(1, 0)) - heightAt(vec2<i32>(grid) - vec2<i32>(1, 0));
  let dhdz = heightAt(vec2<i32>(grid) + vec2<i32>(0, 1)) - heightAt(vec2<i32>(grid) - vec2<i32>(0, 1));
  var out: VertexOut;
  out.position     = camera.viewProjection * vec4<f32>(world, 1.0);
  out.gridPosition = grid;
  out.normal       = normalize(vec3<f32>(
    -dhdx * camera.heightExaggeration,
    2.0 * camera.gridScale,
    -dhdz * camera.heightExaggeration,
  ));
  let range     = max(camera.maxHeight - camera.minHeight, 1.0);
  out.elevNorm  = clamp((h - camera.minHeight) / range, 0.0, 1.0);
  return out;
}

// ── ELEVATION COLOUR RAMP ─────────────────────────────────────────────────────
//   0.00 – 0.40   vegetation / soil   #5a6b3d → #8a7a52
//   0.40 – 0.75   grey-brown rock     #7a7570 → #9a948c
//   0.75 – 0.92   lighter grey rock   #b8b2aa
//   0.92 – 1.00   snow cap            #f0eee8
// All transitions are smoothstep blended — no hard steps.
fn elevationColor(e: f32) -> vec3<f32> {
  let vegLow   = vec3<f32>(0.353, 0.420, 0.239);   // #5a6b3d
  let vegHigh  = vec3<f32>(0.541, 0.478, 0.322);   // #8a7a52
  let rockLow  = vec3<f32>(0.478, 0.459, 0.439);   // #7a7570
  let rockMid  = vec3<f32>(0.604, 0.580, 0.549);   // #9a948c
  let rockHigh = vec3<f32>(0.722, 0.698, 0.667);   // #b8b2aa
  let snow     = vec3<f32>(0.941, 0.933, 0.910);   // #f0eee8

  let veg   = mix(vegLow,  vegHigh,  remap01(0.00, 0.40, e));
  let rLow  = mix(veg,     rockLow,  remap01(0.35, 0.60, e));
  let rMid  = mix(rLow,    rockMid,  remap01(0.55, 0.75, e));
  let rHigh = mix(rMid,    rockHigh, remap01(0.70, 0.85, e));
  return      mix(rHigh,   snow,     remap01(0.88, 0.96, e));
}

@fragment
fn terrainFragment(input: VertexOut) -> @location(0) vec4<f32> {
  // ── 1. Shadow mask from compute shader (unchanged) ─────────────────────────
  let shadow = textureLoad(shadowMask, vec2<i32>(input.gridPosition), 0).r;

  // ── 2. Elevation-based base colour ─────────────────────────────────────────
  let baseColor = elevationColor(input.elevNorm);

  // ── 3. Slope shading — flat tops bright, steep walls darker ────────────────
  let slopeFactor = clamp(input.normal.y * 0.55 + 0.45, 0.38, 1.0);

  // ── 4. Sun-direction diffuse (same fixed sun vector as before) ─────────────
  let diffuse = clamp(dot(input.normal, normalize(vec3<f32>(0.35, 0.8, -0.45))), 0.0, 1.0);

  // ── 5. Sky-ambient fill (same formula as before) ───────────────────────────
  let skyAmbient = clamp(input.normal.y * 0.35 + 0.65, 0.45, 1.0);

  // ── 6. Lit surface colour ──────────────────────────────────────────────────
  let litStrength = 0.30 + 0.70 * diffuse;
  let litColor    = baseColor * slopeFactor * litStrength;

  // ── 7. Shadow surface colour (sky-ambient only, never pitch-black) ─────────
  let shadowColor = baseColor * slopeFactor * skyAmbient * 0.38;

  // ── 8. Blend lit vs. shadowed ──────────────────────────────────────────────
  return vec4<f32>(mix(shadowColor, litColor, shadow), 1.0);
}
`;

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
    // Expanded from 80 → 96 bytes: adds slots [20]=minHeight [21]=maxHeight [22,23]=padding
    this.cameraBuffer = device.createBuffer({ size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.computePipeline = device.createComputePipeline({ layout: 'auto', compute: { module: device.createShaderModule({ code: shadowWgsl }), entryPoint: 'main' } });
    const terrainModule = device.createShaderModule({ code: terrainWgsl });
    this.terrainPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex:   { module: terrainModule, entryPoint: 'terrainVertex' },
      fragment: { module: terrainModule, entryPoint: 'terrainFragment', targets: [{ format: canvasFormat }] },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
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

    // Camera uniform: 24 floats = 96 bytes
    const camera = new Float32Array(24);
    camera.set(viewProjection);            // [0..15]  mat4x4
    camera[16] = DEM_GRID_SIZE;            // [16]     mapSize
    camera[17] = this.dem.gridScale;       // [17]     gridScale
    camera[18] = (this.dem.minHeight + this.dem.maxHeight) * 0.5; // [18] heightCenter
    camera[19] = Math.max(1.4, Math.min(4.5, (this.dem.maxHeight - this.dem.minHeight) / 950)); // [19] heightExaggeration
    camera[20] = this.dem.minHeight;       // [20]     minHeight  ← NEW
    camera[21] = this.dem.maxHeight;       // [21]     maxHeight  ← NEW
    // [22], [23] = 0 (padding)
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
