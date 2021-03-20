import * as admin from 'firebase-admin'
import { getCredential } from './getCredential'

export function getAdminInstance() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: getCredential(),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    })
  }

  return admin
}
