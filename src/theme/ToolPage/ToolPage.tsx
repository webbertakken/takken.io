import ToolPageLayout from '@theme/ToolPage/ToolPageLayout'
import { ReactNode } from 'react'

interface Props {
  title?: string
  children: ReactNode
}

const ToolPage = ({ title = '', children }: Props): React.JSX.Element => {
  return <ToolPageLayout title={title}>{children}</ToolPageLayout>
}

export default ToolPage
