import { vi, describe, expect, it, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

const mockAccept = vi.fn()
const mockDecline = vi.fn()
const mockLoadGtm = vi.fn()

let mockConsent: string | null = null
let mockHydrated = true

vi.mock('@site/src/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({
    consent: mockConsent,
    hydrated: mockHydrated,
    accept: mockAccept,
    decline: mockDecline,
  }),
}))

vi.mock('@site/src/utils/loadGtm', () => ({
  loadGtm: (...args: unknown[]) => mockLoadGtm(...args),
}))

import CookieConsent from './CookieConsent'

describe('CookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsent = null
    mockHydrated = true
  })

  it('renders the banner when no consent choice has been made', () => {
    render(<CookieConsent />)

    expect(screen.getByText(/we use cookies/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
  })

  it('returns null when consent is already accepted', () => {
    mockConsent = 'accepted'

    const { container } = render(<CookieConsent />)

    expect(container.innerHTML).toBe('')
  })

  it('returns null when consent is already declined', () => {
    mockConsent = 'declined'

    const { container } = render(<CookieConsent />)

    expect(container.innerHTML).toBe('')
  })

  it('returns null before hydration', () => {
    mockHydrated = false

    const { container } = render(<CookieConsent />)

    expect(container.innerHTML).toBe('')
  })

  it('calls accept and loads GTM when Accept is clicked', () => {
    render(<CookieConsent />)

    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    expect(mockAccept).toHaveBeenCalledTimes(1)
    expect(mockLoadGtm).toHaveBeenCalledWith('GTM-T4M9CW8')
  })

  it('calls decline and does not load GTM when Decline is clicked', () => {
    render(<CookieConsent />)

    fireEvent.click(screen.getByRole('button', { name: /decline/i }))

    expect(mockDecline).toHaveBeenCalledTimes(1)
    expect(mockLoadGtm).not.toHaveBeenCalled()
  })

  it('auto-loads GTM when consent is already accepted on mount', () => {
    mockConsent = 'accepted'

    render(<CookieConsent />)

    expect(mockLoadGtm).toHaveBeenCalledWith('GTM-T4M9CW8')
  })

  it('contains a link to the privacy policy', () => {
    render(<CookieConsent />)

    const link = screen.getByRole('link', { name: /privacy policy/i })
    expect(link).toHaveAttribute('href', '/privacy')
  })
})
