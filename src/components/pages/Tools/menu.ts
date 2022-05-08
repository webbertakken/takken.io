import PullRequestsToReleaseText from '@site/src/components/pages/Tools/PullRequestsToReleaseText/PullRequestsToReleaseText'
import TextAnalyser from '@site/src/components/pages/Tools/TextAnalyser/TextAnalyser'
import { slugify } from '@site/src/core/utils/slugify'

export const toolNamesToComponentsMap = {
  'Release text generator': PullRequestsToReleaseText,
  'Text analyser': TextAnalyser,
}

export const toolsMenu = Object.entries(toolNamesToComponentsMap)
  .map(([name, Component]) => ({
    name,
    slug: slugify(name),
    Component,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
