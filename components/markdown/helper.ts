const extractTitle = (line) => {
  if (!line) {
    // eslint-disable-next-line no-console
    console.log('\u001B[33m%s\u001B[0m  - %s', 'warn', 'Unable to extract title from', line)
    return ''
  }
  return line.replace(/^[\s#]*/, '').trim()
}

export const extractAnchorId = (line) => {
  return extractTitle(line).toLowerCase().split(' ').join('-')
}
