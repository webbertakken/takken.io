import { vi, describe, expect, it, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'

const mockAuth = { name: 'mock-auth' }
let authStateCallback: ((user: unknown) => void) | null = null
const mockUnsubscribe = vi.fn()
const mockSignInWithPopup = vi.fn().mockResolvedValue({ user: { uid: 'test' } })
const mockSignOut = vi.fn().mockResolvedValue(undefined)

vi.mock('../core/firebase', () => ({
  getFirebaseAuth: () => mockAuth,
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: unknown) => void) => {
    authStateCallback = callback
    return mockUnsubscribe
  }),
  GoogleAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

import { AuthProvider, useAuth } from './AuthContext'

function TestConsumer(): React.ReactElement {
  const { user, loading, signInWithGoogle, signInWithGitHub, signOut } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? 'signed-in' : 'no-user'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => void signInWithGoogle()}>Google</button>
      <button onClick={() => void signInWithGitHub()}>GitHub</button>
      <button onClick={() => void signOut()}>SignOut</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStateCallback = null
    mockSignInWithPopup.mockResolvedValue({ user: { uid: 'test' } })
    mockSignOut.mockResolvedValue(undefined)
  })

  it('provides null user initially', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(authStateCallback).not.toBeNull()
    })

    act(() => {
      authStateCallback!(null)
    })

    expect(screen.getByTestId('user').textContent).toBe('no-user')
  })

  it('updates user when onAuthStateChanged fires', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(authStateCallback).not.toBeNull()
    })

    act(() => {
      authStateCallback!({ uid: 'user-123', email: 'test@test.com' })
    })

    expect(screen.getByTestId('user').textContent).toBe('signed-in')
    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('calls signInWithPopup with GoogleAuthProvider', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByText('Google').click()
      // Wait for async signInWithGoogle to complete
      await vi.waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalledTimes(1)
      })
    })

    expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, expect.any(Object))
  })

  it('calls signInWithPopup with GithubAuthProvider', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByText('GitHub').click()
      await vi.waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalledTimes(1)
      })
    })

    expect(mockSignInWithPopup).toHaveBeenCalledWith(mockAuth, expect.any(Object))
  })

  it('calls firebase signOut', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await act(async () => {
      screen.getByText('SignOut').click()
      await vi.waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
      })
    })

    expect(mockSignOut).toHaveBeenCalledWith(mockAuth)
  })

  it('throws when useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider')

    spy.mockRestore()
  })

  it('unsubscribes from auth listener on unmount', async () => {
    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(authStateCallback).not.toBeNull()
    })

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
