import { DOMParser } from '@xmldom/xmldom'
import { describe, expect, it } from 'vitest'
import { defaultSliderStack, mergeSliderStacks } from '../domain/slider-stack'
import { writeXmp } from './write-xmp'

type ParsedDoc = ReturnType<DOMParser['parseFromString']>
const parse = (xml: string): ParsedDoc => new DOMParser().parseFromString(xml, 'application/xml')

describe('writeXmp', () => {
  it('produces well-formed XML', () => {
    const xmp = writeXmp(defaultSliderStack())
    const doc = parse(xmp)
    expect(doc.documentElement?.localName).toBe('xmpmeta')
  })

  it('starts with the XMP packet wrapper Lightroom expects', () => {
    const xmp = writeXmp(defaultSliderStack())
    expect(xmp.startsWith('<?xpacket begin')).toBe(true)
    expect(xmp).toContain('<?xpacket end="w"?>')
  })

  it('encodes scalar sliders as Lightroom-style numeric attributes', () => {
    const xmp = writeXmp(
      mergeSliderStacks(defaultSliderStack(), {
        exposure: 1.25,
        contrast: 30,
        highlights: -25,
        shadows: 40,
        whites: 12,
        blacks: -18,
        temp: 5,
        tint: -3,
        vibrance: 10,
        saturation: -5,
      }),
    )

    expect(xmp).toContain('crs:Exposure2012="+1.25"')
    expect(xmp).toContain('crs:Contrast2012="+30"')
    expect(xmp).toContain('crs:Highlights2012="-25"')
    expect(xmp).toContain('crs:Shadows2012="+40"')
    expect(xmp).toContain('crs:Whites2012="+12"')
    expect(xmp).toContain('crs:Blacks2012="-18"')
    expect(xmp).toContain('crs:Vibrance="+10"')
    expect(xmp).toContain('crs:Saturation="-5"')
  })

  it('writes the white-balance values as a relative offset', () => {
    const xmp = writeXmp(mergeSliderStacks(defaultSliderStack(), { temp: 25, tint: -10 }))

    expect(xmp).toContain('crs:Temperature="+25"')
    expect(xmp).toContain('crs:Tint="-10"')
  })

  it('omits a tone-curve element when the curve is identity', () => {
    const xmp = writeXmp(defaultSliderStack())
    expect(xmp).not.toContain('crs:ToneCurvePV2012')
  })

  it('writes a Process Version 11.0 (modern crs sliders) header', () => {
    const xmp = writeXmp(defaultSliderStack())
    expect(xmp).toContain('crs:ProcessVersion="11.0"')
  })

  it('writes the tone curve when overrides are supplied', () => {
    const xmp = writeXmp(
      mergeSliderStacks(defaultSliderStack(), {
        curvePoints: [
          { x: 0, y: 0.05 },
          { x: 0.5, y: 0.55 },
          { x: 1, y: 0.95 },
        ],
      }),
    )

    const doc = parse(xmp)
    const liNodes = doc.getElementsByTagName('rdf:li')
    const curveValues = Array.from(
      { length: liNodes.length },
      (_, i) => liNodes[i].textContent ?? '',
    )

    expect(curveValues).toContain('0, 13')
    expect(curveValues).toContain('128, 140')
    expect(curveValues).toContain('255, 242')
  })

  it('escapes the slider values for round-trip safety', () => {
    const xmp = writeXmp(
      mergeSliderStacks(defaultSliderStack(), {
        exposure: 0.5,
      }),
    )

    expect(() => parse(xmp)).not.toThrow()
    expect(xmp).toContain('crs:Exposure2012="+0.5"')
  })
})
