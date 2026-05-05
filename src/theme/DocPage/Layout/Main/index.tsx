import type { WrapperProps } from '@docusaurus/types'
import Main from '@theme-original/DocPage/Layout/Main'
import type MainType from '@theme-original/DocPage/Layout/Main'
import React from 'react'

type Props = WrapperProps<typeof MainType>

export default function MainWrapper(props: Props): React.JSX.Element {
  return (
    <>
      <div id="docContainerPadding" />

      <Main {...props} />
    </>
  )
}
