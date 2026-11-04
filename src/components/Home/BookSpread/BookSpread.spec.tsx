import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen, within } from '../../../test/test-utils'
import { chapters } from '../chapters'
import BookSpread from './BookSpread'

const renderSpread = () =>
  renderWithProviders(<BookSpread portrait="/webber.jpg" chapters={chapters} />)

describe('BookSpread', () => {
  it('opens with the letter and its signature', () => {
    renderSpread()

    expect(screen.getByRole('heading', { level: 1, name: "Hi, I'm Webber." })).toBeInTheDocument()
    expect(screen.getByText('Webber')).toBeInTheDocument()
  })

  it('shows the portrait as a captioned photo print', () => {
    renderSpread()

    const print = screen.getByRole('figure')

    expect(within(print).getByRole('img', { name: /Portrait of Webber/ })).toBeInTheDocument()
    expect(within(print).getByText('Webber, by the sea')).toBeInTheDocument()
  })

  it('invites corrections by email', () => {
    renderSpread()

    expect(screen.getByRole('link', { name: 'say so' })).toHaveAttribute(
      'href',
      'mailto:webber@takken.io',
    )
  })

  it('lists every chapter of the contents', () => {
    renderSpread()

    const contents = screen.getByRole('navigation', { name: "What you'll find here" })
    const titles = within(contents)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)

    expect(titles).toEqual([
      'iThings I made',
      'iiThings I wrote',
      'iiiThings I drew',
      'ivThings I learned',
    ])
  })

  it('describes each project instead of bracketing it', () => {
    renderSpread()

    const docs = screen.getByRole('link', { name: /docs\.nu/ }).closest('li') as HTMLElement

    expect(within(docs).getByText('free documents')).toBeInTheDocument()
  })

  it('opens projects in a new tab and says so to screen readers', () => {
    renderSpread()

    const citymap = screen.getByRole('link', { name: /^citymap ?\(opens in a new tab\)$/ })

    expect(citymap).toHaveAttribute('href', 'https://webbertakken.github.io/citymap/')
    expect(citymap).toHaveAttribute('target', '_blank')
  })

  it('keeps site pages in the same tab', () => {
    renderSpread()

    const visuals = screen.getByRole('link', { name: 'Iceberg of disconnect' })

    expect(visuals).toHaveAttribute('href', '/notes/visuals#iceberg-of-disconnect')
    expect(visuals).not.toHaveAttribute('target')
  })

  it('links to everywhere else Webber can be found', () => {
    renderSpread()

    const elsewhere = within(screen.getByRole('list', { name: 'Elsewhere' }))

    expect(elsewhere.getAllByRole('link')).toHaveLength(6)
    expect(elsewhere.getByRole('link', { name: 'Email' })).not.toHaveAttribute('target')
    expect(elsewhere.getByRole('link', { name: 'GitHub' })).toHaveAttribute('target', '_blank')
  })
})
