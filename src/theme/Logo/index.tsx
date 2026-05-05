import { useLocation } from '@docusaurus/router'
import type { WrapperProps } from '@docusaurus/types'
import Logo from '@theme-original/Logo'
import type LogoType from '@theme/Logo'
import clsx from 'clsx'
import React from 'react'

interface Props extends WrapperProps<typeof LogoType> {
  titleClassName?: string
}

export default function LogoWrapper(props: Props): React.JSX.Element {
  const location = useLocation()

  const titleClassName = clsx(props.titleClassName, {
    ['navbar__link--active']: location.pathname === '/',
  })

  return (
    <>
      <Logo {...{ ...props, titleClassName }} />
    </>
  )
}
