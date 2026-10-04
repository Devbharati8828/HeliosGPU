// WebGPU Compute Shader for Ray-Marching DEM Shadows

struct Uniforms {
  gridWidth: u32,
  gridHeight: u32,
  cellSize: f32,
  pad: f32,       // 16-byte alignment
  sunDir: vec3<f32>,
  maxSteps: u32,
};

@group(0) @binding(0) var<uniform> params: Uniforms;
@group(0) @binding(1) var<storage, read> elevations: array<f32>;
@group(0) @binding(2) var<storage, read_write> shadowMap: array<f32>;

// Helper to get 1D index from 2D coordinates
fn getIndex(x: u32, y: u32) -> u32 {
  return y * params.gridWidth + x;
}

// Bilinear interpolation of elevation (optional for higher quality, 
// but nearest-neighbor is faster for MVP). Using nearest-neighbor here.
fn getElevation(x: u32, y: u32) -> f32 {
  if (x >= params.gridWidth || y >= params.gridHeight) {
    return -9999.0;
  }
  return elevations[getIndex(x, y)];
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let x = global_id.x;
  let y = global_id.y;
  
  if (x >= params.gridWidth || y >= params.gridHeight) {
    return;
  }
  
  let idx = getIndex(x, y);
  let startElevation = elevations[idx];
  
  // Vector pointing *towards* the sun
  // Note: coordinate system assumes XY is flat, Z is up.
  // We need the step vector per cell.
  
  let L = normalize(params.sunDir);
  
  // If sun is below horizon, everything is in shadow
  if (L.z <= 0.0) {
    shadowMap[idx] = 0.0;
    return;
  }
  
  // Step size in grid units. We march in increments of 1 grid cell.
  // The distance in meters for a 1-cell step in the XY plane is roughly params.cellSize.
  // To avoid self-shadowing acne, we start the ray slightly offset.
  
  // The horizontal direction of the sun
  let L_horiz = normalize(vec2<f32>(L.x, L.y));
  
  // We step in grid coordinates (pixels)
  let stepXY = L_horiz;
  
  // The change in Z (meters) per 1-pixel step in XY
  let dz = (L.z / length(vec2<f32>(L.x, L.y))) * params.cellSize;
  
  var currentPosXY = vec2<f32>(f32(x), f32(y));
  var currentZ = startElevation;
  
  var isShadowed = 0.0; // 0.0 means shadowed, 1.0 means lit. Let's start assuming lit.
  var isLit = 1.0;
  
  // Ray march
  for (var i: u32 = 1u; i <= params.maxSteps; i++) {
    currentPosXY = currentPosXY + stepXY;
    currentZ = currentZ + dz;
    
    let curX = u32(round(currentPosXY.x));
    let curY = u32(round(currentPosXY.y));
    
    // Check bounds
    if (curX < 0u || curX >= params.gridWidth || curY < 0u || curY >= params.gridHeight) {
      break; // Ray escaped the DEM bounds
    }
    
    let sampleZ = elevations[getIndex(curX, curY)];
    
    // If the ray's Z is below the terrain Z at this point, we are in shadow.
    if (currentZ < sampleZ) {
      isLit = 0.0;
      break;
    }
  }
  
  shadowMap[idx] = isLit;
}
