import { initializeApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import config from './config'

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined

/** Returns the Firebase app instance. Only call in the browser. */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(config.firebase)
  }
  return app
}

/** Returns the Firebase Auth instance. Only call in the browser. */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

/** Returns the Firestore instance. Only call in the browser. */
export function getFirebaseFirestore(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}
