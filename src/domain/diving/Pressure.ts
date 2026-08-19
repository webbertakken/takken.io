const PSI_PER_BAR = 14.503773773

/**
 * A pressure reading, stored in bar (the unit used by FIT tank-summary
 * messages) and surfaced with a PSI conversion for display.
 */
export class Pressure {
  readonly bar: number
  readonly psi: number

  constructor(bar: number) {
    this.bar = bar
    this.psi = bar * PSI_PER_BAR
  }

  static fromBar(bar: number): Pressure {
    return new Pressure(bar)
  }

  formatBar(decimals = 1): string {
    return `${this.bar.toFixed(decimals)} bar`
  }

  formatPsi(decimals = 0): string {
    return `${this.psi.toFixed(decimals)} psi`
  }
}
