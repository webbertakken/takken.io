import { useEffect } from 'react'

/**
 * Custom hook that dynamically updates a CSS custom property with the viewport height.
 * This is useful for handling mobile browsers where the viewport height changes
 * when the address bar shows/hides.
 *
 * Sets the `--vh` CSS custom property on the document root element.
 *
 * @example
 * // In your component
 * useViewportHeight()
 *
 * // In your CSS
 * .full-height {
 *   height: calc(var(--vh, 1vh) * 100);
 * }
 */
export function useViewportHeight(): void {
  useEffect(() => {
    const setViewportHeight = (): void => {
      const height: number = window.visualViewport?.height ?? window.innerHeight
      const vh: number = height * 0.01
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

    return (): void => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight)
      } else {
        window.removeEventListener('resize', setViewportHeight)
      }
    }
  }, [])
}
