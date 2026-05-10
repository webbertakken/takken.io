import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Preset } from '../presets/types'
import PresetGrid from './PresetGrid'

const buildPresets = (): readonly Preset[] => [
  { name: 'Auto-tuned', description: 'baseline auto', sliders: { exposure: 0 }, embedding: [] },
  { name: 'Punchy', description: 'punchy', sliders: { exposure: 0.5 }, embedding: [] },
  { name: 'Moody', description: 'moody', sliders: { contrast: 30 }, embedding: [] },
]

describe('PresetGrid', () => {
  it('renders one card per preset with the preset name', () => {
    render(<PresetGrid presets={buildPresets()} active={null} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Auto-tuned' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Punchy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Moody' })).toBeInTheDocument()
  })

  it('marks the active preset visually + via aria-pressed', () => {
    render(<PresetGrid presets={buildPresets()} active="Punchy" onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Auto-tuned' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Punchy' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Moody' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelect with the picked preset on click', () => {
    const onSelect = vi.fn()
    const presets = buildPresets()
    render(<PresetGrid presets={presets} active={null} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: 'Punchy' }))

    expect(onSelect).toHaveBeenCalledWith(presets[1])
  })

  it('shows an empty state hint when there are no presets', () => {
    render(<PresetGrid presets={[]} active={null} onSelect={vi.fn()} />)

    expect(screen.getByText(/drop a photo to see suggested looks/i)).toBeInTheDocument()
  })

  it('renders the preset description as a tooltip-friendly title', () => {
    render(<PresetGrid presets={buildPresets()} active={null} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Punchy' })).toHaveAttribute('title', 'punchy')
  })
})
