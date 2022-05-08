import { getAdminInstance } from './getAdminInstance'

export const verifyIdentityToken = (token) => {
  return getAdminInstance()
    .auth()
    .verifyIdToken(token)
    .catch((error) => {
      throw error
    })
}
