import type { Dive } from '@site/src/domain/diving/Dive'
import { FitFiles } from '@site/src/domain/diving/fit/FitFiles'
import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__/index'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FitToSsiDiveLogHelper from './index'

const diveWithSport = (sport: string): Dive =>
  ({
    messages: {},
    diveTime: 35,
    startTime: new Date('2023-09-15T17:57:00Z'),
    maxDepth: 9.6,
    avgDepth: 6.2,
    sport,
    minTemperature: 22,
    maxTemperature: 24,
    startPressure: undefined,
    endPressure: undefined,
    firstName: '',
    lastName: '',
  }) as Dive

const renderHelper = (createFiles: () => FitFiles<Dive>) =>
  render(
    <FitToSsiDiveLogHelper
      title="Fit to SSI DiveLog helper"
      vendorNoun="garmin"
      vendor="garmin"
      createFiles={createFiles}
      exportImage="/img/export.png"
      exportImageAlt="Exporting a dive"
      crossLink={{ vendorName: 'Suunto', href: '/tools/suunto-to-ssi-dive-log-helper' }}
    />,
  )

const upload = (container: HTMLElement): void => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File([suuntoOceanScubaFixture()], 'dive.fit')
  Object.defineProperty(input, 'files', { value: [file], configurable: true })

  fireEvent.input(input)
}

describe('FitToSsiDiveLogHelper', () => {
  it('reports the failure when a dive cannot be mapped to SSI', async () => {
    const { container } = renderHelper(() => new FitFiles<Dive>(() => diveWithSport('running')))

    upload(container)

    await waitFor(() => expect(screen.getByText(/Unsupported sport running/i)).toBeInTheDocument())
    expect(screen.queryByText('Importing your dive')).not.toBeInTheDocument()
  })

  it('survives a collector that fails outright', async () => {
    const brokenCollector = () => {
      const files = new FitFiles<Dive>(() => diveWithSport('diving'))
      vi.spyOn(files, 'add').mockRejectedValue(new Error('collector gave up'))

      return files
    }
    const { container } = renderHelper(brokenCollector)

    upload(container)

    await waitFor(() => expect(screen.getByText('collector gave up')).toBeInTheDocument())
  })

  it('ignores an upload event without files', () => {
    const { container } = renderHelper(() => new FitFiles<Dive>(() => diveWithSport('diving')))
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: null, configurable: true })

    fireEvent.input(input)

    expect(screen.queryByText('Importing your dive')).not.toBeInTheDocument()
  })

  it('shows the dive stats once a dive is mapped', async () => {
    const { container } = renderHelper(() => new FitFiles<Dive>(() => diveWithSport('diving')))

    upload(container)

    await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())
    expect(screen.getByText('20 ft / 6.2 m')).toBeInTheDocument()
  })
})
