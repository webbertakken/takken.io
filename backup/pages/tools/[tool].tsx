import { GetStaticPaths, GetStaticProps } from 'next'
import { toolsMenu } from '@site/src/components/pages/Tools/menu'
import Tool from '@site/src/components/pages/Tools/Tool'

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = toolsMenu.map(({ slug: tool }) => ({ params: { tool } }))

  return { paths, fallback: false }
}

interface StaticProps {
  params: { [key: string]: string }
}

export const getStaticProps: GetStaticProps = async ({ params }: StaticProps) => {
  const { tool: slug } = params

  const { name } = toolsMenu.find((member) => member.slug === slug)

  return { props: { name } }
}

export default Tool
