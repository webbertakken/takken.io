import type IdealImage from '@site/src/theme/IdealImage'
import React from 'react'
import type { ComponentProps } from 'react'
import type { Chapter } from '../chapters'
import styles from './BookSpread.module.css'
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
 * tilting up from the spine. On narrow screens the pages stack on one sheet.
 */
const BookSpread = ({ portrait, chapters }: Props): React.JSX.Element => (
  <div className={`${styles.book} mx-auto my-6 grid max-w-6xl sm:my-10 xl:grid-cols-2`}>
    <div className={`${page} ${styles.leftPage} flex flex-col justify-between gap-8`}>
      <Letter portrait={portrait} />
      <Elsewhere />
    </div>
    <div className={`${page} ${styles.rightPage}`}>
      <Contents chapters={chapters} />
    </div>
  </div>
)

export default BookSpread
