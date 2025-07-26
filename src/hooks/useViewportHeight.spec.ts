import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  createMockVisualViewport,
  setupVisualViewportMock,
  type MockVisualViewport,
} from '../test/test-utils'
import { useViewportHeight } from './useViewportHeight'

describe('useViewportHeight', () => {
  let setPropertySpy: ReturnType<typeof vi.fn>
  let restoreVisualViewport: (() => void) | undefined
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Mock document.documentElement.style.setProperty
    setPropertySpy = vi.fn()
    Object.defineProperty(document.documentElement.style, 'setProperty', {
      value: setPropertySpy,
      writable: true,
    })

    // Mock window event listeners
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    // Reset window dimensions
    Object.defineProperty(window, 'innerHeight', {
      value: 1000,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    restoreVisualViewport?.()
    restoreVisualViewport = undefined
  })

  it('sets initial viewport height using window.innerHeight when visualViewport is not available', () => {
    // Ensure visualViewport doesn't exist
    delete (window as Window & { visualViewport?: VisualViewport }).visualViewport

    renderHook(() => useViewportHeight())

    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '10px')
  })

  it('sets initial viewport height using visualViewport.height when available', () => {
    restoreVisualViewport = setupVisualViewportMock({ height: 800 })

    renderHook(() => useViewportHeight())

    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '8px')
  })

  it('adds resize event listener to visualViewport when available', () => {
    const mockViewport = createMockVisualViewport()
    restoreVisualViewport = setupVisualViewportMock(mockViewport)

    renderHook(() => useViewportHeight())

    expect(mockViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('adds resize event listener to window when visualViewport is not available', () => {
    delete (window as Window & { visualViewport?: VisualViewport }).visualViewport

    renderHook(() => useViewportHeight())

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('updates viewport height when visualViewport resize event fires', () => {
    let resizeCallback: ((event: Event) => void) | undefined
    const mockViewport: MockVisualViewport = {
      height: 800,
      width: 400,
      addEventListener: vi.fn((event, callback) => {
        if (event === 'resize') {
          resizeCallback = callback as (event: Event) => void
        }
      }),
      removeEventListener: vi.fn(),
    }
    restoreVisualViewport = setupVisualViewportMock(mockViewport)

    renderHook(() => useViewportHeight())

    // Initial call
    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '8px')

    // Clear mock to track only the resize call
    setPropertySpy.mockClear()

    // Change height on the window.visualViewport reference
    ;(window.visualViewport as VisualViewport & { height: number }).height = 600
    resizeCallback?.(new Event('resize'))

    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '6px')
  })

  it('updates viewport height when window resize event fires (no visualViewport)', () => {
    delete (window as Window & { visualViewport?: VisualViewport }).visualViewport

    renderHook(() => useViewportHeight())

    // Initial call
    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '10px')

    // Change height and trigger resize
    ;(window as Window & { innerHeight: number }).innerHeight = 500
    window.dispatchEvent(new Event('resize'))

    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '5px')
  })

  it('removes event listeners on unmount when visualViewport is available', () => {
    const mockViewport = createMockVisualViewport()
    restoreVisualViewport = setupVisualViewportMock(mockViewport)

    const { unmount } = renderHook(() => useViewportHeight())

    unmount()

    expect(mockViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('removes event listeners on unmount when visualViewport is not available', () => {
    delete (window as Window & { visualViewport?: VisualViewport }).visualViewport

    const { unmount } = renderHook(() => useViewportHeight())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('calculates correct vh value for various viewport heights', () => {
    const testCases = [
      { height: 1000, expectedVh: 10 },
      { height: 750, expectedVh: 7.5 },
      { height: 568, expectedVh: 5.68 },
      { height: 812, expectedVh: 8.12 },
      { height: 1366, expectedVh: 13.66 },
    ]

    delete (window as Window & { visualViewport?: VisualViewport }).visualViewport

    testCases.forEach(({ height, expectedVh }) => {
      vi.clearAllMocks()
      ;(window as Window & { innerHeight: number }).innerHeight = height

      renderHook(() => useViewportHeight())

      expect(setPropertySpy).toHaveBeenCalledTimes(1)
      const actualCall = setPropertySpy.mock.calls[0]
      expect(actualCall[0]).toBe('--vh')

      // Parse the px value and compare with tolerance for floating point precision
      const actualValue = parseFloat(actualCall[1])
      expect(actualValue).toBeCloseTo(expectedVh, 10)
    })
  })

  it('handles edge case where both visualViewport and window heights are 0', () => {
    restoreVisualViewport = setupVisualViewportMock({ height: 0 })
    ;(window as Window & { innerHeight: number }).innerHeight = 0

    renderHook(() => useViewportHeight())

    expect(setPropertySpy).toHaveBeenCalledWith('--vh', '0px')
  })
})
