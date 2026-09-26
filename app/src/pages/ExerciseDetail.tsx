import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ExerciseDescription, ExerciseImages, MuscleChips } from '../components/ExerciseCard'
import { EXERCISE_MAP } from '../data/exercises'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { fmtDate } from '../lib/dates'
import { fmtLb, kgToLb, loadText } from '../lib/bioforce'
import { epley1RM } from '../lib/planEngine'
import { FREE_SEGMENT_LABEL, deleteSet } from '../lib/workouts'

export default function ExerciseDetail() {
  const { id = '' } = useParams()
  const e = EXERCISE_MAP[id]
  const profile = useProfile()
  const sets = useLiveQuery(
    () => (profile ? db.sets.where('[profileId+exerciseId]').equals([profile.id, id]).toArray() : []),
    [profile?.id, id],
  )
  if (!e) return <div className="text-muted">Übung nicht gefunden.</div>
  const alive = (sets ?? []).filter((s) => !s.deleted).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.setIndex - b.setIndex))
  const byDate = new Map<string, typeof alive>()
  for (const s of alive) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s])
  const maxReps = Math.max(0, ...alive.map((s) => s.reps ?? 0))
  const maxW = Math.max(0, ...alive.map((s) => s.weightKg ?? 0))
  const best1RM = Math.max(0, ...alive.filter((s) => s.weightKg && s.reps).map((s) => epley1RM(s.weightKg!, s.reps!)))
  const maxSec = Math.max(0, ...alive.map((s) => s.seconds ?? 0))

  return (
    <div className="space-y-4">
      <Link to="/exercises" className="text-muted text-sm">‹ Übungen</Link>
      <header>
        <h1 className="h1">{e.name}</h1>
        <div className="mt-2"><MuscleChips e={e} /></div>
      </header>
      <div className="card space-y-3">
        <ExerciseImages e={e} />
        <ExerciseDescription e={e} />
      </div>
      <Link to={`/free/${e.id}`} className="btn-ghost block text-center">Freies Training mit dieser Übung</Link>
      {alive.length > 0 && (
        <div className="card">
          <div className="h2 mb-2">Bestwerte</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {maxReps > 0 && <div><div className="text-2xl font-bold">{maxReps}</div><div className="label">Wdh. max</div></div>}
            {maxW > 0 && <div><div className="text-2xl font-bold">{e.loadType === 'bioforce' ? fmtLb(kgToLb(maxW)) : maxW}</div><div className="label">{e.loadType === 'bioforce' ? 'lb max' : 'kg max'}</div></div>}
            {best1RM > 0 && <div><div className="text-2xl font-bold">{best1RM}</div><div className="label">e1RM kg</div></div>}
            {maxSec > 0 && <div><div className="text-2xl font-bold">{maxSec}</div><div className="label">s max</div></div>}
          </div>
        </div>
      )}
      <div className="card">
        <div className="h2 mb-2">Verlauf</div>
        {byDate.size === 0 && <div className="text-muted text-sm">Noch keine Einträge.</div>}
        <div className="divide-y divide-line">
          {[...byDate.entries()].slice(0, 20).map(([date, rows]) => (
            <div key={date} className="py-2 flex justify-between gap-2 text-sm">
              <div className="text-muted w-20 shrink-0">{fmtDate(date)}</div>
              <div className="flex-1 text-right">
                {rows.map((s) => {
                  const parts: string[] = []
                  if (s.reps !== undefined) parts.push(`${s.reps}`)
                  if (s.seconds !== undefined && s.reps === undefined) parts.push(`${s.seconds} s`)
                  if (s.rounds !== undefined) parts.push(`${s.rounds} Rd`)
                  if (s.distanceM !== undefined) parts.push(`${s.distanceM} m`)
                  if (s.weightKg !== undefined) parts.push(`@ ${e.loadType === 'bioforce' ? `${fmtLb(kgToLb(s.weightKg))} lb` : loadText(s.weightKg, e.loadType)}`)
                  if (s.rir !== undefined) parts.push(`RIR ${s.rir}`)
                  if (s.variant) parts.push(`· ${s.variant}`)
                  const free = s.segmentLabel === FREE_SEGMENT_LABEL
                  return (
                    <span key={s.id} className="inline-block ml-2">
                      {parts.join(' ')}{s.isTest ? ' (Test)' : ''}{s.side ? ` ${s.side}` : ''}
                      {free && <button type="button" className="ml-1 text-bad text-xs" title="Freien Eintrag löschen" onClick={() => { if (confirm('Diesen Eintrag löschen?')) void deleteSet(s.id) }}>✕</button>}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
