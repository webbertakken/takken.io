interface Props {
  alt?: string
  width?: number
  height?: number
}

/** Lightweight stand-in for the Docusaurus IdealImage wrapper in tests. */
const IdealImage = ({ alt = '', width, height }: Props) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img alt={alt} width={width} height={height} />
)

export default IdealImage
