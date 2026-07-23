interface Props {
  alt?: string
  width?: number
  height?: number
}

/** Lightweight stand-in for the Docusaurus IdealImage wrapper in tests. */
const IdealImage = ({ alt = '', width, height }: Props) => (
  <img alt={alt} width={width} height={height} />
)

export default IdealImage
