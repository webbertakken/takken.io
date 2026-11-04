/** One line in the home page's table of contents. */
export type ContentsEntry = {
  readonly title: string
  readonly href: string
  /** What sits at the end of the dotted leader: a short description or a date. */
  readonly note: string
  readonly external?: boolean
}

export type Chapter = {
  readonly numeral: string
  readonly title: string
  readonly entries: ReadonlyArray<ContentsEntry>
}

/** The latest blog posts, newest first. Update when a post is published. */
const latestPosts: ReadonlyArray<ContentsEntry> = [
  {
    title: 'Instruction sets',
    href: '/blog/instruction-sets',
    note: 'Aug 2026',
  },
  {
    title: 'The making of a model',
    href: '/blog/the-making-of-a-model-in-simple-words',
    note: 'Apr 2026',
  },
  {
    title: 'Surfacing ambiguities',
    href: '/blog/surfacing-ambiguities-and-hidden-assumptions',
    note: 'Apr 2026',
  },
]

export const chapters: ReadonlyArray<Chapter> = [
  {
    numeral: 'i',
    title: 'Things I made',
    entries: [
      { title: 'Minis.gg', href: 'https://minis.gg', note: 'free games', external: true },
      { title: 'docs.nu', href: 'https://docs.nu', note: 'free documents', external: true },
      { title: 'GameCI', href: 'https://game.ci', note: 'open source community', external: true },
      {
        title: 'citymap',
        href: 'https://webbertakken.github.io/citymap/',
        note: 'free code visualiser',
        external: true,
      },
    ],
  },
  { numeral: 'ii', title: 'Things I wrote', entries: latestPosts },
  {
    numeral: 'iii',
    title: 'Things I drew',
    entries: [
      {
        title: 'Iceberg of disconnect',
        href: '/notes/visuals#iceberg-of-disconnect',
        note: 'visuals',
      },
    ],
  },
  {
    numeral: 'iv',
    title: 'Things I learned',
    entries: [
      { title: 'Notes', href: '/notes/introduction', note: 'a living reference' },
      { title: 'Mindset', href: '/mindset', note: 'concepts for growing' },
    ],
  },
]
