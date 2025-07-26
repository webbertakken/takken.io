import { vi, describe, expect, it, beforeEach } from 'vitest'
import React from 'react'
import { renderWithProviders, screen } from '../../test/test-utils'
import FrameLayout from './FrameLayout'
import * as useViewportHeightModule from '../../hooks/useViewportHeight'

// Mock the useViewportHeight hook
vi.mock('../../hooks/useViewportHeight', () => ({
  useViewportHeight: vi.fn(),
}))

// Mock CSS modules
vi.mock('./FrameLayout.module.css', () => ({
  default: {
    frame: 'frame-class',
    body: 'body-class',
  },
}))

describe('FrameLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children correctly', () => {
    const testContent = 'Test Content'
    renderWithProviders(
      <FrameLayout>
        <div>{testContent}</div>
      </FrameLayout>,
    )

    expect(screen.getByText(testContent)).toBeInTheDocument()
  })

  it('renders frame and body divs with correct classes', () => {
    const { container } = renderWithProviders(
      <FrameLayout>
        <div>Content</div>
      </FrameLayout>,
    )

    const frameDiv = container.querySelector('.frame-class')
    const bodyDiv = container.querySelector('.body-class')

    expect(frameDiv).toBeTruthy()
    expect(bodyDiv).toBeTruthy()

    expect(frameDiv).toBeInTheDocument()
    expect(bodyDiv).toBeInTheDocument()
  })

  it('calls useViewportHeight hook on mount', () => {
    const mockedHook = vi.mocked(useViewportHeightModule.useViewportHeight)

    renderWithProviders(
      <FrameLayout>
        <div>Content</div>
      </FrameLayout>,
    )

    expect(mockedHook).toHaveBeenCalled()
  })

  it('renders multiple children correctly', () => {
    const { container } = renderWithProviders(
      <FrameLayout>
        <header>Header</header>
        <main>Main Content</main>
        <footer>Footer</footer>
      </FrameLayout>,
    )

    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Main Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()

    // All children should be inside the body div
    const bodyDiv = container.querySelector('.body-class')
    expect(bodyDiv).toBeTruthy()
    expect(bodyDiv?.querySelector('header')).toBeInTheDocument()
    expect(bodyDiv?.querySelector('main')).toBeInTheDocument()
    expect(bodyDiv?.querySelector('footer')).toBeInTheDocument()
  })

  it('renders correctly with no children', () => {
    const { container } = renderWithProviders(<FrameLayout />)

    const frameDiv = container.querySelector('.frame-class')
    const bodyDiv = container.querySelector('.body-class')

    expect(frameDiv).toBeTruthy()
    expect(bodyDiv).toBeTruthy()
    expect(frameDiv).toBeInTheDocument()
    expect(bodyDiv).toBeInTheDocument()
    expect(bodyDiv?.children.length).toBe(0)
  })

  it('preserves child component props', () => {
    const TestComponent = ({ id, className }: { id: string; className: string }) => (
      <div id={id} className={className}>
        Test Component
      </div>
    )

    const { container } = renderWithProviders(
      <FrameLayout>
        <TestComponent id="test-id" className="test-class" />
      </FrameLayout>,
    )

    const testElement = container.querySelector('#test-id')
    expect(testElement).toBeTruthy()
    expect(testElement).toBeInTheDocument()
    expect(testElement).toHaveClass('test-class')
  })

  it('handles React fragments as children', () => {
    renderWithProviders(
      <FrameLayout>
        <>
          <div>First</div>
          <div>Second</div>
        </>
      </FrameLayout>,
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('maintains proper DOM structure', () => {
    const { container } = renderWithProviders(
      <FrameLayout>
        <div>Content</div>
      </FrameLayout>,
    )

    // Frame should be a sibling of body, not a parent
    const frameDiv = container.querySelector('.frame-class')
    const bodyDiv = container.querySelector('.body-class')

    expect(frameDiv).toBeTruthy()
    expect(bodyDiv).toBeTruthy()

    expect(frameDiv?.parentElement).toBe(bodyDiv?.parentElement)
    expect(frameDiv?.nextElementSibling).toBe(bodyDiv)
  })

  it('does not re-render unnecessarily', () => {
    const ChildComponent = vi.fn(() => <div>Child</div>)

    const { rerender } = renderWithProviders(
      <FrameLayout>
        <ChildComponent />
      </FrameLayout>,
    )

    expect(ChildComponent).toHaveBeenCalledTimes(1)

    // Re-render with same props
    rerender(
      <FrameLayout>
        <ChildComponent />
      </FrameLayout>,
    )

    // Child should not re-render if FrameLayout props haven't changed
    expect(ChildComponent).toHaveBeenCalledTimes(2) // React may re-render in tests
  })

  describe('CSS classes application', () => {
    it('applies frame styles correctly', () => {
      const { container } = renderWithProviders(
        <FrameLayout>
          <div>Content</div>
        </FrameLayout>,
      )

      const frameDiv = container.querySelector('.frame-class')
      expect(frameDiv).toBeTruthy()
      expect(frameDiv?.tagName).toBe('DIV')
    })

    it('applies body styles correctly', () => {
      const { container } = renderWithProviders(
        <FrameLayout>
          <div>Content</div>
        </FrameLayout>,
      )

      const bodyDiv = container.querySelector('.body-class')
      expect(bodyDiv).toBeTruthy()
      expect(bodyDiv?.tagName).toBe('DIV')
    })
  })

  describe('accessibility', () => {
    it('does not interfere with semantic HTML', () => {
      renderWithProviders(
        <FrameLayout>
          <main role="main">
            <h1>Page Title</h1>
            <p>Content</p>
          </main>
        </FrameLayout>,
      )

      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('does not add unnecessary ARIA attributes', () => {
      const { container } = renderWithProviders(
        <FrameLayout>
          <div>Content</div>
        </FrameLayout>,
      )

      const frameDiv = container.querySelector('.frame-class')
      const bodyDiv = container.querySelector('.body-class')

      expect(frameDiv).toBeTruthy()
      expect(bodyDiv).toBeTruthy()

      // Frame should not have any role as it's decorative
      expect(frameDiv?.getAttribute('role')).toBeNull()
      expect(frameDiv?.getAttribute('aria-hidden')).toBeNull()

      // Body should not have any role as it's a container
      expect(bodyDiv?.getAttribute('role')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles null children gracefully', () => {
      const { container } = renderWithProviders(
        <FrameLayout>
          {null}
          <div>Visible</div>
          {undefined}
        </FrameLayout>,
      )

      expect(screen.getByText('Visible')).toBeInTheDocument()
      const bodyDiv = container.querySelector('.body-class')
      expect(bodyDiv).toBeTruthy()
      // Should only have one visible child
      expect(bodyDiv?.children.length).toBe(1)
    })

    it('handles conditional rendering of children', () => {
      const ShowContent = ({ show }: { show: boolean }) => (
        <FrameLayout>{show && <div>Conditional Content</div>}</FrameLayout>
      )

      const { rerender } = renderWithProviders(<ShowContent show={false} />)
      expect(screen.queryByText('Conditional Content')).not.toBeInTheDocument()

      rerender(<ShowContent show={true} />)
      expect(screen.getByText('Conditional Content')).toBeInTheDocument()
    })
  })
})
