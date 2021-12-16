import ToolPageLayout from '@/components/pages/Tools/ToolPageLayout'
import React from 'react'
import { toolsMenu } from '@/components/pages/Tools/menu'

interface Props {}

const ToolsMenu = ({}: Props): JSX.Element => {
  return (
    <ToolPageLayout>
      <ul>
        {toolsMenu.map(({ name, slug }) => (
          <li key={slug}>
            <a href={`/tools/${slug}`}>{name}</a>
          </li>
        ))}
      </ul>
    </ToolPageLayout>
  )
}

export default ToolsMenu
