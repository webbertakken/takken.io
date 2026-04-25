import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

let mockUser: { uid: string } | null = null
let mockConsent: string | null = null

vi.mock('@site/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@site/src/hooks/useCookieConsent', () => ({
  useCookieConsent: () => ({ consent: mockConsent }),
}))

const mockOnSnapshot = vi.fn()
const mockGetDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockDoc = vi.fn(() => 'mock-doc-ref')
const mockDb = { name: 'mock-db' }

vi.mock('../core/firebase', () => ({
  getFirebaseFirestore: () => mockDb,
}))

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => (mockDoc as (...a: unknown[]) => unknown)(...args),
  getDoc: (...args: unknown[]) => (mockGetDoc as (...a: unknown[]) => unknown)(...args),
  setDoc: (...args: unknown[]) => (mockSetDoc as (...a: unknown[]) => unknown)(...args),
  onSnapshot: (...args: unknown[]) => (mockOnSnapshot as (...a: unknown[]) => unknown)(...args),
}))

import { useWatchedVideos } from './useWatchedVideos'

describe('useWatchedVideos', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>
  let removeItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
    mockConsent = null
    localStorage.clear()
    vi.spyOn(Storage.prototype, 'getItem')
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

    mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
      callback({ exists: () => false, data: () => null })
      return vi.fn()
    })
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null })
    mockSetDoc.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('anonymous with cookies accepted', () => {
    beforeEach(() => {
      mockConsent = 'accepted'
    })

    it('reads watched IDs from localStorage', () => {
      localStorage.setItem('courses-watched', JSON.stringify(['vid-1', 'vid-2']))

      const { result } = renderHook(() => useWatchedVideos())

      expect(result.current.watchedIds.has('vid-1')).toBe(true)
      expect(result.current.watchedIds.has('vid-2')).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    it('returns empty set when no localStorage data exists', () => {
      const { result } = renderHook(() => useWatchedVideos())

      expect(result.current.watchedIds.size).toBe(0)
    })

    it('handles invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('courses-watched', 'not-json')

      const { result } = renderHook(() => useWatchedVideos())

      expect(result.current.watchedIds.size).toBe(0)
    })

    it('handles non-array JSON in localStorage gracefully', () => {
      localStorage.setItem('courses-watched', '{"not": "array"}')

      const { result } = renderHook(() => useWatchedVideos())

      expect(result.current.watchedIds.size).toBe(0)
    })

    it('writes to localStorage when toggling watched', () => {
      const { result } = renderHook(() => useWatchedVideos())

      act(() => {
        result.current.toggleWatched('vid-1')
      })

      expect(setItemSpy).toHaveBeenCalledWith('courses-watched', expect.stringContaining('vid-1'))
      expect(result.current.watchedIds.has('vid-1')).toBe(true)
    })

    it('removes from localStorage when toggling off', () => {
      localStorage.setItem('courses-watched', JSON.stringify(['vid-1']))

      const { result } = renderHook(() => useWatchedVideos())

      act(() => {
        result.current.toggleWatched('vid-1')
      })

      expect(result.current.watchedIds.has('vid-1')).toBe(false)
    })
  })

  describe('anonymous with cookies declined', () => {
    beforeEach(() => {
      mockConsent = 'declined'
    })

    it('uses in-memory state (no localStorage reads for watched data)', () => {
      const { result } = renderHook(() => useWatchedVideos())

      expect(result.current.watchedIds.size).toBe(0)
      expect(result.current.loading).toBe(false)
    })

    it('toggles in memory without writing to localStorage', () => {
      const { result } = renderHook(() => useWatchedVideos())

      act(() => {
        result.current.toggleWatched('vid-1')
      })

      expect(result.current.watchedIds.has('vid-1')).toBe(true)
      // Should not write to courses-watched key
      const coursesWatchedCalls = setItemSpy.mock.calls.filter(
        (call: Parameters<Storage['setItem']>) => call[0] === 'courses-watched',
      )
      expect(coursesWatchedCalls).toHaveLength(0)
    })
  })

  describe('anonymous with no consent choice', () => {
    beforeEach(() => {
      mockConsent = null
    })

    it('uses in-memory state', () => {
      const { result } = renderHook(() => useWatchedVideos())

      expect(result.current.watchedIds.size).toBe(0)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('signed in (Firestore)', () => {
    beforeEach(() => {
      mockUser = { uid: 'user-123' }
      mockConsent = 'accepted'
    })

    it('connects to Firestore and listens for changes', async () => {
      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({
          exists: () => true,
          data: () => ({ watchedVideoIds: ['vid-a', 'vid-b'] }),
        })
        return vi.fn()
      })

      const { result } = renderHook(() => useWatchedVideos())

      // Wait for async setup
      await vi.waitFor(() => {
        expect(result.current.watchedIds.has('vid-a')).toBe(true)
        expect(result.current.watchedIds.has('vid-b')).toBe(true)
      })
    })

    it('sets loading to false after Firestore snapshot arrives', async () => {
      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({ exists: () => false, data: () => null })
        return vi.fn()
      })

      const { result } = renderHook(() => useWatchedVideos())

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('writes to Firestore when toggling watched', async () => {
      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({ exists: () => false, data: () => null })
        return vi.fn()
      })

      const { result } = renderHook(() => useWatchedVideos())

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.toggleWatched('vid-new')
      })

      await vi.waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          'mock-doc-ref',
          expect.objectContaining({ watchedVideoIds: expect.arrayContaining(['vid-new']) }),
          { merge: true },
        )
      })
    })

    it('returns empty set when Firestore document does not exist', async () => {
      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({ exists: () => false, data: () => null })
        return vi.fn()
      })

      const { result } = renderHook(() => useWatchedVideos())

      await vi.waitFor(() => {
        expect(result.current.watchedIds.size).toBe(0)
      })
    })
  })

  describe('sign-in merge', () => {
    it('merges localStorage IDs into Firestore on first sign-in', async () => {
      mockConsent = 'accepted'
      localStorage.setItem('courses-watched', JSON.stringify(['local-1', 'local-2']))

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ watchedVideoIds: ['remote-1'] }),
      })

      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({
          exists: () => true,
          data: () => ({ watchedVideoIds: ['remote-1', 'local-1', 'local-2'] }),
        })
        return vi.fn()
      })

      // Start anonymous
      mockUser = null
      const { result, rerender } = renderHook(() => useWatchedVideos())

      expect(result.current.loading).toBe(false)

      // Sign in
      mockUser = { uid: 'merge-user' }
      rerender()

      await vi.waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          'mock-doc-ref',
          {
            watchedVideoIds: expect.arrayContaining(['remote-1', 'local-1', 'local-2']),
          },
          { merge: true },
        )
      })

      // localStorage should be cleared after merge
      await vi.waitFor(() => {
        expect(removeItemSpy).toHaveBeenCalledWith('courses-watched')
      })
    })

    it('merges session IDs into Firestore on sign-in', async () => {
      mockConsent = 'declined'
      mockUser = null

      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      })

      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({ exists: () => false, data: () => null })
        return vi.fn()
      })

      const { result, rerender } = renderHook(() => useWatchedVideos())

      // Add some session IDs while anonymous
      act(() => {
        result.current.toggleWatched('session-1')
      })

      expect(result.current.watchedIds.has('session-1')).toBe(true)

      // Sign in
      mockUser = { uid: 'session-user' }
      rerender()

      await vi.waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          'mock-doc-ref',
          {
            watchedVideoIds: expect.arrayContaining(['session-1']),
          },
          { merge: true },
        )
      })
    })

    it('skips merge when no local or session IDs exist', async () => {
      mockConsent = 'accepted'
      mockUser = { uid: 'clean-user' }

      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({ exists: () => false, data: () => null })
        return vi.fn()
      })

      renderHook(() => useWatchedVideos())

      await vi.waitFor(() => {
        expect(mockOnSnapshot).toHaveBeenCalled()
      })

      // getDoc should not be called when there is nothing to merge
      expect(mockGetDoc).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('calls unsubscribe on unmount', async () => {
      const mockUnsub = vi.fn()
      mockOnSnapshot.mockImplementation((_ref: unknown, callback: (snap: unknown) => void) => {
        callback({ exists: () => false, data: () => null })
        return mockUnsub
      })

      mockUser = { uid: 'cleanup-user' }
      mockConsent = 'accepted'

      const { unmount } = renderHook(() => useWatchedVideos())

      await vi.waitFor(() => {
        expect(mockOnSnapshot).toHaveBeenCalled()
      })

      unmount()

      // The cleanup should eventually call the unsubscribe
      expect(mockUnsub).toHaveBeenCalled()
    })
  })
})
