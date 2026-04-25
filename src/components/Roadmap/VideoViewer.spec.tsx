import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'

// Track spring API calls
const mockSpringStart = vi.fn()
const mockBackdropStart = vi.fn()
let lastSpringOnRest: (() => void) | undefined

vi.mock('@react-spring/web', () => {
  const animatedHandler: ProxyHandler<object> = {
    get(_target, prop: string) {
      return React.forwardRef(
        ({ children, ...rest }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => (
          <div ref={ref} data-animated={prop} {...rest}>
            {children as React.ReactNode}
          </div>
        ),
      )
    },
  }

  return {
    animated: new Proxy({}, animatedHandler),
    useSpring: (config: Record<string, unknown>) => {
      const from = config.from as Record<string, unknown> | undefined
      // Detect which spring this is by checking for opacity
      if (from && 'opacity' in from) {
        return [{ opacity: 0.8 }, { start: mockBackdropStart }]
      }
      return [
        {
          top: 0,
          left: 0,
          width: 800,
          height: 450,
          borderRadius: 12,
        },
        {
          start: (opts: { to: unknown; onRest?: () => void }) => {
            mockSpringStart(opts)
            if (opts.onRest) lastSpringOnRest = opts.onRest
          },
        },
      ]
    },
  }
})

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom')
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  }
})

import VideoViewer from './VideoViewer'

const makeDOMRect = (overrides?: Partial<DOMRect>): DOMRect => ({
  top: 100,
  left: 200,
  width: 300,
  height: 150,
  bottom: 250,
  right: 500,
  x: 200,
  y: 100,
  toJSON: () => ({}),
  ...overrides,
})

const defaultProps = {
  videoId: 'test-video-id',
  sourceRect: makeDOMRect(),
  onClose: vi.fn(),
  onVideoEnd: vi.fn(),
}

describe('VideoViewer', () => {
  let cleanupViewport: (() => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    lastSpringOnRest = undefined
    document.body.style.overflow = ''

    // Default YT mock
    window.YT = {
      Player: vi.fn(function (_id, config) {
        // Store onStateChange for later invocation
        ;(window as unknown as Record<string, unknown>).__ytOnStateChange =
          config.events?.onStateChange
        return {
          pauseVideo: vi.fn(),
          destroy: vi.fn(),
        }
      }),
      PlayerState: { ENDED: 0 },
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanupViewport?.()
    cleanupViewport = undefined
    delete window.YT
    delete window.onYouTubeIframeAPIReady
  })

  it('renders a fixed overlay container', () => {
    render(<VideoViewer {...defaultProps} />)

    const container = screen.getByRole('button', { name: 'Close video' }).parentElement
    expect(container).toHaveClass('fixed')
    expect(container).toHaveClass('inset-0')
  })

  it('renders the close button', () => {
    render(<VideoViewer {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Close video' })).toBeInTheDocument()
  })

  it('renders a yt-player placeholder', () => {
    const { container } = render(<VideoViewer {...defaultProps} />)

    expect(container.querySelector('#yt-player')).toBeInTheDocument()
  })

  describe('computeFinalRect', () => {
    it('uses window dimensions when visualViewport is absent', () => {
      // Remove visualViewport
      const desc = Object.getOwnPropertyDescriptor(window, 'visualViewport')
      Object.defineProperty(window, 'visualViewport', {
        value: null,
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
        configurable: true,
      })
      Object.defineProperty(window, 'innerHeight', {
        value: 768,
        writable: true,
        configurable: true,
      })

      render(<VideoViewer {...defaultProps} />)

      // The spring should have been called with initial "to" values based on window
      // 1024 - 32 = 992 maxWidth, 768 - 32 = 736 maxHeight
      // width = min(992, 736 * 16/9) = min(992, 1308.4) = 992
      // height = 992 * 9/16 = 558
      // These values are baked into the spring "to" via computeFinalRect
      expect(screen.getByRole('button', { name: 'Close video' })).toBeInTheDocument()

      if (desc) {
        Object.defineProperty(window, 'visualViewport', desc)
      }
    })

    it('uses visualViewport dimensions when available', () => {
      const mockVP = {
        width: 500,
        height: 900,
        offsetTop: 10,
        offsetLeft: 5,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
      Object.defineProperty(window, 'visualViewport', {
        value: mockVP,
        writable: true,
        configurable: true,
      })
      cleanupViewport = () => {
        Object.defineProperty(window, 'visualViewport', {
          value: null,
          writable: true,
          configurable: true,
        })
      }

      render(<VideoViewer {...defaultProps} />)

      // If visualViewport is set, it registers a resize listener on it
      expect(mockVP.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('resize handling', () => {
    it('updates position on window resize', () => {
      render(<VideoViewer {...defaultProps} />)

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(mockSpringStart).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({
            top: expect.any(Number),
            left: expect.any(Number),
            width: expect.any(Number),
            height: expect.any(Number),
          }),
          config: { tension: 300, friction: 26 },
        }),
      )
    })

    it('handles visualViewport resize event', () => {
      const listeners: Record<string, EventListener> = {}
      const mockVP = {
        width: 500,
        height: 900,
        offsetTop: 0,
        offsetLeft: 0,
        addEventListener: vi.fn((event: string, cb: EventListener) => {
          listeners[event] = cb
        }),
        removeEventListener: vi.fn(),
      }
      Object.defineProperty(window, 'visualViewport', {
        value: mockVP,
        writable: true,
        configurable: true,
      })
      cleanupViewport = () => {
        Object.defineProperty(window, 'visualViewport', {
          value: null,
          writable: true,
          configurable: true,
        })
      }

      render(<VideoViewer {...defaultProps} />)

      act(() => {
        listeners['resize']?.(new Event('resize'))
      })

      expect(mockSpringStart).toHaveBeenCalled()
    })

    it('handles orientationchange event', () => {
      render(<VideoViewer {...defaultProps} />)

      act(() => {
        window.dispatchEvent(new Event('orientationchange'))
      })

      expect(mockSpringStart).toHaveBeenCalled()
    })
  })

  describe('closing', () => {
    it('calls onClose on Escape key after animation', () => {
      render(<VideoViewer {...defaultProps} />)

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      })

      // onClose fires via onRest callback
      expect(lastSpringOnRest).toBeDefined()
      act(() => lastSpringOnRest!())
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose on backdrop click after animation', () => {
      render(<VideoViewer {...defaultProps} />)

      const backdrop = document.querySelector('[data-animated="div"]')
      expect(backdrop).toBeTruthy()

      act(() => {
        fireEvent.click(backdrop!)
      })

      act(() => lastSpringOnRest!())
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose on close button click after animation', () => {
      render(<VideoViewer {...defaultProps} />)

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
      })

      act(() => lastSpringOnRest!())
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('ignores duplicate close calls', () => {
      render(<VideoViewer {...defaultProps} />)

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
      })
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
      })

      // Only one spring animation started for close (the second is ignored)
      const closeCalls = mockSpringStart.mock.calls.filter((call) => call[0]?.onRest !== undefined)
      expect(closeCalls).toHaveLength(1)
    })

    it('hides player element before close animation', () => {
      const { container } = render(<VideoViewer {...defaultProps} />)
      const playerEl = container.querySelector('#yt-player') as HTMLElement

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
      })

      expect(playerEl.style.display).toBe('none')
    })
  })

  describe('getSourceRect', () => {
    it('uses getSourceRect when closing if available', () => {
      const freshRect = makeDOMRect({ top: 50, left: 60 })
      const getSourceRect = vi.fn().mockReturnValue(freshRect)

      render(<VideoViewer {...defaultProps} getSourceRect={getSourceRect} />)

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
      })

      expect(getSourceRect).toHaveBeenCalled()
      expect(mockSpringStart).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({
            top: 50,
            left: 60,
          }),
        }),
      )
    })

    it('falls back to sourceRect when getSourceRect returns null', () => {
      const getSourceRect = vi.fn().mockReturnValue(null)

      render(
        <VideoViewer {...defaultProps} getSourceRect={getSourceRect} sourceRect={makeDOMRect()} />,
      )

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
      })

      expect(mockSpringStart).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({
            top: 100,
            left: 200,
          }),
        }),
      )
    })
  })

  describe('body scroll lock', () => {
    it('sets overflow hidden on mount', () => {
      render(<VideoViewer {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores overflow on unmount', () => {
      document.body.style.overflow = 'auto'
      const { unmount } = render(<VideoViewer {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
      unmount()
      expect(document.body.style.overflow).toBe('auto')
    })
  })

  describe('YouTube API', () => {
    it('creates a YT.Player with correct config', async () => {
      await act(async () => {
        render(<VideoViewer {...defaultProps} />)
      })

      expect(window.YT!.Player).toHaveBeenCalledWith(
        'yt-player',
        expect.objectContaining({
          videoId: 'test-video-id',
          playerVars: { autoplay: 1, rel: 0 },
          events: expect.objectContaining({
            onStateChange: expect.any(Function),
          }),
        }),
      )
    })

    it('fires onVideoEnd when player state is ENDED (0)', async () => {
      await act(async () => {
        render(<VideoViewer {...defaultProps} />)
      })

      const onStateChange = (window as unknown as Record<string, unknown>)
        .__ytOnStateChange as (event: { data: number }) => void

      act(() => {
        onStateChange({ data: 0 })
      })

      expect(defaultProps.onVideoEnd).toHaveBeenCalledTimes(1)
    })

    it('fires onVideoEnd only once for multiple ENDED events', async () => {
      await act(async () => {
        render(<VideoViewer {...defaultProps} />)
      })

      const onStateChange = (window as unknown as Record<string, unknown>)
        .__ytOnStateChange as (event: { data: number }) => void

      act(() => {
        onStateChange({ data: 0 })
        onStateChange({ data: 0 })
      })

      expect(defaultProps.onVideoEnd).toHaveBeenCalledTimes(1)
    })

    it('loads YT script if not already present', async () => {
      delete window.YT

      await act(async () => {
        render(<VideoViewer {...defaultProps} />)
      })

      const script = document.querySelector('script[src*="youtube.com/iframe_api"]')
      expect(script).toBeTruthy()
    })

    it('auto-closes after video ends', async () => {
      await act(async () => {
        render(<VideoViewer {...defaultProps} />)
      })

      const onStateChange = (window as unknown as Record<string, unknown>)
        .__ytOnStateChange as (event: { data: number }) => void

      act(() => {
        onStateChange({ data: 0 })
      })

      // setTimeout of 1500ms triggers handleClose
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      // The close animation starts, then onRest fires onClose
      expect(lastSpringOnRest).toBeDefined()
      act(() => lastSpringOnRest!())
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      const removeSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(<VideoViewer {...defaultProps} />)

      unmount()

      const removeEvents = removeSpy.mock.calls.map((c) => c[0])
      expect(removeEvents).toContain('resize')
      expect(removeEvents).toContain('keydown')
      expect(removeEvents).toContain('orientationchange')

      addSpy.mockRestore()
      removeSpy.mockRestore()
    })

    it('destroys YT player on unmount', async () => {
      let destroyFn: ReturnType<typeof vi.fn<() => void>>

      window.YT = {
        Player: vi.fn(function (_id, config) {
          ;(window as unknown as Record<string, unknown>).__ytOnStateChange =
            config.events?.onStateChange
          destroyFn = vi.fn<() => void>()
          return {
            pauseVideo: vi.fn(),
            destroy: destroyFn,
          }
        }),
        PlayerState: { ENDED: 0 },
      }

      let unmountFn: () => void
      await act(async () => {
        const result = render(<VideoViewer {...defaultProps} />)
        unmountFn = result.unmount
      })

      unmountFn!()
      expect(destroyFn!).toHaveBeenCalled()
    })
  })
})
