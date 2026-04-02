import React from 'react'

const Link = ({
  children,
  to,
  ...rest
}: {
  children: React.ReactNode
  to: string
  className?: string
}): React.ReactElement => (
  <a href={to} {...rest}>
    {children}
  </a>
)

export default Link
