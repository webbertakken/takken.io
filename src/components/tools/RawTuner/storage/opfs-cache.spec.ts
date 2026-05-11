import { describe, expect, it, vi } from 'vitest'
import { createMemoryStore, getOrFetch, type ObjectStore } from './opfs-cache'

const buffer = (bytes: readonly number[]): ArrayBuffer => new Uint8Array(bytes).buffer

describe('createMemoryStore', () => {
  it('round-trips an arbitrary buffer', async () => {
    const store = createMemoryStore()
    const data = buffer([1, 2, 3, 4])

    expect(await store.read('clip')).toBeNull()

    await store.write('clip', data)
    const out = await store.read('clip')

    expect(out).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(out!)).toEqual(new Uint8Array(data))
  })

  it('overwrites a previous value at the same key', async () => {
    const store = createMemoryStore()
    await store.write('k', buffer([1]))
    await store.write('k', buffer([2, 3]))

    expect(new Uint8Array((await store.read('k'))!)).toEqual(new Uint8Array([2, 3]))
  })

  it('returns the keys the store has', async () => {
    const store = createMemoryStore()
    await store.write('a', buffer([1]))
    await store.write('b', buffer([2]))

    expect([...(await store.list())].sort()).toEqual(['a', 'b'])
  })

  it('removes a key on delete', async () => {
    const store = createMemoryStore()
    await store.write('a', buffer([1]))
    await store.delete('a')

    expect(await store.read('a')).toBeNull()
  })
})

describe('getOrFetch', () => {
  const headersFor = (length: number | null): Headers => {
    const h = new Headers()
    if (length !== null) h.set('content-length', String(length))
    return h
  }

  const mockResponse = (body: ArrayBuffer, length: number | null = body.byteLength) => {
    const reader = (() => {
      let sent = false
      return {
        read: async () =>
          sent
            ? { value: undefined, done: true }
            : ((sent = true), { value: new Uint8Array(body), done: false }),
        cancel: async () => undefined,
      }
    })()
    return {
      ok: true,
      headers: headersFor(length),
      body: { getReader: () => reader },
      arrayBuffer: async () => body,
    } as unknown as Response
  }

  it('fetches and caches a fresh URL', async () => {
    const store: ObjectStore = createMemoryStore()
    const fetchImpl = vi.fn(async () => mockResponse(buffer([10, 20, 30])))

    const out = await getOrFetch('https://example.com/clip.bin', 'clip', { store, fetchImpl })

    expect(fetchImpl).toHaveBeenCalledWith('https://example.com/clip.bin')
    expect(new Uint8Array(out)).toEqual(new Uint8Array([10, 20, 30]))
    expect(new Uint8Array((await store.read('clip'))!)).toEqual(new Uint8Array([10, 20, 30]))
  })

  it('returns the cached buffer without hitting the network', async () => {
    const store = createMemoryStore()
    await store.write('clip', buffer([99]))
    const fetchImpl = vi.fn(async () => mockResponse(buffer([0])))

    const out = await getOrFetch('https://example.com/clip.bin', 'clip', { store, fetchImpl })

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(new Uint8Array(out)).toEqual(new Uint8Array([99]))
  })

  it('reports progress during the fetch', async () => {
    const store = createMemoryStore()
    const fetchImpl = vi.fn(async () => mockResponse(buffer([1, 2, 3, 4]), 4))
    const calls: { loaded: number; total: number | null }[] = []

    await getOrFetch('https://example.com/clip.bin', 'clip', {
      store,
      fetchImpl,
      onProgress: (loaded, total) => calls.push({ loaded, total }),
    })

    expect(calls.at(-1)).toEqual({ loaded: 4, total: 4 })
  })

  it('propagates non-OK responses', async () => {
    const store = createMemoryStore()
    const fetchImpl = vi.fn(
      async () => ({ ok: false, status: 404, statusText: 'Not Found' }) as Response,
    )

    await expect(
      getOrFetch('https://example.com/clip.bin', 'clip', { store, fetchImpl }),
    ).rejects.toThrow(/404/)
  })

  it('handles a streaming response without content-length', async () => {
    const store = createMemoryStore()
    const fetchImpl = vi.fn(async () => mockResponse(buffer([1, 2]), null))
    const progress: { loaded: number; total: number | null }[] = []

    await getOrFetch('https://example.com/clip.bin', 'clip', {
      store,
      fetchImpl,
      onProgress: (l, t) => progress.push({ loaded: l, total: t }),
    })

    expect(progress.some((p) => p.total === null)).toBe(true)
  })

  it('falls back to arrayBuffer() when the body is not streamable', async () => {
    const store = createMemoryStore()
    const fetchImpl = vi.fn(
      async () =>
        ({
          ok: true,
          headers: new Headers(),
          body: null,
          arrayBuffer: async () => buffer([7, 8]),
        }) as unknown as Response,
    )

    const out = await getOrFetch('https://example.com/clip.bin', 'clip', { store, fetchImpl })

    expect(new Uint8Array(out)).toEqual(new Uint8Array([7, 8]))
  })
})
