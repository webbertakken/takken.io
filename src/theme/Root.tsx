import React, { StrictMode } from 'react'
import { Toaster } from 'react-hot-toast'

interface RootProps {
  children: React.ReactNode
}

const Root: React.FC<RootProps> = ({ children }) => {
  return (
    <StrictMode>
      <Toaster />
      {children}
    </StrictMode>
  )
}

export default Root
