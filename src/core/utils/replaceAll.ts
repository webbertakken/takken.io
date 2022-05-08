export const replaceAll = (input: string, searchValue: string | RegExp, replaceValue: string, limit?: number) => {
  return input.split(searchValue, limit).join(replaceValue)
}
