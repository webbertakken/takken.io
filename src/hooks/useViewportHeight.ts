import { useEffect } from 'react'

export function useViewportHeight() {
  useEffect(() => {
    const setViewportHeight = () => {
      // Use visualViewport if available (mobile browsers)
      const height = window.visualViewport?.height ?? window.innerHeight
      const vh = height * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Set initial value
    setViewportHeight()

    // Update on various viewport-related events
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', setViewportHeight)

    // Visual Viewport API for mobile browsers
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight)
      window.visualViewport.addEventListener('scroll', setViewportHeight)
    }

    // Touch events for Mobile
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let touchStartY: number
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = () => {
      setViewportHeight()
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })

    // Also update on regular scroll
    let ticking = false
    const updateOnScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setViewportHeight()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', updateOnScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', setViewportHeight)
      window.removeEventListener('orientationchange', setViewportHeight)
      window.removeEventListener('scroll', updateOnScroll)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight)
        window.visualViewport.removeEventListener('scroll', setViewportHeight)
      }
    }
  }, [])
}
