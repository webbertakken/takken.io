import type { CurvePoint, SliderStack } from '../domain/slider-stack'

/**
 * Lightroom-compatible XMP sidecar writer. The sidecar lives next to the
 * RAW (`<photo>.xmp`) and lets Lightroom open the original RAW with the
 * edits already applied.
 *
 * Reference for the namespace used here:
 *   - `crs:` (Camera Raw Settings) - the slider values
 *   - `crs:ProcessVersion="11.0"` - matches modern sliders (post-Lightroom 4)
 *   - `crs:ToneCurvePV2012` - tone curve in 8-bit point pairs
 */

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const formatSigned = (value: number, fractionDigits = 0): string => {
  if (!Number.isFinite(value)) return '+0'
  // Lightroom values use explicit '+' for non-negatives.
  const fixed = value.toFixed(fractionDigits)
  // Strip trailing zeroes for fractional values.
  const trimmed = fractionDigits > 0 ? fixed.replace(/\.?0+$/, '') || '0' : fixed
  if (trimmed === '0' || trimmed === '-0') return '+0'
  return Number(trimmed) > 0 ? `+${trimmed}` : trimmed
}

const isIdentityCurve = (points: readonly CurvePoint[]): boolean => {
  if (points.length !== 2) return false
  return points[0].x === 0 && points[0].y === 0 && points[1].x === 1 && points[1].y === 1
}

const formatCurvePoint = (p: CurvePoint): string =>
  `${Math.round(p.x * 255)}, ${Math.round(p.y * 255)}`

const renderToneCurve = (points: readonly CurvePoint[]): string => {
  if (isIdentityCurve(points)) return ''
  const items = points
    .map((p) => `        <rdf:li>${escape(formatCurvePoint(p))}</rdf:li>`)
    .join('\n')
  return [
    '   <crs:ToneCurvePV2012>',
    '    <rdf:Seq>',
    items,
    '    </rdf:Seq>',
    '   </crs:ToneCurvePV2012>',
  ].join('\n')
}

export const writeXmp = (sliders: SliderStack): string => {
  const attrs = [
    `crs:ProcessVersion="11.0"`,
    `crs:Exposure2012="${formatSigned(sliders.exposure, 2)}"`,
    `crs:Contrast2012="${formatSigned(sliders.contrast)}"`,
    `crs:Highlights2012="${formatSigned(sliders.highlights)}"`,
    `crs:Shadows2012="${formatSigned(sliders.shadows)}"`,
    `crs:Whites2012="${formatSigned(sliders.whites)}"`,
    `crs:Blacks2012="${formatSigned(sliders.blacks)}"`,
    `crs:Temperature="${formatSigned(sliders.temp)}"`,
    `crs:Tint="${formatSigned(sliders.tint)}"`,
    `crs:Vibrance="${formatSigned(sliders.vibrance)}"`,
    `crs:Saturation="${formatSigned(sliders.saturation)}"`,
  ].join(' ')

  const toneCurve = renderToneCurve(sliders.curvePoints)

  return `<?xpacket begin="\u00ef\u00bb\u00bf" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="raw-tuner">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    ${attrs}>
${toneCurve}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
`
}
