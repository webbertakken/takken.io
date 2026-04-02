import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const isBrowser = typeof window !== 'undefined'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isBrowser)

  useEffect(() => {
    if (!isBrowser) return

    let unsubscribe: (() => void) | undefined

    void (async () => {
      const { getFirebaseAuth } = await import('../core/firebase')
      const { onAuthStateChanged } = await import('firebase/auth')

      const auth = getFirebaseAuth()
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser)
        setLoading(false)
      })
    })()

    return () => unsubscribe?.()
  }, [])

  const signInWithGoogle = async (): Promise<void> => {
    const { getFirebaseAuth } = await import('../core/firebase')
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')

    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signInWithGitHub = async (): Promise<void> => {
    const { getFirebaseAuth } = await import('../core/firebase')
    const { GithubAuthProvider, signInWithPopup } = await import('firebase/auth')

    const auth = getFirebaseAuth()
    const provider = new GithubAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signOut = async (): Promise<void> => {
    const { getFirebaseAuth } = await import('../core/firebase')
    const { signOut: firebaseSignOut } = await import('firebase/auth')

    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
  }

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
