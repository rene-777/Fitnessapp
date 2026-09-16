interface Props {
  label: string
  value: number | ''
  onChange: (v: number | '') => void
  step?: number
  min?: number
  suffix?: string
  compact?: boolean
}

export default function NumberInput({ label, value, onChange, step = 1, min = 0, suffix, compact }: Props) {
  const num = value === '' ? 0 : value
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 100) / 100))
  return (
    <div className="flex-1 min-w-0">
      <div className="label mb-1">{label}{suffix ? ` (${suffix})` : ''}</div>
      <div className="flex items-stretch gap-1">
        {!compact && <button type="button" className="btn-ghost px-3 py-2 text-xl" onClick={() => set(num - step)}>−</button>}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          className="input text-center px-1"
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        {!compact && <button type="button" className="btn-ghost px-3 py-2 text-xl" onClick={() => set(num + step)}>+</button>}
      </div>
    </div>
  )
}
