// @ts-ignore
import ToolPageLayout from '@theme/ToolPage/ToolPageLayout'
import { ReactNodeLike } from 'prop-types'

interface Props {
  title?: string
  children: ReactNodeLike
}

const ToolPage = ({ title = '', children }: Props): JSX.Element => {
  return <ToolPageLayout title={title}>{children}</ToolPageLayout>
}

export default ToolPage
