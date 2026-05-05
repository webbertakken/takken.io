import Link from '@docusaurus/Link'
import { useCookieConsent } from '@site/src/hooks/useCookieConsent'
import { loadGtm } from '@site/src/utils/loadGtm'
import React, { useEffect, useState } from 'react'

const GTM_ID = 'GTM-T4M9CW8'

const CookieConsent: React.FC = () => {
  const { consent, hydrated, accept, decline } = useCookieConsent()
  const [visible, setVisible] = useState(false)

  // Auto-load GTM when consent is already accepted
  useEffect(() => {
    if (consent === 'accepted') {
      loadGtm(GTM_ID)
    }
  }, [consent])

  // Animate in after hydration when no choice has been made
  useEffect(() => {
    if (!hydrated || consent !== null) return
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [hydrated, consent])

  const handleAccept = () => {
    accept()
    setVisible(false)
    loadGtm(GTM_ID)
  }

  const handleDecline = () => {
    decline()
    setVisible(false)
  }

  // Don't render during SSR or if a choice has already been made
  if (!hydrated || consent !== null) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-4 transition-transform duration-500 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex w-full max-w-2xl flex-col gap-3 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-lg backdrop-blur-lg sm:flex-row sm:items-center sm:gap-4 dark:border-gray-700 dark:bg-gray-900/80">
        <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
          <p className="m-0">
            We use cookies for anonymous analytics to improve the site.{' '}
            <Link to="/privacy" className="underline">
              Read our privacy policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="cursor-pointer rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="cursor-pointer rounded-lg border-0 bg-pink-darkest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-dark"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
