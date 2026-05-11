import { defaultSliderStack, type SliderStack as Stack } from '../domain/slider-stack'

interface Props {
  value: Stack
  onChange: (next: Stack | Partial<Stack>) => void
}

interface SliderField {
  key:
    | 'exposure'
    | 'contrast'
    | 'highlights'
    | 'shadows'
    | 'whites'
    | 'blacks'
    | 'temp'
    | 'tint'
    | 'vibrance'
    | 'saturation'
  label: string
  min: number
  max: number
  step: number
}

const FIELDS: readonly SliderField[] = [
  { key: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.05 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1 },
  { key: 'whites', label: 'Whites', min: -100, max: 100, step: 1 },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1 },
  { key: 'temp', label: 'Temp', min: -100, max: 100, step: 1 },
  { key: 'tint', label: 'Tint', min: -100, max: 100, step: 1 },
  { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
]

const SliderStack = ({ value, onChange }: Props): React.JSX.Element => {
  const handle = (field: SliderField['key']) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ [field]: Number(event.target.value) } as Partial<Stack>)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Sliders
        </h3>
        <button
          type="button"
          onClick={() => onChange(defaultSliderStack())}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 transition-colors hover:border-pink hover:text-pink dark:border-gray-700 dark:text-gray-300"
        >
          Reset
        </button>
      </div>
      <div className="space-y-2">
        {FIELDS.map(({ key, label, min, max, step }) => (
          <label
            key={key}
            className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200"
          >
            <span className="w-24 shrink-0">{label}</span>
            <input
              type="range"
              aria-label={label}
              min={min}
              max={max}
              step={step}
              value={value[key]}
              onChange={handle(key)}
              className="flex-1 accent-pink dark:accent-pink-light"
            />
            <span className="w-12 shrink-0 text-right tabular-nums text-gray-500 dark:text-gray-400">
              {value[key].toFixed(step < 1 ? 2 : 0)}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default SliderStack
