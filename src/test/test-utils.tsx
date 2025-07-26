import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { Mock } from 'vitest'
import { vi } from 'vitest'

/**
 * Custom render method that includes common providers
 * Extend this when you add global providers like Theme, Router, etc.
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  // Add providers here as needed
  // const AllTheProviders = ({ children }: { children: ReactNode }) => {
  //   return <ThemeProvider>{children}</ThemeProvider>
  // }

  return render(ui, {
    // wrapper: AllTheProviders,
    ...options,
  })
}

/**
 * Type-safe mock for window properties
 */
export function mockWindowProperty<K extends keyof Window>(
  property: K,
  value: Window[K],
): () => void {
  const originalValue = window[property]
  const descriptor = Object.getOwnPropertyDescriptor(window, property)

  Object.defineProperty(window, property, {
    value,
    writable: true,
    configurable: true,
  })

  return () => {
    if (descriptor) {
      Object.defineProperty(window, property, descriptor)
    } else {
      Object.defineProperty(window, property, {
        value: originalValue,
        writable: true,
        configurable: true,
      })
    }
  }
}

/**
 * Create mock visual viewport for testing
 */
export interface MockVisualViewport {
  height: number
  width: number
  addEventListener: Mock<(event: string, listener: EventListener) => void>
  removeEventListener: Mock<(event: string, listener: EventListener) => void>
}

export function createMockVisualViewport(
  overrides?: Partial<MockVisualViewport>,
): MockVisualViewport {
  return {
    height: 800,
    width: 400,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...overrides,
  }
}

/**
 * Setup visual viewport mock
 */
export function setupVisualViewportMock(viewport?: Partial<MockVisualViewport>): () => void {
  const mockViewport = createMockVisualViewport(viewport)
  const restore = mockWindowProperty('visualViewport', mockViewport as unknown as VisualViewport)

  return () => {
    restore()
    vi.clearAllMocks()
  }
}

// Re-export everything from testing library for convenience
export * from '@testing-library/react'
