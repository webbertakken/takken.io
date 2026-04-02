import React, { StrictMode } from 'react'
import { Toaster } from 'react-hot-toast'
import FrameLayout from '@site/src/components/layout/FrameLayout'
import { AuthProvider } from '@site/src/contexts/AuthContext'
import CookieConsent from '@site/src/components/CookieConsent/CookieConsent'

interface RootProps {
  children: React.ReactNode
}

const Root: React.FC<RootProps> = ({ children }) => {
  return (
    <StrictMode>
      <AuthProvider>
        <Toaster />
        <FrameLayout>{children}</FrameLayout>
        <CookieConsent />
      </AuthProvider>
    </StrictMode>
  )
}

export default Root
