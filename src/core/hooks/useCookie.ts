import api, { CookieAttributes } from 'js-cookie'

const defaultOptions: CookieAttributes = {
  path: '/',
  secure: true,
}

export function useCookie(name: string, options: CookieAttributes = {}) {
  const defaults = { ...defaultOptions, ...options }

  return {
    getValue: () => api.get(name),
    setValue: (value: string, optionOverrides?: CookieAttributes) =>
      api.set(name, value, { ...defaults, ...optionOverrides }),
    remove: () => api.remove(name),
  }
}
