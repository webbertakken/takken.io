import Link from '@docusaurus/Link'
import React from 'react'
import type { Chapter, ContentsEntry } from '../chapters'

const Entry = ({ entry }: { entry: ContentsEntry }): React.JSX.Element => (
  <li className="flex flex-wrap items-baseline gap-x-3 py-1">
    <Link
      to={entry.href}
      className="max-w-full shrink-0"
      {...(entry.external && { target: '_blank', rel: 'noreferrer' })}
    >
      {entry.title}
      {entry.external && <span className="sr-only">{' (opens in a new tab)'}</span>}
    </Link>
    <span
      aria-hidden="true"
      className="min-w-4 flex-1 translate-y-[-0.3em] border-0 border-b-2 border-dotted border-gray-300 dark:border-gray-600"
    />
    <span className="ml-auto whitespace-nowrap text-gray-600 dark:text-gray-400">{entry.note}</span>
  </li>
)

/** The right-hand page: what a visitor finds on the site, as a table of contents. */
const Contents = ({ chapters }: { chapters: ReadonlyArray<Chapter> }): React.JSX.Element => (
  <nav aria-labelledby="contents-heading">
    <h2
      id="contents-heading"
      className="mb-6 text-base font-medium text-gray-600 dark:text-gray-400"
    >
      What you'll find here
    </h2>
    {chapters.map((chapter) => (
      <section key={chapter.title} className="mb-7 last:mb-0">
        <h3 className="mb-1 flex items-baseline gap-3 text-xl">
          <span aria-hidden="true" className="text-sm font-normal text-pink">
            {chapter.numeral}
          </span>
          {chapter.title}
        </h3>
        <ul className="m-0 list-none p-0">
          {chapter.entries.map((entry) => (
            <Entry key={entry.href} entry={entry} />
          ))}
        </ul>
      </section>
    ))}
  </nav>
)

export default Contents
