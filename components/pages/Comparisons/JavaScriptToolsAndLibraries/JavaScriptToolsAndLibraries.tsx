import React from 'react'
import { Table } from 'antd'
import Heading from '@/components/markdown/components/heading'
import * as columns from './data/columns'
import * as universal from './data/universal'
// import * as situational from './data/situational'
import ShareYourSuggestions from '@/components/common/ShareYourSuggestions'
import MetaSection from '@/components/layout/components/MetaSection'

const JavaScriptToolsAndLibraries = (props) => (
  <>
    <Heading level={1}>Javascript - tools and libraries</Heading>
    <p>
      There we go, another star added to the long list of potentially useful, high-quality but hard-to-find
      repositories. How to find back the right resources when you need them?
    </p>
    <p>
      Until someone suggests a decent way to go about this, here's list for you in the category{' '}
      <strong>JavaScript</strong> with rationale about <strong>which tools and libraries to use</strong>.
    </p>
    <Heading level={3}>Universally applicable</Heading>
    <p>
      As apps grow, there'll be a universal need for things like dates, cookies, internationalization, accessibility and
      so on.
    </p>
    <Table {...columns} {...universal} />
    {/* <Heading level={3}>Situational</Heading> */}
    {/* <p> */}
    {/*   More specific tasks require specialised tools, they're not always needed but will save you a bunch of time when */}
    {/*   you do. */}
    {/* </p> */}
    {/* <Table {...columns} {...situational} /> */}
    <MetaSection position={'bottom'}>
      <ShareYourSuggestions prPath={'components/pages/Comparisons/JavaScriptToolsAndLibraries'} />
    </MetaSection>
  </>
)

export default JavaScriptToolsAndLibraries
