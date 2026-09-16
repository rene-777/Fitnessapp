import { useState } from 'react'
import { Link } from 'react-router-dom'
import { exerciseImages, type Exercise } from '../data/exercises'
import { MUSCLES } from '../data/muscles'

export function MuscleChips({ e }: { e: Exercise }) {
  return (
    <div className="flex flex-wrap gap-1">
      {e.primary.map((m) => <span key={m} className="chip-accent">{MUSCLES[m]}</span>)}
      {e.secondary.map((m) => <span key={m} className="chip">{MUSCLES[m]}</span>)}
    </div>
  )
}

export function ExerciseImages({ e, small }: { e: Exercise; small?: boolean }) {
  const img = exerciseImages(e)
  if (!img.start) return null
  const h = small ? 'h-24' : 'h-40'
  return (
    <div className="flex gap-2 items-end">
      <figure className="text-center">
        <img src={img.start} alt="Start" className={`${h} rounded-lg bg-white`} loading="lazy" />
        <figcaption className="text-[10px] text-muted mt-0.5">Start</figcaption>
      </figure>
      <figure className="text-center">
        <img src={img.end} alt="Ende" className={`${h} rounded-lg bg-white`} loading="lazy" onError={(ev) => ((ev.target as HTMLImageElement).style.display = 'none')} />
        <figcaption className="text-[10px] text-muted mt-0.5">Ende</figcaption>
      </figure>
      <figure className="text-center">
        <img src={img.pulley} alt="Rollenposition" className={`${small ? 'h-16' : 'h-28'} rounded-lg bg-white`} loading="lazy" />
        <figcaption className="text-[10px] text-muted mt-0.5">Rollen</figcaption>
      </figure>
    </div>
  )
}

export function ExerciseDescription({ e }: { e: Exercise }) {
  return (
    <div className="space-y-2 text-sm">
      <div><span className="label">Gerät</span><div>{e.equipment}</div></div>
      {e.setup && <div><span className="label">Ausgangsposition</span><div>{e.setup}</div></div>}
      <div>
        <span className="label">Ausführung</span>
        <ol className="list-decimal pl-5 space-y-0.5">{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>
      {e.tips && e.tips.length > 0 && (
        <div>
          <span className="label">Hinweise</span>
          <ul className="list-disc pl-5 space-y-0.5">{e.tips.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      {e.knee && <div className="rounded-lg bg-warn/10 border border-warn/40 p-2"><span className="label text-warn">Knie</span><div>{e.knee}</div></div>}
      {e.bioforceNo && <div className="text-xs text-muted">Bio Force Anleitung Nr. {e.bioforceNo}</div>}
    </div>
  )
}

/** Kompakte Karte mit aufklappbarer Beschreibung, für den geführten Modus. */
export default function ExerciseCard({ e, subtitle }: { e: Exercise; subtitle?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <Link to={`/exercises/${e.id}`} className="h2 leading-tight block">{e.name}</Link>
          {subtitle && <div className="text-accent2 text-sm mt-0.5">{subtitle}</div>}
        </div>
        <button className="btn-ghost px-3 py-1.5 text-sm shrink-0" onClick={() => setOpen((o) => !o)}>{open ? 'Weniger' : 'Anleitung'}</button>
      </div>
      <div className="mt-2"><MuscleChips e={e} /></div>
      {open && (
        <div className="mt-3 space-y-3">
          <ExerciseImages e={e} />
          <ExerciseDescription e={e} />
        </div>
      )}
    </div>
  )
}
