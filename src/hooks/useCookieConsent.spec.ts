import { vi, describe, expect, it, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCookieConsent } from './useCookieConsent'

describe('useCookieConsent', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn<Storage, 'getItem'>>
  let setItemSpy: ReturnType<typeof vi.spyOn<Storage, 'setItem'>>

  beforeEach(() => {
    localStorage.clear()
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
  })

  it('returns null consent before any choice is made', () => {
    const { result } = renderHook(() => useCookieConsent())
    // Before effect runs, consent is null
    expect(result.current.consent).toBeNull()
  })

  it('hydrates to false initially then true after mount', async () => {
    const { result } = renderHook(() => useCookieConsent())
    // After effect runs, hydrated becomes true
    expect(result.current.hydrated).toBe(true)
  })

  it('reads existing accepted value from localStorage on mount', () => {
    localStorage.setItem('cookie-consent', 'accepted')

    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consent).toBe('accepted')
    expect(result.current.hydrated).toBe(true)
  })

  it('reads existing declined value from localStorage on mount', () => {
    localStorage.setItem('cookie-consent', 'declined')

    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consent).toBe('declined')
    expect(result.current.hydrated).toBe(true)
  })

  it('ignores invalid localStorage values', () => {
    localStorage.setItem('cookie-consent', 'banana')

    const { result } = renderHook(() => useCookieConsent())

    expect(result.current.consent).toBeNull()
  })

  it('stores accepted in localStorage when accept is called', () => {
    const { result } = renderHook(() => useCookieConsent())

    act(() => {
      result.current.accept()
    })

    expect(setItemSpy).toHaveBeenCalledWith('cookie-consent', 'accepted')
    expect(result.current.consent).toBe('accepted')
  })

  it('stores declined in localStorage when decline is called', () => {
    const { result } = renderHook(() => useCookieConsent())

    act(() => {
      result.current.decline()
    })

    expect(setItemSpy).toHaveBeenCalledWith('cookie-consent', 'declined')
    expect(result.current.consent).toBe('declined')
  })

  it('calls localStorage.getItem with the correct key on mount', () => {
    renderHook(() => useCookieConsent())

    expect(getItemSpy).toHaveBeenCalledWith('cookie-consent')
  })
})
