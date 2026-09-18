import { useEffect, useRef, useState } from 'react'
import { fmtDec, parseDecimal } from '../lib/decimal'

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

/**
 * Zahlenfeld mit ±-Knöpfen. Das Feld ist ein Textfeld mit Dezimaltastatur, weil ein
 * <input type="number"> auf Android das Komma der deutschen Tastatur verwirft (siehe lib/decimal.ts).
 * Der Text wird lokal gehalten („12,“ bleibt beim Tippen stehen), nach außen geht die geparste Zahl.
 */
export default function NumberInput({ label, value, onChange, step = 1, min = 0, max = Infinity, suffix, compact, hint, error }: Props) {
  const [draft, setDraft] = useState(() => fmtDec(value))
  const emitted = useRef<number | ''>(value)
  // Wert von außen (±-Knöpfe, Vorschlag, Zurücksetzen) übernehmen, ohne eine laufende Eingabe zu überschreiben
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value
      setDraft(fmtDec(value))
    }
  }, [value])

  const num = value === '' ? 0 : value
  const emit = (v: number | '') => {
    emitted.current = v
    onChange(v)
  }
  const set = (v: number) => {
    const next = Math.min(max, Math.max(min, Math.round(v * 100) / 100))
    setDraft(fmtDec(next))
    emit(next)
  }
  const type = (text: string) => {
    setDraft(text)
    const v = parseDecimal(text)
    emit(v === '' ? '' : Math.min(max, Math.max(min, v)))
  }
  return (
    <div className="flex-1 min-w-0">
      <div className="label mb-1">{label}{suffix ? ` (${suffix})` : ''}</div>
      <div className="flex items-stretch gap-1">
        {!compact && <button type="button" className="btn-ghost px-3 py-2 text-xl" onClick={() => set(num - step)}>−</button>}
        <input
          type="text"
          inputMode="decimal"
          className={`input text-center px-1 ${error ? '!border-bad' : ''}`}
          value={draft}
          onChange={(e) => type(e.target.value)}
          onBlur={() => setDraft(fmtDec(value))}
        />
        {!compact && <button type="button" className="btn-ghost px-3 py-2 text-xl" onClick={() => set(num + step)}>+</button>}
      </div>
      {error && <div className="text-xs text-bad mt-1 text-center" role="alert">{error}</div>}
      {hint && !error && <div className="text-[11px] text-muted mt-1 text-center">{hint}</div>}
    </div>
  )
}
