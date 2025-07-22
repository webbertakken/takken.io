import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from '@docusaurus/router'

interface PageTransitionProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'none'
}

export default function PageTransition({ children, direction = 'none' }: PageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentDirection, setCurrentDirection] = useState<'left' | 'right' | 'none'>('none')
  const location = useLocation()
  const previousLocation = useRef(location.pathname)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Detect if this is a concepts-based navigation (mindset or approach)
    const isConceptsPage =
      location.pathname.startsWith('/mindset/') || location.pathname.startsWith('/approach/')
    const wasConceptsPage =
      previousLocation.current.startsWith('/mindset/') ||
      previousLocation.current.startsWith('/approach/')

    if (isConceptsPage && wasConceptsPage && location.pathname !== previousLocation.current) {
      // Trigger slide transition
      setIsTransitioning(true)
      setCurrentDirection(direction)

      // Complete transition after animation duration
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setCurrentDirection('none')
      }, 500) // Match CSS animation duration

      return () => clearTimeout(timer)
    }

    previousLocation.current = location.pathname
  }, [location.pathname, direction])

  const getTransformClass = () => {
    if (!isTransitioning) return ''

    switch (currentDirection) {
      case 'left':
        return 'animate-slide-in-left'
      case 'right':
        return 'animate-slide-in-right'
      default:
        return ''
    }
  }

  return (
    <div
      ref={containerRef}
      className={`transition-container ${getTransformClass()}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
