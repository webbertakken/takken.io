import React from 'react'
import Logo from '@theme-original/Logo'
import type LogoType from '@theme/Logo'
import type { WrapperProps } from '@docusaurus/types'
import clsx from 'clsx'
import { useLocation } from '@docusaurus/router'

interface Props extends WrapperProps<typeof LogoType> {
  titleClassName?: string
}

export default function LogoWrapper(props: Props): JSX.Element {
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
