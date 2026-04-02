import { vi, describe, expect, it, beforeEach, afterEach, type MockInstance } from 'vitest'
import { loadGtm } from './loadGtm'

describe('loadGtm', () => {
  let appendChildHeadSpy: MockInstance
  let appendChildBodySpy: MockInstance

  beforeEach(() => {
    // Clean up any injected elements
    document.getElementById('gtm-script')?.remove()
    document.querySelectorAll('noscript').forEach((el) => el.remove())
    delete (window as unknown as Record<string, unknown>).dataLayer

    appendChildHeadSpy = vi.spyOn(document.head, 'appendChild')
    appendChildBodySpy = vi.spyOn(document.body, 'appendChild')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('injects a script element into the head', () => {
    loadGtm('GTM-TEST123')

    const script = document.getElementById('gtm-script') as HTMLScriptElement
    expect(script).not.toBeNull()
    expect(script.async).toBe(true)
    expect(script.src).toContain('gtm.js?id=GTM-TEST123')
  })

  it('injects a noscript iframe into the body', () => {
    loadGtm('GTM-TEST123')

    expect(appendChildBodySpy).toHaveBeenCalledTimes(1)
    const noscript = appendChildBodySpy.mock.calls[0][0] as HTMLElement
    expect(noscript.tagName).toBe('NOSCRIPT')

    const iframe = noscript.querySelector('iframe') as HTMLIFrameElement
    expect(iframe).not.toBeNull()
    expect(iframe.src).toContain('ns.html?id=GTM-TEST123')
    expect(iframe.style.display).toBe('none')
    expect(iframe.style.visibility).toBe('hidden')
  })

  it('initialises the dataLayer array', () => {
    loadGtm('GTM-TEST123')

    expect(window.dataLayer).toBeDefined()
    expect(Array.isArray(window.dataLayer)).toBe(true)
    expect(window.dataLayer.length).toBeGreaterThanOrEqual(1)
    expect(window.dataLayer[0]).toHaveProperty('gtm.start')
    expect(window.dataLayer[0]).toHaveProperty('event', 'gtm.js')
  })

  it('is idempotent — does not inject twice', () => {
    loadGtm('GTM-TEST123')
    const firstCallCount = appendChildHeadSpy.mock.calls.length

    loadGtm('GTM-TEST123')
    expect(appendChildHeadSpy.mock.calls.length).toBe(firstCallCount)
  })

  it('preserves existing dataLayer entries', () => {
    window.dataLayer = [{ existing: 'entry' }]

    loadGtm('GTM-TEST123')

    expect(window.dataLayer[0]).toEqual({ existing: 'entry' })
    expect(window.dataLayer.length).toBeGreaterThanOrEqual(2)
  })
})
