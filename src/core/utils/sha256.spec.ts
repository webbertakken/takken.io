import { describe, expect, it } from 'vitest'
import { sha256 } from './sha256'

describe('sha256', () => {
  it('hashes a string', async () => {
    const hash = await sha256('abc')
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('hashes bytes', async () => {
    const hash = await sha256(new TextEncoder().encode('abc'))
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
