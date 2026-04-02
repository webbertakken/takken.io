import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@site/src/contexts/AuthContext'

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
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [mergedForUid, setMergedForUid] = useState<string | null>(null)

  // Firestore real-time listener when signed in
  useEffect(() => {
    if (!isBrowser) {
      setLoading(false)
      return
    }

    if (!user) {
      // Signed out: use localStorage
      setWatchedIds(readLocalStorage())
      setLoading(false)
      return
    }

    let cancelled = false

    const setup = async (): Promise<(() => void) | undefined> => {
      const { getFirebaseFirestore } = await import('../core/firebase')
      const { doc, onSnapshot, setDoc } = await import('firebase/firestore')

      const db = getFirebaseFirestore()
      const docRef = doc(db, 'users', user.uid, 'progress', 'courses')

      // Merge localStorage into Firestore on first sign-in
      if (mergedForUid !== user.uid) {
        const localIds = readLocalStorage()
        if (localIds.size > 0) {
          const snapshot = await (await import('firebase/firestore')).getDoc(docRef)
          const existing = snapshot.exists()
            ? new Set((snapshot.data().watchedVideoIds as string[]) ?? [])
            : new Set<string>()
          const merged = new Set([...existing, ...localIds])
          await setDoc(docRef, { watchedVideoIds: [...merged] }, { merge: true })
          // Clear localStorage after merge
          localStorage.removeItem(LOCAL_STORAGE_KEY)
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
  }, [user, mergedForUid])

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
          // Persist to localStorage
          writeLocalStorage(next)
        } else {
          // Persist to Firestore
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
    [user],
  )

  return { watchedIds, toggleWatched, loading }
}
