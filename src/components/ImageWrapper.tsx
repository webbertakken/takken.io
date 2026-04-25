import React, { PropsWithChildren } from 'react'

const ImageWrapper = ({ children }: PropsWithChildren<object>): React.JSX.Element => {
  return <div style={{ display: 'flex', gap: '2rem', paddingBottom: '1rem' }}>{children}</div>
}

export default ImageWrapper
