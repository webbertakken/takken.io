import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test/test-utils'
import Visual from './Visual'

describe('Visual', () => {
  it('renders the sketch as a figure described by its alt text', () => {
    renderWithProviders(<Visual img="/iceberg.png" alt="Iceberg of disconnect" />)

    const image = screen.getByRole('img', { name: 'Iceberg of disconnect' })

    expect(screen.getByRole('figure')).toContainElement(image)
  })
})
