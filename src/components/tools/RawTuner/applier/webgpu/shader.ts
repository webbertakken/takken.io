/**
 * WGSL compute shader that replicates `applyLinear` + `encodeSrgb` from
 * `cpu-fallback.ts`. Kept as a TS string export rather than a `.wgsl` asset
 * because Docusaurus's webpack config doesn't ship with a `?raw` loader.
 *
 * The slider chain order MUST stay in lockstep with the CPU path:
 *
 *   1. White balance (temp/tint)
 *   2. Exposure
 *   3. Whites / blacks
 *   4. Highlights / shadows
 *   5. Contrast
 *   6. Tone curve (piecewise linear)
 *   7. Saturation / vibrance
 *   8. sRGB encode + clamp
 *
 * Buffers:
 *   binding 0 - storage<read>       linear-light RGBA Float32 input
 *   binding 1 - storage<read_write> sRGB-encoded RGBA Float32 output (alpha = straight)
 *   binding 2 - uniform             slider scalars + counts
 *   binding 3 - storage<read>       curve points (xy pairs)
 */
export const SLIDER_UNIFORM_FLOATS = 12 // 10 sliders + curveCount + pad (round to vec4)

export const WORKGROUP_SIZE = 64

export const MAX_CURVE_POINTS = 16

export const SHADER_WGSL = /* wgsl */ `
struct Sliders {
  exposure: f32,
  contrast: f32,
  highlights: f32,
  shadows: f32,
  whites: f32,
  blacks: f32,
  temp: f32,
  tint: f32,
  vibrance: f32,
  saturation: f32,
  curveCount: u32,
  _pad: u32,
}

struct CurvePoint {
  x: f32,
  y: f32,
}

@group(0) @binding(0) var<storage, read> inputData: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> outputData: array<vec4<f32>>;
@group(0) @binding(2) var<uniform> sliders: Sliders;
@group(0) @binding(3) var<storage, read> curve: array<CurvePoint>;

const SRGB_THRESHOLD: f32 = 0.0031308;

fn encodeSrgb(linear: f32) -> f32 {
  if (linear <= 0.0) { return 0.0; }
  if (linear >= 1.0) { return 1.0; }
  if (linear <= SRGB_THRESHOLD) { return 12.92 * linear; }
  return 1.055 * pow(linear, 1.0 / 2.4) - 0.055;
}

fn applyWhitesBlacks(c: f32) -> f32 {
  let w = sliders.whites / 200.0;
  let k = sliders.blacks / 200.0;
  return c + w * c * c + k * (1.0 - c) * (1.0 - c);
}

fn applyHighlightsShadows(c: f32) -> f32 {
  let high = max(0.0, c - 0.5) * 2.0;
  let low = max(0.0, 0.5 - c) * 2.0;
  return c + (sliders.highlights / 200.0) * high + (sliders.shadows / 200.0) * low;
}

fn applyContrast(c: f32) -> f32 {
  return 0.5 + (c - 0.5) * (1.0 + sliders.contrast / 100.0);
}

fn evalCurve(value: f32) -> f32 {
  let count = sliders.curveCount;
  if (count == 0u) { return value; }
  if (value <= curve[0].x) { return curve[0].y; }
  for (var i: u32 = 0u; i < count - 1u; i = i + 1u) {
    let a = curve[i];
    let b = curve[i + 1u];
    if (value <= b.x) {
      let t = (value - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return curve[count - 1u].y;
}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= arrayLength(&inputData)) {
    return;
  }
  let pixel = inputData[i];

  // 1. White balance.
  let tempFactor = 1.0 + sliders.temp / 200.0;
  let tintFactor = 1.0 - sliders.tint / 200.0;
  var r = pixel.r * tempFactor;
  var g = pixel.g * tintFactor;
  var b = pixel.b / tempFactor;

  // 2. Exposure.
  let expo = exp2(sliders.exposure);
  r = r * expo;
  g = g * expo;
  b = b * expo;

  // 3. Whites / blacks.
  r = applyWhitesBlacks(r);
  g = applyWhitesBlacks(g);
  b = applyWhitesBlacks(b);

  // 4. Highlights / shadows.
  r = applyHighlightsShadows(r);
  g = applyHighlightsShadows(g);
  b = applyHighlightsShadows(b);

  // 5. Contrast.
  r = applyContrast(r);
  g = applyContrast(g);
  b = applyContrast(b);

  // 6. Tone curve.
  r = evalCurve(r);
  g = evalCurve(g);
  b = evalCurve(b);

  // 7. Saturation / vibrance.
  let mean = (r + g + b) / 3.0;
  let factor = 1.0 + (sliders.saturation + sliders.vibrance) / 100.0;
  r = mean + (r - mean) * factor;
  g = mean + (g - mean) * factor;
  b = mean + (b - mean) * factor;

  // 8. sRGB encode (alpha straight).
  outputData[i] = vec4<f32>(encodeSrgb(r), encodeSrgb(g), encodeSrgb(b), pixel.a);
}
`
