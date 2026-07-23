import type { ReactNode } from 'react'

interface Props {
  title?: string
  children: ReactNode
}

/** Stand-in for the Docusaurus-backed ToolPage in tests (no @theme/Layout). */
const ToolPage = ({ title = '', children }: Props) => (
  <div data-testid="tool-page">
    {title && <h1>{title}</h1>}
    {children}
  </div>
)

export default ToolPage
