import { useMemo, useRef, useState } from 'react'
import type { Cal } from '../../lib/dates'
import { useLiveQuery } from 'dexie-react-hooks'
import NoteField, { cleanNote } from '../NoteField'
import { GetReady, Stopwatch } from '../Timer'
import { db } from '../../db/db'
import type { Workout as WorkoutRow } from '../../db/types'
import { unlockAudio } from '../../lib/audio'
import { fmtSec, mondayOfWeek, addDays } from '../../lib/dates'
import { challengeStatus } from '../../lib/planEngine'
import { type Step } from '../../lib/steps'
import { FREE_SEGMENT_LABEL, saveSet } from '../../lib/workouts'

export default function ChallengeStep({ step, workout, profileStart, onNext }: { step: Extract<Step, { kind: 'challenge' }>; workout: WorkoutRow; profileStart: Cal; onNext: () => void }) {
  const seg = step.seg
  const monday = mondayOfWeek(profileStart, workout.week)
  const sunday = addDays(monday, 6)
  const benchmarks = useLiveQuery(() => db.benchmarks.where('profileId').equals(workout.profileId).toArray(), [workout.profileId])
  const weekSets = useLiveQuery(
    () => db.sets.where('profileId').equals(workout.profileId).toArray().then((rows) => rows.filter((s) => s.date >= monday && s.date <= sunday && s.workoutId !== workout.id && (s.segmentLabel === 'challenge' || s.segmentLabel === FREE_SEGMENT_LABEL || s.segmentLabel.endsWith('-sum') || s.isTest))), // freies Training zählt mit (Training gesplittet, Wunsch 11.10.2026)
    [workout.profileId, monday, sunday, workout.id],
  )
  const status = useMemo(() => (benchmarks && weekSets ? challengeStatus(benchmarks, weekSets, seg.items[0]?.share ?? 0.2) : []), [benchmarks, weekSets, seg.items])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [started, setStarted] = useState<'no' | 'ready' | 'yes'>('no')
  const elapsed = useRef(0)
  const [note, setNote] = useState('')
  // Zeiten der bisherigen Challenge-Blöcke dieser Woche (nur zur Info, keine Wertung)
  const earlier = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const s of weekSets ?? []) if (s.segmentLabel === 'challenge' && s.seconds) byDay.set(s.date, Math.max(byDay.get(s.date) ?? 0, s.seconds))
    return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
  }, [weekSets])
  const save = async () => {
    let pending = cleanNote(note) // die Bemerkung hängt am ersten gespeicherten Satz des Blocks
    for (const st of status) {
      const c = counts[st.exerciseId] ?? 0
      if (c > 0) {
        await saveSet(workout, { exerciseId: st.exerciseId, segmentLabel: 'challenge', setIndex: 1, reps: c, seconds: elapsed.current > 0 ? Math.round(elapsed.current) : undefined, note: pending })
        pending = undefined
      }
    }
    onNext()
  }
  return (
    <div className="space-y-3">
      <div className="card text-sm"><div className="h2">{seg.label}</div><div className="text-muted">{seg.description}</div></div>
      {started === 'no' && <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); setStarted('ready') }}>Start (Zeit läuft nach 3-2-1)</button>}
      {started === 'ready' && <GetReady onGo={() => setStarted('yes')} />}
      {started === 'yes' && <Stopwatch autoStart onChange={(t) => { elapsed.current = t }} />}
      {earlier.length > 0 && <div className="text-xs text-muted px-1">Bisher diese Woche: {earlier.map(([d, sec]) => `${new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short' })} ${fmtSec(sec)}`).join(' · ')}</div>}
      {status.map((st) => {
        const c = counts[st.exerciseId] ?? 0
        const pct = st.todayTarget > 0 ? Math.min(100, (c / st.todayTarget) * 100) : 0
        return (
          <div key={st.exerciseId} className="card space-y-2">
            <div className="flex justify-between items-baseline">
              <div className="font-semibold">{st.label}</div>
              <div className="text-sm text-muted">Woche: {st.done + c}/{st.weekTarget}</div>
            </div>
            <div className="flex items-baseline gap-2"><span className="text-4xl font-bold tabular-nums">{c}</span><span className="text-muted">/ {st.todayTarget} heute</span></div>
            <div className="h-1.5 rounded bg-card2 overflow-hidden"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
            <div className="flex gap-2">
              {[5, 10, 25].map((n) => <button key={n} className="btn-ghost flex-1" onClick={() => setCounts({ ...counts, [st.exerciseId]: c + n })}>+{n}</button>)}
              <button className="btn-ghost" onClick={() => setCounts({ ...counts, [st.exerciseId]: Math.max(0, c - 5) })}>−5</button>
            </div>
          </div>
        )
      })}
      <div className="card"><NoteField value={note} onChange={setNote} /></div>
      <button className="btn-primary w-full" onClick={save}>Challenge-Block speichern</button>
    </div>
  )
}
