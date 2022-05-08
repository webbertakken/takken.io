import React from 'react'
import * as columns from './data/columns'
import * as universal from './data/universal'
import * as situational from './data/situational'
import Heading from "@site/src/components/markdown/components/heading";
import ShareYourSuggestions from "@site/src/components/common/ShareYourSuggestions";
import MetaSection from "@site/src/components/layout/components/MetaSection";

const JavaScriptToolsAndLibraries = () => (
  <>
    <Heading level={1}>Javascript - tools and libraries</Heading>
    <p>
      There we go, another star added to the long list of potentially useful, high-quality but hard-to-find
      repositories. How to find back the right resources when you need them?
    </p>
    <p>
      Here's list for you in the category <strong>Typescript/React application</strong> with rationale about{' '}
      <strong>which tools and libraries to use</strong>. For other UI libraries there are usually similar options
      available.
    </p>
    <Heading level={3}>Universally applicable</Heading>
    <p>
      As apps grow, there'll be a universal need for things like dates, cookies, internationalization, accessibility and
      so on.
    </p>
    {/*<Table {...columns} {...universal} />*/}
    <Heading level={3}>Situational</Heading>
    <p>
      More specific tasks require specialised tools, they're not always needed but will save you a bunch of time when
      you do.
    </p>
    {/*<Table {...columns} {...situational} />*/}
    <MetaSection position={'bottom'}>
      <ShareYourSuggestions prPath={'components/pages/Comparisons/JavaScriptToolsAndLibraries'} />
    </MetaSection>
  </>
)

export default JavaScriptToolsAndLibraries
