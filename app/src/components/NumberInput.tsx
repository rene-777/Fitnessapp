interface Props {
  label: string
  value: number | ''
  onChange: (v: number | '') => void
  step?: number
  min?: number
  max?: number
  hint?: string
  error?: string // Pflichtfeld-Hinweis direkt am Feld statt alert()
  suffix?: string
  compact?: boolean
}

export default function NumberInput({ label, value, onChange, step = 1, min = 0, max = Infinity, suffix, compact, hint, error }: Props) {
  const num = value === '' ? 0 : value
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)))
  return (
    <div className="flex-1 min-w-0">
      <div className="label mb-1">{label}{suffix ? ` (${suffix})` : ''}</div>
      <div className="flex items-stretch gap-1">
        {!compact && <button type="button" className="btn-ghost px-3 py-2 text-xl" onClick={() => set(num - step)}>−</button>}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          className={`input text-center px-1 ${error ? '!border-bad' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        {!compact && <button type="button" className="btn-ghost px-3 py-2 text-xl" onClick={() => set(num + step)}>+</button>}
      </div>
      {error && <div className="text-xs text-bad mt-1 text-center" role="alert">{error}</div>}
      {hint && !error && <div className="text-[11px] text-muted mt-1 text-center">{hint}</div>}
    </div>
  )
}
