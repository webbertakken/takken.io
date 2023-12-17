declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.scss' {
  const source: string
  export default source
}

declare module '@theme/IdealImage' {
  import { ComponentType } from 'react'
  const IdealImage: ComponentType<{ className?: string; img: string }>
  export default IdealImage
}

declare module '@theme/ToolPage/ToolPage' {
  import { ComponentType, PropsWithChildren } from 'react'
  const ToolPage: ComponentType<PropsWithChildren<{ title?: string }>>
  export default ToolPage
}

declare module '@theme/ToolPage/ToolPageLayout' {
  import { ComponentType, PropsWithChildren } from 'react'
  const ToolPage: ComponentType<PropsWithChildren<{ title?: string }>>
  export default ToolPage
}
