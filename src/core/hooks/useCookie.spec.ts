import { vi, describe, expect, it } from 'vitest'
import { useCookie } from './useCookie'
import jsCookie from 'js-cookie'

vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

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
