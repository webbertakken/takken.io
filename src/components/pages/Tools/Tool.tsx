import ToolPageLayout from '@site/src/components/pages/Tools/ToolPageLayout'
import { toolNamesToComponentsMap } from '@site/src/components/pages/Tools/menu'
import Heading from '@site/src/components/markdown/components/heading'

interface Props {
  name: string
}

const Tool = ({ name, ...componentProps }: Props): JSX.Element => {
  const Component = toolNamesToComponentsMap[name]

  return (
    <ToolPageLayout wide>
      <Heading level={1}>{name}</Heading>
      <Component {...componentProps} />
    </ToolPageLayout>
  )
}

export default Tool
