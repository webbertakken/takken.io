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

declare module '@theme/BlogPostItem/Header/Title' {
  import { ComponentType, PropsWithChildren } from 'react'
  const BlogPostItemHeaderTitle: ComponentType<PropsWithChildren<{ className?: string }>>
  export default BlogPostItemHeaderTitle
}

declare module '@theme/MDXComponents/Heading' {
  import { ComponentType, PropsWithChildren } from 'react'
  interface HeadingProps {
    as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    id?: string
    children?: React.ReactNode
    className?: string
  }

  const Heading: ComponentType<PropsWithChildren<HeadingProps>>
  export default Heading
}
