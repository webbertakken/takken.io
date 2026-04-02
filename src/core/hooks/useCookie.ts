import Cookies from 'js-cookie'

type CookieAttributes = Parameters<typeof Cookies.set>[2]

const defaultOptions: CookieAttributes = {
  path: '/',
  secure: true,
}

export function useCookie(name: string, options: CookieAttributes = {}) {
  const defaults = { ...defaultOptions, ...options }

  return {
    getValue: () => Cookies.get(name),
    setValue: (value: string, optionOverrides?: CookieAttributes) =>
      Cookies.set(name, value, { ...defaults, ...optionOverrides }),
    remove: () => Cookies.remove(name),
  }
}
