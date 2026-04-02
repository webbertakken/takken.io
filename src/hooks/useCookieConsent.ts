import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cookie-consent'

type ConsentValue = 'accepted' | 'declined'

interface UseCookieConsentResult {
  /** The stored consent value, or null if no choice has been made yet. */
  consent: ConsentValue | null
  /** Whether the hook has read localStorage (false during SSR / before hydration). */
  hydrated: boolean
  accept: () => void
  decline: () => void
}

/** Manages GDPR cookie consent state via localStorage. SSR-safe. */
export const useCookieConsent = (): UseCookieConsentResult => {
  const [consent, setConsent] = useState<ConsentValue | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted' || stored === 'declined') {
      setConsent(stored)
    }
    setHydrated(true)
  }, [])

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setConsent('accepted')
  }, [])

  const decline = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setConsent('declined')
  }, [])

  return { consent, hydrated, accept, decline }
}
