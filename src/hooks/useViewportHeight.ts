import { useEffect } from 'react'

export function useViewportHeight() {
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Set initial value
    setViewportHeight()

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', setViewportHeight)

    // Also update on scroll for iOS Safari
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
    }
  }, [])
}
