import { replaceAll } from '@/core/utils/replaceAll'

export const slugify = (name: string) => {
  return encodeURIComponent(replaceAll(name.toLowerCase(), /[\s_]+/, '-'))
}
