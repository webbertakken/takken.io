import { animated, useSpring } from '@react-spring/web'
import React, { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface VideoViewerProps {
  videoId: string
  sourceRect: DOMRect
  getSourceRect?: () => DOMRect | null
  onClose: () => void
  onVideoEnd?: () => void
}

interface YTPlayer {
  pauseVideo: () => void
  destroy: () => void
}

interface YTPlayerEvent {
  data: number
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onStateChange?: (event: YTPlayerEvent) => void
            onReady?: () => void
          }
        },
      ) => YTPlayer
      PlayerState: { ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

/** Load the YouTube IFrame API script once. */
const loadYTApi = (): Promise<void> => {
  if (window.YT?.Player) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  })
}

const computeFinalRect = (): { width: number; height: number; top: number; left: number } => {
  const vp = window.visualViewport
  const vw = vp?.width ?? window.innerWidth
  const vh = vp?.height ?? window.innerHeight
  const offsetTop = vp?.offsetTop ?? 0
  const offsetLeft = vp?.offsetLeft ?? 0
  const padding = 16
  const maxWidth = vw - padding * 2
  const maxHeight = vh - padding * 2
  const width = Math.min(maxWidth, maxHeight * (16 / 9))
  const height = width * (9 / 16)
  const top = offsetTop + (vh - height) / 2
  const left = offsetLeft + (vw - width) / 2
  return { width, height, top, left }
}

const VideoViewer = ({
  videoId,
  sourceRect,
  getSourceRect,
  onClose,
  onVideoEnd,
}: VideoViewerProps): React.ReactElement => {
  const closingRef = useRef(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const finalRect = computeFinalRect()

  const [springStyles, api] = useSpring(() => ({
    from: {
      top: sourceRect.top,
      left: sourceRect.left,
      width: sourceRect.width,
      height: sourceRect.height,
      borderRadius: 12,
    },
    to: {
      top: finalRect.top,
      left: finalRect.left,
      width: finalRect.width,
      height: finalRect.height,
      borderRadius: 12,
    },
    config: { tension: 200, friction: 22 },
  }))

  const [backdropSpring, backdropApi] = useSpring(() => ({
    from: { opacity: 0 },
    to: { opacity: 0.8 },
    config: { tension: 200, friction: 22 },
  }))

  // Keep stable refs so the effect doesn't re-run
  const onVideoEndRef = useRef(onVideoEnd)
  onVideoEndRef.current = onVideoEnd
  const handleCloseRef = useRef<() => void>(() => {})

  // Initialise YT player (once)
  useEffect(() => {
    let destroyed = false
    let endFired = false

    void loadYTApi().then(() => {
      if (destroyed || !window.YT) return

      playerRef.current = new window.YT.Player('yt-player', {
        videoId,
        playerVars: { autoplay: 1, rel: 0 },
        events: {
          onStateChange: (event: YTPlayerEvent) => {
            // 0 = ended, fire only once
            if (event.data === 0 && !endFired) {
              endFired = true
              onVideoEndRef.current?.()
              setTimeout(() => handleCloseRef.current(), 1500)
            }
          },
        },
      })
    })

    return () => {
      destroyed = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  const handleClose = useCallback((): void => {
    if (closingRef.current) return
    closingRef.current = true

    // Pause and hide the player
    playerRef.current?.pauseVideo()
    const playerEl = document.getElementById('yt-player')
    if (playerEl) playerEl.style.display = 'none'

    const currentRect = getSourceRect?.() ?? sourceRect

    backdropApi.start({ to: { opacity: 0 } })
    api.start({
      to: {
        top: currentRect.top,
        left: currentRect.left,
        width: currentRect.width,
        height: currentRect.height,
        borderRadius: 12,
      },
      onRest: () => {
        onClose()
      },
    })
  }, [api, backdropApi, sourceRect, getSourceRect, onClose])
  handleCloseRef.current = handleClose

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleClose])

  // Rescale on window resize
  useEffect(() => {
    const handleResize = (): void => {
      if (closingRef.current) return
      const newRect = computeFinalRect()
      api.start({
        to: {
          top: newRect.top,
          left: newRect.left,
          width: newRect.width,
          height: newRect.height,
        },
        config: { tension: 300, friction: 26 },
      })
    }
    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [api])

  // Periodically steal focus from iframe so Escape works
  useEffect(() => {
    const interval = setInterval(() => {
      if (!closingRef.current && document.activeElement instanceof HTMLIFrameElement) {
        containerRef.current?.focus()
      }
    }, 300)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return createPortal(
    <div ref={containerRef} tabIndex={-1} className="fixed inset-0 z-[9999] outline-none">
      <animated.div
        style={{ opacity: backdropSpring.opacity }}
        className="absolute inset-0 bg-black"
        onClick={handleClose}
      />

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 z-[10000] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Close video"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <animated.div
        style={{
          position: 'fixed',
          top: springStyles.top,
          left: springStyles.left,
          width: springStyles.width,
          height: springStyles.height,
          borderRadius: springStyles.borderRadius,
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        {/* YT.Player will replace this div with an iframe */}
        <div id="yt-player" className="h-full w-full" />
      </animated.div>
    </div>,
    document.body,
  )
}

export default VideoViewer
