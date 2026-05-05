import ToolPageLayout from '@theme/ToolPage/ToolPageLayout'
import type { ComponentType } from 'react'
import {
  FaArrowRight,
  FaArrowUpRightFromSquare,
  FaCodePullRequest,
  FaDocker,
  FaListUl,
  FaMagnifyingGlass,
  FaPersonSwimming,
  FaPlug,
} from 'react-icons/fa6'

interface Tool {
  name: string
  slug: string
  description: string
  Icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  external?: boolean
}

const tools: Tool[] = [
  {
    name: 'Pull requests to release text',
    slug: 'pull-requests-to-release-text',
    description: 'Turn a list of merged pull requests into clean, categorised release notes.',
    Icon: FaCodePullRequest,
  },
  {
    name: 'Garmin to SSI dive log helper',
    slug: 'garmin-to-ssi-dive-log-helper',
    description: 'Convert a Garmin .FIT dive file into a QR code your SSI DiveLog app can scan.',
    Icon: FaPersonSwimming,
  },
  {
    name: 'Tasmota helper',
    slug: 'tasmota-helper',
    description: 'Calibrate Tasmota smart plugs against a reference power meter or multimeter.',
    Icon: FaPlug,
  },
  {
    name: 'Text analyser',
    slug: 'text-analyser',
    description: 'Paste any text and inspect its words, characters, and frequency stats.',
    Icon: FaMagnifyingGlass,
  },
  {
    name: 'Comma separator',
    slug: 'comma-separator',
    description: 'Split or join a collection of items with custom delimiters and quote characters.',
    Icon: FaListUl,
  },
  {
    name: 'Migrating node image from Bitnami',
    slug: 'migrating-node-image-from-bitnami.html',
    description:
      'Interactive guide for choosing a Node.js base image strategy in the post-Bitnami era.',
    Icon: FaDocker,
    external: true,
  },
]

const Tools = (): React.JSX.Element => {
  return (
    <ToolPageLayout title="Tools">
      <p className="mb-8 text-gray-500 dark:text-gray-400">
        Small in-browser utilities I built to scratch my own itches.
      </p>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ name, slug, description, Icon, external }) => (
          <li key={slug} className="m-0">
            <a
              href={`/tools/${slug}`}
              className="group flex h-full flex-col rounded-lg border-2 border-solid border-gray-200 p-5 no-underline transition-transform duration-200 hover:scale-[1.02] hover:border-pink hover:no-underline dark:border-gray-700 dark:hover:border-pink-light"
            >
              <div className="mb-3 flex items-center justify-between">
                <Icon aria-hidden className="h-8 w-8 text-pink dark:text-pink-light" />
                {external ? (
                  <FaArrowUpRightFromSquare
                    aria-hidden
                    className="h-4 w-4 text-gray-300 opacity-0 transition-all group-hover:opacity-100 dark:text-gray-500"
                  />
                ) : (
                  <FaArrowRight
                    aria-hidden
                    className="h-4 w-4 -translate-x-1 text-gray-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 dark:text-gray-500"
                  />
                )}
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{name}</h2>
              <p className="m-0 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </a>
          </li>
        ))}
      </ul>
    </ToolPageLayout>
  )
}

export default Tools
