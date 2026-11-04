import IdealImage from '@site/src/theme/IdealImage'
import React from 'react'
import type { ComponentProps } from 'react'
import styles from './BookSpread.module.css'

type Portrait = ComponentProps<typeof IdealImage>['img']

/** The left-hand page: a short letter to the visitor, with a photo print tucked into it. */
const Letter = ({ portrait }: { portrait: Portrait }): React.JSX.Element => (
  <article className="text-[0.95rem] leading-[1.75]">
    <h1 className="mb-5 text-3xl">Hi, I'm Webber.</h1>
    <figure
      className={`${styles.print} mb-6 ml-2 w-40 sm:float-right sm:mb-4 sm:ml-6 bg-[rgb(236_233_226)] p-2.5 pb-2 shadow-[0_14px_30px_-14px_rgb(0_0_0/55%)]`}
    >
      <IdealImage img={portrait} alt="Portrait of Webber Takken, by the sea" noPadding />
      <figcaption className="mt-2 text-center text-xs text-[rgb(40_40_44)]">
        Webber, by the sea
      </figcaption>
    </figure>

    <p>
      Still learning, mostly. These pages are notes from that: things I tried to understand well
      enough to explain simply.
    </p>
    <p>Some became posts, some became drawings, a few became tools. All of them are free.</p>
    <p>
      If something here is unclear or wrong, please <a href="mailto:webber@takken.io">say so</a>.
      That's usually where the next lesson is.
    </p>
    <p className="text-lg text-pink">Webber</p>
    <p className="mb-0 text-gray-600 dark:text-gray-400">
      P.S. Often found under water, on a slope, or on a ferry with an audiobook.
    </p>
  </article>
)

export default Letter
