import { useEffect } from 'react'

export function useViewportHeight() {
  useEffect(() => {
    const setViewportHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight
      const vh = height * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Set initial value
    setViewportHeight()

    // Visual Viewport API - handles mobile viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight)
    } else {
      // Fallback for browsers without visualViewport
      window.addEventListener('resize', setViewportHeight)
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight)
      } else {
        window.removeEventListener('resize', setViewportHeight)
      }
    }
  }, [])
}
