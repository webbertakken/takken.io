import React, { StrictMode } from 'react'
import { Toaster } from 'react-hot-toast'
import FrameLayout from '@site/src/components/layout/FrameLayout'

interface RootProps {
  children: React.ReactNode
}

const Root: React.FC<RootProps> = ({ children }) => {
  return (
    <StrictMode>
      <Toaster />
      <FrameLayout>{children}</FrameLayout>
    </StrictMode>
  )
}

export default Root
