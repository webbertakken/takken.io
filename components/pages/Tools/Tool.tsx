import ToolPageLayout from '@/components/pages/Tools/ToolPageLayout'
import { toolNamesToComponentsMap } from '@/components/pages/Tools/menu'
import Heading from '@/components/markdown/components/heading'

interface Props {
  name: string
}

const Tool = ({ name, ...componentProps }: Props): JSX.Element => {
  const Component = toolNamesToComponentsMap[name]

  return (
    <ToolPageLayout>
      <Heading level={1}>{name}</Heading>
      <Component {...componentProps} />
    </ToolPageLayout>
  )
}

export default Tool
