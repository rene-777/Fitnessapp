import { useMemo } from 'react'
import type { SetLog } from '../../db/types'
import { useLiveQuery } from 'dexie-react-hooks'
import { ExerciseImages, MuscleChips } from '../ExerciseCard'
import { ex } from '../../data/exercises'
import { db } from '../../db/db'
import { prescriptionText, suggestLoad } from '../../lib/planEngine'
import { type Step } from '../../lib/steps'
import { fmtKg, fmtLb, kgToLb } from '../../lib/bioforce'

/** Zeigt den nächsten Schritt so, dass man während der Pause schon umbauen kann: Gerät, Aufstellung, Fotos. */
export default function NextPreview({ step, label, workoutId, profileId, currentExerciseId }: { step: Step; label: string; workoutId: string; profileId: string; currentExerciseId?: string }) {
  // Vorgeschlagene Last schon in der Pause zeigen, damit man das Gerät gleich einstellen kann
  const setExId = step.kind === 'set' ? step.exerciseId : undefined
  const history = useLiveQuery(() => (setExId ? db.sets.where('[profileId+exerciseId]').equals([profileId, setExId]).toArray() : Promise.resolve([] as SetLog[])), [profileId, setExId])
  const nextEx = step.kind === 'set' ? ex(step.exerciseId) : undefined
  const suggestion = useMemo(
    () => (step.kind === 'set' && !step.isTest && nextEx && history ? suggestLoad(step.p, history.filter((h) => h.workoutId !== workoutId), nextEx.loadType, nextEx.smallStep, nextEx.variants) : undefined),
    [step, nextEx, history, workoutId],
  )
  const loadKg = suggestion?.weightKg
  const loadText = nextEx && nextEx.loadType === 'bioforce' && loadKg !== undefined
    ? `${fmtLb(kgToLb(loadKg))} pro Seite`
    : nextEx && nextEx.loadType === 'extern' && loadKg !== undefined ? `${fmtKg(loadKg)} kg` : undefined
  const ids = (() => {
    switch (step.kind) {
      case 'set': return [step.exerciseId]
      case 'amrap': return step.seg.exercises.map((x) => x.exerciseId)
      case 'challenge': return step.seg.items.map((x) => x.exerciseId)
      case 'interval': case 'cardio': case 'measure': return [step.seg.exerciseId]
      case 'timed': return step.seg.items[0]?.exerciseId ? [step.seg.items[0].exerciseId] : []
      default: return []
    }
  })()
  const changed = ids.filter((id) => id !== currentExerciseId)
  const sub = step.kind === 'set' ? (step.isTest ? step.description : `${prescriptionText(step.p)}${step.p.loadHint ? ` · ${step.p.loadHint}` : ''}`) : undefined
  return (
    <div className="card space-y-3">
      <div>
        <span className="label">Als Nächstes · {label}</span>
        {ids.length > 0 && <div className="h2 leading-tight">{ids.map((id) => ex(id).name).join(' · ')}</div>}
        {sub && <div className="text-accent2 text-sm mt-0.5">{sub}</div>}
        {loadText && <div className="mt-2 rounded-lg bg-accent/10 border border-accent/50 px-3 py-2"><span className="label text-accent">Gewicht einstellen</span><div className="text-2xl font-bold">{loadText}</div></div>}
        {suggestion?.text && <div className="text-xs text-muted mt-1">{suggestion.text}</div>}
      </div>
      {changed.length === 0 && ids.length > 0 && <div className="text-sm text-muted">Gleiche Übung, kein Umbau.</div>}
      {changed.map((id) => {
        const e = ex(id)
        return (
          <div key={id} className="space-y-2 text-sm border-t border-line pt-3">
            {changed.length > 1 && <div className="font-semibold">{e.name}</div>}
            <MuscleChips e={e} />
            <div><span className="label">Umbau · Gerät</span><div>{e.equipment}</div></div>
            {e.setup && <div><span className="label">Ausgangsposition</span><div>{e.setup}</div></div>}
            <ExerciseImages e={e} small />
          </div>
        )
      })}
    </div>
  )
}
