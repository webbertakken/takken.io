import type { ReactNode } from 'react'

interface Props {
  title?: string
  children: ReactNode
}

const ToolPage = ({ title = '', children }: Props) => (
  <div data-testid="tool-page">
    {title && <h1>{title}</h1>}
    {children}
  </div>
)

export default ToolPage
