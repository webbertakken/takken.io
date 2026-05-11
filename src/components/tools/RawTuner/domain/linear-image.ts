/**
 * A scene-referred linear-light image. Channels are stored interleaved as
 * RGBA `Float32Array(width * height * 4)`. Values are nominally in [0,1] but
 * highlights MAY exceed 1.0 (RAW captures often go up to ~16 stops above
 * middle grey before clipping at the sensor).
 *
 * fp32 on the CPU side is deliberate: percentile maths and grey-world WB
 * estimation are noticeably noisier in fp16. The applier converts to fp16
 * only at the GPU boundary.
 */
export interface LinearImage {
  readonly width: number
  readonly height: number
  readonly data: Float32Array
}

export const PIXEL_STRIDE = 4

export const createLinearImage = (
  width: number,
  height: number,
  data?: Float32Array,
): LinearImage => {
  if (!Number.isInteger(width) || width <= 0) {
    throw new RangeError(`width must be a positive integer, got ${width}`)
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new RangeError(`height must be a positive integer, got ${height}`)
  }
  const length = width * height * PIXEL_STRIDE
  if (data && data.length !== length) {
    throw new RangeError(
      `data length ${data.length} does not match ${width}x${height}x4 = ${length}`,
    )
  }
  return { width, height, data: data ?? new Float32Array(length) }
}
