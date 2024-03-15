import React, { memo, StrictMode } from 'react'

interface RootProps {
  children: React.ReactNode
}

const Root: React.FC<RootProps> = memo(({ children }) => {
  return <StrictMode>{children}</StrictMode>
})

export default Root
