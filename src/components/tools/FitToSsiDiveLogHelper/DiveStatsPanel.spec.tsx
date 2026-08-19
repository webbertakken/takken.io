import type { Dive } from '@site/src/domain/diving/Dive'
import { Pressure } from '@site/src/domain/diving/Pressure'
import { render, screen } from '@site/src/test/test-utils'
import { describe, expect, it } from 'vitest'
import { DiveStatsPanel } from './DiveStatsPanel'

const createMockDive = (overrides: Partial<Dive> = {}): Dive => ({
  messages: {},
  diveTime: 35,
  startTime: new Date('2023-09-15T17:57:00Z'),
  maxDepth: 9.6,
  avgDepth: 6.2,
  sport: 'diving',
  minTemperature: 22,
  maxTemperature: 24,
  startPressure: Pressure.fromBar(200),
  endPressure: Pressure.fromBar(50),
  firstName: '',
  lastName: '',
  ...overrides,
})

describe('DiveStatsPanel', () => {
  it('renders the average depth in meters and feet', () => {
    render(<DiveStatsPanel dive={createMockDive()} />)

    expect(screen.getByText('6.2 m / 20 ft')).toBeInTheDocument()
  })

  it('renders start and end pressure in psi and bar', () => {
    render(<DiveStatsPanel dive={createMockDive()} />)

    expect(screen.getByText(/2901 psi/)).toBeInTheDocument()
    expect(screen.getByText(/200.0 bar/)).toBeInTheDocument()
    expect(screen.getByText(/725 psi/)).toBeInTheDocument()
    expect(screen.getByText(/50.0 bar/)).toBeInTheDocument()
  })

  it('shows a placeholder when data is missing', () => {
    render(
      <DiveStatsPanel
        dive={createMockDive({
          avgDepth: undefined,
          startPressure: undefined,
          endPressure: undefined,
        })}
      />,
    )

    expect(screen.getAllByText('—')).toHaveLength(3)
  })
})
