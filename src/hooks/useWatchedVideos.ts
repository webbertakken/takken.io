import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@site/src/contexts/AuthContext'
import { useCookieConsent } from '@site/src/hooks/useCookieConsent'

const LOCAL_STORAGE_KEY = 'courses-watched'

const isBrowser = typeof window !== 'undefined'

function readLocalStorage(): Set<string> {
  if (!isBrowser) return new Set()
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed as string[])
    return new Set()
  } catch {
    return new Set()
  }
}

function writeLocalStorage(ids: Set<string>): void {
  if (!isBrowser) return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...ids]))
}

interface UseWatchedVideosResult {
  watchedIds: Set<string>
  toggleWatched: (videoId: string) => void
  loading: boolean
}

export function useWatchedVideos(): UseWatchedVideosResult {
  const { user } = useAuth()
  const { consent } = useCookieConsent()
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [mergedForUid, setMergedForUid] = useState<string | null>(null)
  const sessionIdsRef = useRef<Set<string>>(new Set())

  const canUseStorage = consent === 'accepted'

  useEffect(() => {
    if (!isBrowser) {
      setLoading(false)
      return
    }

    if (!user) {
      // Not signed in: use localStorage if cookies accepted, otherwise in-memory
      const ids = canUseStorage ? readLocalStorage() : sessionIdsRef.current
      setWatchedIds(new Set(ids))
      setLoading(false)
      return
    }

    // Signed in: connect to Firestore and merge any local/session progress
    let cancelled = false

    const setup = async (): Promise<(() => void) | undefined> => {
      const { getFirebaseFirestore } = await import('../core/firebase')
      const { doc, getDoc, onSnapshot, setDoc } = await import('firebase/firestore')

      const db = getFirebaseFirestore()
      const docRef = doc(db, 'users', user.uid, 'progress', 'courses')

      // Merge local + session IDs into Firestore on first sign-in
      if (mergedForUid !== user.uid) {
        const localIds = canUseStorage ? readLocalStorage() : new Set<string>()
        const combined = new Set([...localIds, ...sessionIdsRef.current])

        if (combined.size > 0) {
          const snapshot = await getDoc(docRef)
          const existing = snapshot.exists()
            ? new Set((snapshot.data().watchedVideoIds as string[]) ?? [])
            : new Set<string>()
          const merged = new Set([...existing, ...combined])
          // Update UI immediately, don't wait for onSnapshot round-trip
          if (!cancelled) setWatchedIds(merged)
          await setDoc(docRef, { watchedVideoIds: [...merged] }, { merge: true })
          if (canUseStorage) localStorage.removeItem(LOCAL_STORAGE_KEY)
          sessionIdsRef.current = new Set()
        }
        if (!cancelled) {
          setMergedForUid(user.uid)
        }
      }

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (cancelled) return
        if (snapshot.exists()) {
          const data = snapshot.data()
          setWatchedIds(new Set((data.watchedVideoIds as string[]) ?? []))
        } else {
          setWatchedIds(new Set())
        }
        setLoading(false)
      })

      return unsubscribe
    }

    let unsubscribe: (() => void) | undefined

    void setup().then((unsub) => {
      if (cancelled && unsub) {
        unsub()
      } else {
        unsubscribe = unsub
      }
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [user, mergedForUid, canUseStorage])

  const toggleWatched = useCallback(
    (videoId: string) => {
      setWatchedIds((prev) => {
        const next = new Set(prev)
        if (next.has(videoId)) {
          next.delete(videoId)
        } else {
          next.add(videoId)
        }

        if (!user) {
          if (canUseStorage) {
            writeLocalStorage(next)
          }
          sessionIdsRef.current = new Set(next)
        } else {
          void (async () => {
            const { getFirebaseFirestore } = await import('../core/firebase')
            const { doc, setDoc } = await import('firebase/firestore')
            const db = getFirebaseFirestore()
            const docRef = doc(db, 'users', user.uid, 'progress', 'courses')
            await setDoc(docRef, { watchedVideoIds: [...next] }, { merge: true })
          })()
        }

        return next
      })
    },
    [user, canUseStorage],
  )

  return { watchedIds, toggleWatched, loading }
}
