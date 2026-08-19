import { describe, expect, it } from 'vitest'
import { Pressure } from './Pressure'

describe('Pressure', () => {
  it('converts bar to psi', () => {
    expect(Pressure.fromBar(200).psi).toBeCloseTo(2900.75, 2)
  })

  it('keeps the bar reading it was constructed with', () => {
    expect(Pressure.fromBar(159.75).bar).toBe(159.75)
  })

  it('formats bar with one decimal and psi as a whole number', () => {
    const pressure = Pressure.fromBar(159.75)

    expect(pressure.formatBar()).toBe('159.8 bar')
    expect(pressure.formatPsi()).toBe('2317 psi')
  })

  it('formats with the requested number of decimals', () => {
    const pressure = Pressure.fromBar(50)

    expect(pressure.formatBar(0)).toBe('50 bar')
    expect(pressure.formatPsi(1)).toBe('725.2 psi')
  })

  it('rejects readings that are not a finite, non-negative number', () => {
    expect(() => Pressure.fromBar(-1)).toThrow(RangeError)
    expect(() => Pressure.fromBar(Number.NaN)).toThrow('bar must be a finite, non-negative number')
    expect(() => Pressure.fromBar(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => Pressure.fromBar(undefined as unknown as number)).toThrow(RangeError)
  })

  it('handles an empty tank', () => {
    const pressure = Pressure.fromBar(0)

    expect(pressure.psi).toBe(0)
    expect(pressure.formatBar()).toBe('0.0 bar')
    expect(pressure.formatPsi()).toBe('0 psi')
  })
})
