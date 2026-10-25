export async function sha256(message: string | Uint8Array<ArrayBuffer>): Promise<string> {
  const msgBuffer = typeof message === 'string' ? new TextEncoder().encode(message) : message

  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)

  const hashArray = Array.from(new Uint8Array(hashBuffer))

  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
