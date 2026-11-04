import IdealImage from '@site/src/theme/IdealImage'
import React from 'react'

type IdealImageSource = React.ComponentProps<typeof IdealImage>['img']

interface Props {
  /** The image, as returned by `require('./assets/<file>')`. */
  img: IdealImageSource
  /** A full description of the sketch, including every label it carries. */
  alt: string
}

/**
 * A hand-drawn visual metaphor, framed like a print on the page.
 * Selecting it opens the full-resolution sketch; the enlarged view is portalled
 * outside the figure, so the frame styles below only touch the inline print.
 */
const Visual = ({ img, alt }: Props): React.JSX.Element => (
  <figure className="mx-auto mt-8 mb-4 w-full max-w-[36rem] [&_img]:rounded-xl [&_img]:border [&_img]:border-solid [&_img]:border-black/10 [&_img]:shadow-[0_14px_36px_-14px_rgb(28_30_33/40%)] dark:[&_img]:border-white/15 dark:[&_img]:shadow-[0_14px_36px_-14px_rgb(0_0_0/80%)]">
    <IdealImage img={img} alt={alt} noPadding />
  </figure>
)

export default Visual
