import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ErrorBoundary from '@docusaurus/ErrorBoundary'
import cx from 'classnames'

type ClickOrTouchEvent = React.MouseEvent<HTMLDialogElement> | React.TouchEvent<HTMLDialogElement>

interface ModalProps {
  onCloseRequested: () => void
  hasCloseButton?: boolean
  title?: string
  children: React.ReactNode
}

/**
 * It is assumed that the modal will always be opened when rendered.
 *
 * Usage:
 *   const [isOpen, setIsOpen] = useState<boolean>(false)
 *
 *   const open = () => setIsOpen(true)
 *   const close = () => setIsOpen(false)
 *
 *   return {isOpen && (
 *     <Modal onClose={close}>
 *       <div onClick={close}>Close me!</div>
 *     </Modal>
 *   )}
 */
const Modal: React.FC<ModalProps> = ({ hasCloseButton, title, children, onCloseRequested }) => {
  const modal = useRef<HTMLDialogElement>(null)
  const [clickTarget, setClickTarget] = useState<EventTarget>()

  /**
   * On mount, call native showModal() for accessibility and disable body scroll
   * On unmount, re-enable body scroll
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#accessibility_concerns
   */
  useEffect(() => {
    if (!modal.current) return

    document.body.style.overflow = 'hidden'
    modal.current.showModal()

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [modal])

  /**
   * The thing that ReactModal can't get right for many years now:
   * Select content of an input field and accidentally mouseup outside the modal (hint: it'll close)
   */
  const startClick = (e: ClickOrTouchEvent) => setClickTarget(e.target)
  const endClick = (e: ClickOrTouchEvent) => {
    if (e.target === clickTarget && e.target === modal.current) onCloseRequested()
    setClickTarget(undefined)
  }

  const hasTitleBar = title || hasCloseButton

  /**
   * The modal is rendered as a direct child of the body element.
   * Reason: styling, easy to find in the DOM, no z-index issues.
   */
  return createPortal(
    <ErrorBoundary>
      <dialog
        ref={modal}
        onClose={onCloseRequested}
        className={cx(
          'p-0 backdrop:backdrop-blur-lg backdrop:bg-gradient-to-br backdrop:from-rose-950/70 backdrop:to-black/50',
        )}
        onMouseDown={startClick}
        onMouseUp={endClick}
        onTouchStart={startClick}
        onTouchEnd={endClick}
        aria-label={title}
      >
        {hasTitleBar && (
          <div className="flex flex-row justify-between content-center w-full p-4 gap-4">
            {title && <h2 className="mb-0">{title}</h2>}

            {/* Title bar always has a close button for UX purposes */}
            <button
              autoFocus
              className="bg-transparent grayscale border-none hover:cursor-pointer text-3xl -my-1"
              onClick={onCloseRequested}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </dialog>
    </ErrorBoundary>,
    document.body,
  )
}

export default Modal
