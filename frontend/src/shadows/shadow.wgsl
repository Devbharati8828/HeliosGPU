struct ShadowParams {
  sunDirection: vec3<f32>,
  gridScale: f32,
  mapSize: u32,
  _padding: vec3<u32>,
}

@group(0) @binding(0) var<storage, read> elevation: array<f32>;
@group(0) @binding(1) var shadowMask: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params: ShadowParams;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let size = params.mapSize;
  if (id.x >= size || id.y >= size) { return; }
  if (params.sunDirection.y <= 0.0) {
    textureStore(shadowMask, vec2<i32>(id.xy), vec4<f32>(0.0, 0.0, 0.0, 1.0));
    return;
  }

  let sourceHeight = elevation[id.y * size + id.x];
  var rayDistance = params.gridScale;
  var stride = params.gridScale;
  var lit = 1.0;
  // The requested vector is east, up, south. Grid y also increases south.
  for (var step = 0u; step < 192u; step += 1u) {
    let rayX = f32(id.x) + params.sunDirection.x * rayDistance / params.gridScale;
    let rayY = f32(id.y) + params.sunDirection.z * rayDistance / params.gridScale;
    if (rayX < 0.0 || rayY < 0.0 || rayX >= f32(size) || rayY >= f32(size)) { break; }
    let terrainIndex = u32(rayY) * size + u32(rayX);
    let rayHeight = sourceHeight + params.sunDirection.y * rayDistance;
    if (elevation[terrainIndex] > rayHeight) {
      lit = 0.0;
      break;
    }
    rayDistance += stride;
    stride *= 1.035;
  }
  textureStore(shadowMask, vec2<i32>(id.xy), vec4<f32>(lit, lit, lit, 1.0));
}
