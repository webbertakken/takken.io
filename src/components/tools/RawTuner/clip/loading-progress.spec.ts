import { describe, expect, it, vi } from 'vitest'
import { createLoadingProgress } from './loading-progress'

describe('createLoadingProgress', () => {
  it('starts at 0% and not ready', () => {
    const p = createLoadingProgress()

    expect(p.getProgress()).toBe(0)
    expect(p.isReady()).toBe(false)
  })

  it('reports the average completion across tracked files', () => {
    const p = createLoadingProgress()

    p.observe({ status: 'progress', name: 'config.json', progress: 100 })
    p.observe({ status: 'progress', name: 'model.onnx', progress: 50 })

    expect(p.getProgress()).toBe(75)
  })

  it('stays at 100% once all observed files are done', () => {
    const p = createLoadingProgress()

    p.observe({ status: 'progress', name: 'config.json', progress: 100 })
    p.observe({ status: 'progress', name: 'model.onnx', progress: 100 })
    p.observe({ status: 'done', name: 'model.onnx' })

    expect(p.getProgress()).toBe(100)
  })

  it('flips isReady on a "ready" event', () => {
    const p = createLoadingProgress()

    expect(p.isReady()).toBe(false)
    p.observe({ status: 'ready' })
    expect(p.isReady()).toBe(true)
    expect(p.getProgress()).toBe(100)
  })

  it('updates the existing entry when a file reports more progress', () => {
    const p = createLoadingProgress()

    p.observe({ status: 'progress', name: 'model.onnx', progress: 25 })
    p.observe({ status: 'progress', name: 'model.onnx', progress: 75 })

    expect(p.getProgress()).toBe(75)
  })

  it('falls back to file when name is absent', () => {
    const p = createLoadingProgress()

    p.observe({ status: 'progress', file: 'tokenizer.json', progress: 60 })

    expect(p.getProgress()).toBe(60)
  })

  it('ignores events for which we cannot infer a key', () => {
    const p = createLoadingProgress()

    // No name and no file -> ignored.
    p.observe({ status: 'progress', progress: 33 })

    expect(p.getProgress()).toBe(0)
  })

  it('notifies subscribers each time progress changes', () => {
    const p = createLoadingProgress()
    const listener = vi.fn()
    p.onChange(listener)

    p.observe({ status: 'progress', name: 'a', progress: 50 })
    p.observe({ status: 'progress', name: 'b', progress: 100 })
    p.observe({ status: 'ready' })

    expect(listener).toHaveBeenCalledTimes(3)
    expect(listener).toHaveBeenLastCalledWith({ progress: 100, ready: true })
  })

  it('lets subscribers unsubscribe', () => {
    const p = createLoadingProgress()
    const listener = vi.fn()
    const off = p.onChange(listener)

    p.observe({ status: 'progress', name: 'a', progress: 50 })
    off()
    p.observe({ status: 'progress', name: 'b', progress: 100 })

    expect(listener).toHaveBeenCalledTimes(1)
  })
})
