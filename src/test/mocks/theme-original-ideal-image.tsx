interface Props {
  alt?: string
  className?: string
}

/** Lightweight stand-in for the original Docusaurus IdealImage component in tests. */
const IdealImage = ({ alt = '', className }: Props) => <img alt={alt} className={className} />

export default IdealImage
