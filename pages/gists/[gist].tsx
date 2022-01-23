import { GetStaticProps, GetStaticPaths } from 'next'
import GistPage from '@/components/pages/Gists/GistPage'
import GitHub from '@/core/services/GitHub'

// Build time: Determines which pages are generated
export const getStaticPaths: GetStaticPaths = async () => {
  const gists = await GitHub.getMyGists()

  const paths = gists.map((gist) => ({
    params: { gist: gist.id },
  }))

  return { paths, fallback: false }
}

interface StaticProps {
  params: { [key: string]: string }
}

// Build time: Generate JSON for each given path
export const getStaticProps: GetStaticProps = async ({ params }: StaticProps) => {
  const gist = await GitHub.getGist(params.gist)

  return {
    props: { gist },
    revalidate: 60, // seconds
  }
}

export default GistPage
