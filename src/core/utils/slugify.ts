import { replaceAll } from '@site/src/core/utils/replaceAll'

export const slugify = (name: string): string => {
  return encodeURIComponent(replaceAll(name.toLowerCase(), /[\s_]+/, '-'))
}
