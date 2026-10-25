import CookieConsent from '@site/src/components/CookieConsent/CookieConsent'
import FrameLayout from '@site/src/components/layout/FrameLayout'
import React, { StrictMode } from 'react'
import { Toaster } from 'react-hot-toast'

interface RootProps {
  children: React.ReactNode
}

const Root: React.FC<RootProps> = ({ children }) => {
  return (
    <StrictMode>
      <Toaster />
      <FrameLayout>{children}</FrameLayout>
      <CookieConsent />
    </StrictMode>
  )
}

export default Root
