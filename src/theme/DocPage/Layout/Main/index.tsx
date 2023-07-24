import React from 'react'
import Main from '@theme-original/DocPage/Layout/Main'
import type MainType from '@theme/DocPage/Layout/Main'
import type { WrapperProps } from '@docusaurus/types'

type Props = WrapperProps<typeof MainType>

export default function MainWrapper(props: Props): JSX.Element {
  return (
    <>
      <div id="docContainerPadding" />

      <Main {...props} />
    </>
  )
}
