import React from 'react'

interface Props {
  children: string
}

const PoemText = ({ children }: Props): JSX.Element => {
  return (
    <div>
      <div className="text-2xl whitespace-pre [&_p]:leading-5 [&_p]:py-3">{children}</div>
    </div>
  )
}

export default PoemText
