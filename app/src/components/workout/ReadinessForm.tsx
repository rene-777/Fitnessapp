import { useState } from 'react'
import type { Readiness } from '../../db/types'

export default function ReadinessForm({ onDone }: { onDone: (r: Readiness) => void }) {
  const [r, setR] = useState<Readiness>({ sleepH: 7, soreness: 2, knee: 0, mood: 4 })
  const Row = ({ label, k, min, max, step = 1 }: { label: string; k: keyof Readiness; min: number; max: number; step?: number }) => (
    <div>
      <div className="flex justify-between"><span>{label}</span><span className="font-semibold">{r[k]}</span></div>
      <input type="range" min={min} max={max} step={step} value={r[k] ?? 0} onChange={(e) => setR({ ...r, [k]: Number(e.target.value) })} className="w-full accent-[#ff7a1a]" />
    </div>
  )
  return (
    <div className="space-y-4 pt-4">
      <h1 className="h1">Kurz-Check</h1>
      <div className="card space-y-4">
        <Row label="Schlaf (Stunden)" k="sleepH" min={3} max={10} step={0.5} />
        <Row label="Muskelkater (0–10)" k="soreness" min={0} max={10} />
        <Row label="Knie (0 = ruhig, 10 = stark)" k="knee" min={0} max={10} />
        <Row label="Motivation (1–5)" k="mood" min={1} max={5} />
        {(r.knee ?? 0) >= 4 && <div className="rounded-lg bg-warn/10 border border-warn/40 p-2 text-sm">Knie ≥ 4: Beinvolumen heute halbieren (nur A- und B-Übungen), keine Sprünge, kein Seil.</div>}
      </div>
      <button className="btn-primary w-full" onClick={() => onDone(r)}>Los geht's</button>
      <button className="btn-ghost w-full" onClick={() => onDone({})}>Überspringen</button>
    </div>
  )
}
