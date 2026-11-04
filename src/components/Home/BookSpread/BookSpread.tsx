import type IdealImage from '@site/src/theme/IdealImage'
import React from 'react'
import type { ComponentProps } from 'react'
import type { Chapter } from '../chapters'
import Contents from './Contents'
import Elsewhere from './Elsewhere'
import Letter from './Letter'

interface Props {
  portrait: ComponentProps<typeof IdealImage>['img']
  chapters: ReadonlyArray<Chapter>
}

const page = 'px-6 py-8 sm:px-12 sm:py-10'

/**
 * The home page as an open book: a letter on the left page, the table of contents on the right,
 * meeting at a shaded fold. On narrow screens the pages stack and the fold disappears.
 */
const BookSpread = ({ portrait, chapters }: Props): React.JSX.Element => (
  <div className="mx-auto my-6 grid max-w-6xl overflow-hidden rounded-md border border-solid border-black/10 bg-white shadow-[0_24px_60px_-24px_rgb(0_0_0/35%)] sm:my-10 lg:grid-cols-2 dark:border-white/10 dark:bg-[rgb(32_33_35)] dark:shadow-[0_24px_60px_-20px_rgb(0_0_0/80%)]">
    <div
      className={`${page} flex flex-col justify-between gap-8 lg:bg-[linear-gradient(to_right,transparent_86%,rgb(0_0_0/6%))] dark:lg:bg-[linear-gradient(to_right,transparent_86%,rgb(0_0_0/35%))]`}
    >
      <Letter portrait={portrait} />
      <Elsewhere />
    </div>
    <div
      className={`${page} border-0 border-t border-solid border-black/10 lg:border-t-0 lg:bg-[linear-gradient(to_right,rgb(0_0_0/6%),transparent_14%)] dark:border-white/10 dark:lg:bg-[linear-gradient(to_right,rgb(0_0_0/35%),transparent_14%)]`}
    >
      <Contents chapters={chapters} />
    </div>
  </div>
)

export default BookSpread
