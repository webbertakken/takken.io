import { GetStaticProps } from 'next'
import GistsPage from '@site/src/components/pages/Gists/GistsPage'
import GitHub from '@site/src/core/services/GitHub'

interface StaticProps {
  params: { [key: string]: string[] }
}

// Build time: Generate JSON for each given path
export const getStaticProps: GetStaticProps = async ({}: StaticProps) => {
  const gists = await GitHub.getMyGists()

  return {
    props: { gists },
    revalidate: 60, // seconds
  }
}

export default GistsPage
