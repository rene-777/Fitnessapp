import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExerciseImages } from '../ExerciseCard'
import { ex } from '../../data/exercises'
import { prescriptionText } from '../../lib/planEngine'
import { type Step } from '../../lib/steps'

type SetStep = Extract<Step, { kind: 'set' }>

/** Zeigt während eines Satzes die andere Übung des Supersatzes, damit man den Umbau schon vorbereiten kann (Wunsch des Users, 02.11.2026). */
export default function SupersetPartners({ partners, currentExerciseId }: { partners: NonNullable<SetStep['partners']>; currentExerciseId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <span className="label">Supersatz · im Wechsel mit</span>
          {partners.map((q) => {
            const e = ex(q.exerciseId)
            return (
              <div key={q.label} className="mt-0.5">
                <Link to={`/exercises/${e.id}`} className="font-semibold">{q.label} {e.name}</Link>
                <div className="text-accent2 text-sm">{prescriptionText(q.p)}{q.p.loadHint ? ` · ${q.p.loadHint}` : ''}</div>
              </div>
            )
          })}
        </div>
        <button className="btn-ghost px-3 py-1.5 text-sm shrink-0" onClick={() => setOpen((o) => !o)}>{open ? 'Weniger' : 'Umbau'}</button>
      </div>
      {open && partners.map((q) => {
        const e = ex(q.exerciseId)
        return (
          <div key={q.label} className="space-y-2 text-sm border-t border-line pt-3">
            {partners.length > 1 && <div className="font-semibold">{q.label} {e.name}</div>}
            {e.id === currentExerciseId
              ? <div className="text-muted">Gleiche Übung, kein Umbau.</div>
              : (
                <>
                  <div><span className="label">Gerät</span><div>{e.equipment}</div></div>
                  {e.setup && <div><span className="label">Ausgangsposition</span><div>{e.setup}</div></div>}
                  <ExerciseImages e={e} small />
                </>
              )}
          </div>
        )
      })}
    </div>
  )
}
