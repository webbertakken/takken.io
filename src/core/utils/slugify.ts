import { replaceAll } from '@site/src/core/utils/replaceAll'

export const slugify = (name: string) => {
  return encodeURIComponent(replaceAll(name.toLowerCase(), /[\s_]+/, '-'))
}
