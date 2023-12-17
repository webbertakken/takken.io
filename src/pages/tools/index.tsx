import ToolPageLayout from '@theme/ToolPage/ToolPageLayout'

const tools = [
  { name: 'PullRequestsToReleaseText', slug: 'pullrequeststoreleasetext' },
  { name: 'SsiDiveLogHelper', slug: 'ssidiveloghelper' },
  { name: 'TasmotaHelper', slug: 'tasmotahelper' },
  { name: 'TextAnalyser', slug: 'textanalyser' },
]

const Tools = (): JSX.Element => {
  return (
    <ToolPageLayout title="Tools">
      <ul>
        {tools.map(({ name, slug }) => (
          <li key={slug}>
            <a href={`/tools/${slug}`}>{name}</a>
          </li>
        ))}
      </ul>
    </ToolPageLayout>
  )
}

export default Tools
