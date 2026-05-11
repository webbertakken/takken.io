/**
 * Two-tier model cache. The browser-side path uses the **OPFS**
 * (Origin Private File System) so weights persist across visits without
 * begging for storage permissions. The test-side path uses an in-memory
 * `Map`. Both implement the same `ObjectStore` interface so callers don't
 * branch on environment.
 */
export interface ObjectStore {
  read(key: string): Promise<ArrayBuffer | null>
  write(key: string, data: ArrayBuffer): Promise<void>
  delete(key: string): Promise<void>
  list(): Promise<readonly string[]>
}

export const createMemoryStore = (): ObjectStore => {
  const map = new Map<string, ArrayBuffer>()
  return {
    async read(key: string): Promise<ArrayBuffer | null> {
      const v = map.get(key)
      return v ? v.slice(0) : null
    },
    async write(key: string, data: ArrayBuffer): Promise<void> {
      map.set(key, data.slice(0))
    },
    async delete(key: string): Promise<void> {
      map.delete(key)
    },
    async list(): Promise<readonly string[]> {
      return [...map.keys()]
    },
  }
}

/* v8 ignore start -- OPFS is browser-only; covered by Phase 9 manual smoke. */
interface OpfsRoot {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<OpfsRoot>
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<{
    getFile(): Promise<Blob>
    createWritable(): Promise<{ write(data: ArrayBuffer): Promise<void>; close(): Promise<void> }>
    remove?(): Promise<void>
  }>
  removeEntry?(name: string): Promise<void>
  values?(): AsyncIterable<{ name: string }>
}

export const createOpfsStore = async (rootName: string): Promise<ObjectStore> => {
  const storage = (
    globalThis as { navigator?: { storage?: { getDirectory?: () => Promise<OpfsRoot> } } }
  ).navigator?.storage
  if (!storage?.getDirectory) {
    throw new Error('OPFS not available in this environment')
  }
  const root = await storage.getDirectory()
  const dir = await root.getDirectoryHandle(rootName, { create: true })

  return {
    async read(key: string): Promise<ArrayBuffer | null> {
      try {
        const handle = await dir.getFileHandle(key)
        const file = await handle.getFile()
        return await file.arrayBuffer()
      } catch {
        return null
      }
    },
    async write(key: string, data: ArrayBuffer): Promise<void> {
      const handle = await dir.getFileHandle(key, { create: true })
      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
    },
    async delete(key: string): Promise<void> {
      if (dir.removeEntry) await dir.removeEntry(key)
    },
    async list(): Promise<readonly string[]> {
      if (!dir.values) return []
      const keys: string[] = []
      for await (const entry of dir.values()) keys.push(entry.name)
      return keys
    },
  }
}
/* v8 ignore stop */

export interface GetOrFetchOptions {
  store: ObjectStore
  fetchImpl?: typeof fetch
  onProgress?: (loaded: number, total: number | null) => void
}

const consumeStreaming = async (
  body: ReadableStream<Uint8Array>,
  total: number | null,
  onProgress: (loaded: number, total: number | null) => void,
): Promise<ArrayBuffer> => {
  const chunks: Uint8Array[] = []
  let loaded = 0
  const reader = body.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    onProgress(loaded, total)
  }
  const out = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out.buffer
}

/**
 * Read `key` from the cache; on miss, fetch `url`, write to cache, return the
 * buffer. Streams the fetch when possible so large model downloads can show a
 * progress bar.
 */
export const getOrFetch = async (
  url: string,
  key: string,
  { store, fetchImpl = fetch, onProgress = () => {} }: GetOrFetchOptions,
): Promise<ArrayBuffer> => {
  const cached = await store.read(key)
  if (cached) return cached

  const response = await fetchImpl(url)
  if (!response.ok) {
    throw new Error(`Fetch ${url} failed: ${response.status} ${response.statusText}`)
  }

  const totalHeader = response.headers.get('content-length')
  const total = totalHeader ? Number(totalHeader) : null

  let data: ArrayBuffer
  if (response.body) {
    data = await consumeStreaming(
      response.body as unknown as ReadableStream<Uint8Array>,
      total,
      onProgress,
    )
  } else {
    data = await response.arrayBuffer()
    onProgress(data.byteLength, data.byteLength)
  }

  await store.write(key, data)
  return data
}
