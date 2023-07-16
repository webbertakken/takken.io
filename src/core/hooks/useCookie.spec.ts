import { vi, describe, expect, it } from 'vitest'
import { useCookie } from './useCookie'

// Methods must be hoisted to reference them in `vi.mock`
const jsCookie = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('js-cookie', () => ({ default: jsCookie }))

describe('useCookie', () => {
  it('is a function', () => {
    expect(useCookie).toBeTypeOf('function')
  })

  it('returns a getter, setter and remover', () => {
    const { getValue, setValue, remove } = useCookie('test')

    expect(getValue).toBeTypeOf('function')
    expect(setValue).toBeTypeOf('function')
    expect(remove).toBeTypeOf('function')
  })

  describe('getValue', () => {
    it('calls js-cookie.get', () => {
      // Act
      useCookie('test').getValue()

      // Assert
      expect(jsCookie.get).toHaveBeenCalledTimes(1)
    })
  })
})
