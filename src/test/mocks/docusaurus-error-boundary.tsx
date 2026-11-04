import type { ReactNode } from 'react'

/** Pass-through stand-in for the Docusaurus error boundary in tests. */
const ErrorBoundary = ({ children }: { children: ReactNode }) => <>{children}</>

export default ErrorBoundary
