import Translate, { translate } from '@docusaurus/Translate'
import React, { useState } from 'react'

interface Props {
  readonly onReload: () => void
}

export default function PwaReloadPopup({ onReload }: Props): React.ReactNode {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return null
  }

  return (
    <div className="alert alert--secondary" style={popupStyle}>
      <p>
        <Translate id="theme.PwaReloadPopup.info" description="The text for PWA reload popup">
          New version available
        </Translate>
      </p>
      <div style={buttonContainerStyle}>
        <button
          className="button button--link"
          type="button"
          onClick={() => {
            setIsVisible(false)
            onReload()
          }}
        >
          <Translate
            id="theme.PwaReloadPopup.refreshButtonText"
            description="The text for PWA reload button"
          >
            Refresh
          </Translate>
        </button>

        <button
          aria-label={translate({
            id: 'theme.PwaReloadPopup.closeButtonAriaLabel',
            message: 'Close',
            description: 'The ARIA label for close button of PWA reload popup',
          })}
          className="close"
          type="button"
          onClick={() => setIsVisible(false)}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  )
}

const popupStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  right: 0,
  margin: '1rem',
  zIndex: 100,
  maxWidth: '350px',
}

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
}
