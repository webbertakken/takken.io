import ToolPageLayout from '@theme/ToolPage/ToolPageLayout'

const tools = [
  { name: 'Pull requests to release text', slug: 'pull-requests-to-release-text' },
  { name: 'Garmin to SSI dive log helper', slug: 'garmin-to-ssi-dive-log-helper' },
  { name: 'Tasmota helper', slug: 'tasmota-helper' },
  { name: 'Text analyser', slug: 'text-analyser' },
  { name: 'Comma separator', slug: 'comma-separator' },
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
