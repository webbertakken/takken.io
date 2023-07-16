import React from 'react'

interface Props {
  level: number
  children: React.ReactNode
  id?: string
}

const Heading = ({ level, children, ...props }: Props) => {
  switch (level) {
    case 1:
      return (
        <h1 {...props} className="heading">
          {children}
        </h1>
      )
    case 2:
      return (
        <h2 {...props} className="heading">
          {children}
        </h2>
      )
    case 3:
      return (
        <h3 {...props} className="heading">
          {children}
        </h3>
      )
    case 4:
      return (
        <h4 {...props} className="heading">
          {children}
        </h4>
      )
    case 5:
      return (
        <h5 {...props} className="heading">
          {children}
        </h5>
      )
    case 6:
    default:
      return (
        <h6 {...props} className="heading">
          {children}
        </h6>
      )
  }
}

Heading.defaultProps = {
  id: undefined,
}

export default Heading
