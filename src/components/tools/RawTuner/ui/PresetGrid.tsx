import type { Preset } from '../presets/types'

interface Props {
  presets: readonly Preset[]
  active: string | null
  onSelect: (preset: Preset) => void
}

const PresetGrid = ({ presets, active, onSelect }: Props): React.JSX.Element => {
  if (presets.length === 0) {
    return (
      <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
        Drop a photo to see suggested looks.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
      {presets.map((preset) => {
        const isActive = preset.name === active
        return (
          <button
            key={preset.name}
            type="button"
            aria-pressed={isActive}
            title={preset.description}
            onClick={() => onSelect(preset)}
            className={[
              'rounded-md border-2 px-3 py-2 text-left transition-colors',
              isActive
                ? 'border-pink bg-pink/10 text-pink dark:border-pink-light dark:text-pink-light'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-pink hover:text-pink dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300',
            ].join(' ')}
          >
            <div className="text-sm font-medium">{preset.name}</div>
          </button>
        )
      })}
    </div>
  )
}

export default PresetGrid
