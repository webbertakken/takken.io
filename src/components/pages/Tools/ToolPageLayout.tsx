import { ReactNodeLike } from 'prop-types'
import DefaultLayout from '@site/src/components/layout/DefaultLayout'

interface Props {
  children: ReactNodeLike
  wide?: boolean
}

const ToolPageLayout = ({ children, wide = false }: Props): JSX.Element => {
  return <DefaultLayout wide={wide}>{children}</DefaultLayout>
}

export default ToolPageLayout
