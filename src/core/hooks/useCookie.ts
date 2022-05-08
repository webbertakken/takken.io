import api from 'js-cookie'

const defaultOptions = {
  path: '/',
  secure: true,
}

export function useCookie(name, options = {}) {
  const defaults = { ...defaultOptions, ...options }

  return {
    getValue: () => api.get(name),
    setValue: (value, optionOverrides) => api.set(name, value, { ...defaults, ...optionOverrides }),
    remove: () => api.remove(name),
  }
}
