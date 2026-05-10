/**
 * Aggregator for `transformers.js` progress events. The library emits one
 * stream per file (config.json, model.onnx, tokenizer.json, ...) plus a
 * single `ready` event at the end. We track the latest percentage per file
 * and report the average so the UI can paint a single progress bar.
 *
 * Event shapes we care about (deduced from transformers.js source):
 *   { status: 'progress', name?: string, file?: string, progress: number }
 *   { status: 'done',     name?: string, file?: string }
 *   { status: 'ready' }
 */
export interface ProgressEvent {
  status: string
  name?: string
  file?: string
  progress?: number
  [key: string]: unknown
}

export interface LoadingProgressSnapshot {
  progress: number
  ready: boolean
}

export interface LoadingProgress {
  observe(event: ProgressEvent): void
  getProgress(): number
  isReady(): boolean
  onChange(listener: (snapshot: LoadingProgressSnapshot) => void): () => void
}

export const createLoadingProgress = (): LoadingProgress => {
  const files = new Map<string, number>()
  let ready = false
  const listeners = new Set<(s: LoadingProgressSnapshot) => void>()

  const computeAverage = (): number => {
    if (ready) return 100
    if (files.size === 0) return 0
    let sum = 0
    for (const value of files.values()) sum += value
    return Math.round(sum / files.size)
  }

  const notify = () => {
    const snapshot: LoadingProgressSnapshot = {
      progress: computeAverage(),
      ready,
    }
    for (const listener of listeners) listener(snapshot)
  }

  return {
    observe(event: ProgressEvent): void {
      if (event.status === 'ready') {
        ready = true
        notify()
        return
      }
      const key = event.name ?? event.file
      if (!key) return
      if (event.status === 'done') {
        files.set(key, 100)
        notify()
        return
      }
      if (typeof event.progress === 'number') {
        files.set(key, event.progress)
        notify()
      }
    },

    getProgress(): number {
      return computeAverage()
    },

    isReady(): boolean {
      return ready
    },

    onChange(listener: (snapshot: LoadingProgressSnapshot) => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
