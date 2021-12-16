import { ReactNodeLike } from 'prop-types'
import DefaultLayout from '@/components/layout/DefaultLayout'

interface Props {
  children: ReactNodeLike
}

const ToolPageLayout = ({ children }: Props): JSX.Element => {
  return <DefaultLayout wide>{children}</DefaultLayout>
}

export default ToolPageLayout
