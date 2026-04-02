import { vi, describe, expect, it, beforeEach } from 'vitest'

const mockApp = { name: 'mock-app' }
const mockAuth = { name: 'mock-auth' }
const mockDb = { name: 'mock-db' }

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => mockApp),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockDb),
}))

vi.mock('./config', () => ({
  default: {
    firebase: {
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test',
    },
  },
}))

describe('firebase', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns a Firebase App instance', async () => {
    const { getFirebaseApp } = await import('./firebase')
    const app = getFirebaseApp()
    expect(app).toBe(mockApp)
  })

  it('only creates the app once (lazy initialisation)', async () => {
    const { initializeApp } = await import('firebase/app')
    const { getFirebaseApp } = await import('./firebase')

    getFirebaseApp()
    getFirebaseApp()

    expect(initializeApp).toHaveBeenCalledTimes(1)
  })

  it('returns a Firebase Auth instance', async () => {
    const { getFirebaseAuth } = await import('./firebase')
    const auth = getFirebaseAuth()
    expect(auth).toBe(mockAuth)
  })

  it('only creates auth once (lazy initialisation)', async () => {
    const { getAuth } = await import('firebase/auth')
    const { getFirebaseAuth } = await import('./firebase')

    getFirebaseAuth()
    getFirebaseAuth()

    expect(getAuth).toHaveBeenCalledTimes(1)
  })

  it('returns a Firestore instance', async () => {
    const { getFirebaseFirestore } = await import('./firebase')
    const db = getFirebaseFirestore()
    expect(db).toBe(mockDb)
  })

  it('only creates Firestore once (lazy initialisation)', async () => {
    const { getFirestore } = await import('firebase/firestore')
    const { getFirebaseFirestore } = await import('./firebase')

    getFirebaseFirestore()
    getFirebaseFirestore()

    expect(getFirestore).toHaveBeenCalledTimes(1)
  })
})
