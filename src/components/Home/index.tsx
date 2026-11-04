import Layout from '@theme/Layout'
import React from 'react'
import BookSpread from './BookSpread/BookSpread'
import { chapters } from './chapters'

const Index = (): React.ReactElement => (
  <Layout
    title="About me"
    description="Webber's notes, writing, drawings and free tools, from someone still learning."
  >
    <main className="px-4 sm:px-8">
      <BookSpread portrait={require('@site/src/assets/webber.jpg')} chapters={chapters} />
    </main>
  </Layout>
)

export default Index
