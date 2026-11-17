import { useState } from 'react'
import NoteField, { cleanNote } from '../NoteField'
import Timer, { GetReady } from '../Timer'
import { ex } from '../../data/exercises'
import type { Workout as WorkoutRow } from '../../db/types'
import { unlockAudio } from '../../lib/audio'
import { storeLabel, type Step } from '../../lib/steps'
import { saveBenchmark, saveSet } from '../../lib/workouts'

export default function AmrapStep({ step, workout, onNext }: { step: Extract<Step, { kind: 'amrap' }>; workout: WorkoutRow; onNext: () => void }) {
  const seg = step.seg
  const [ready, setReady] = useState(false)
  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [note, setNote] = useState('')
  const single = seg.exercises.length === 1 && seg.exercises[0].reps === 1
  const save = async () => {
    const exId = single ? seg.exercises[0].exerciseId : seg.exercises[0].exerciseId
    await saveSet(workout, {
      exerciseId: exId, segmentLabel: storeLabel(seg), setIndex: 1,
      reps: single ? count : undefined, rounds: single ? undefined : count, seconds: seg.minutes * 60, isTest: !!seg.benchmarkKey,
      note: cleanNote(note),
    })
    if (!single) {
      // Wiederholungen der einzelnen Übungen mitzählen (für Wochen-Summen)
      for (const x of seg.exercises) {
        await saveSet(workout, { exerciseId: x.exerciseId, segmentLabel: `${storeLabel(seg)}-sum`, setIndex: 1, reps: x.reps * count })
      }
    }
    if (seg.benchmarkKey) await saveBenchmark(workout, seg.benchmarkKey, count, single ? 'reps' : 'rounds')
    onNext()
  }
  return (
    <div className="space-y-3">
      <div className="card space-y-2">
        <div className="h2">{seg.label}: {seg.minutes} Minuten</div>
        {seg.description && <div className="text-sm text-muted">{seg.description}</div>}
        <ul className="text-sm">{seg.exercises.map((x, i) => <li key={i}>{x.reps > 1 ? `${x.reps} × ` : ''}{ex(x.exerciseId).name}</li>)}</ul>
      </div>
      {!ready && !running && !finished && <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); setReady(true) }}>Start</button>}
      {ready && <GetReady onGo={() => { setReady(false); setRunning(true) }} />}
      {running && <Timer seconds={seg.minutes * 60} onDone={() => { setRunning(false); setFinished(true) }} label={seg.countLabel} allowExtend={false} />}
      {(running || finished) && (
        <div className="card text-center space-y-3">
          <div className="label">{seg.countLabel}</div>
          <div className="text-6xl font-bold tabular-nums">{count}</div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setCount((c) => Math.max(0, c - 1))}>−1</button>
            <button className="btn-primary flex-1 text-2xl py-5" onClick={() => setCount((c) => c + 1)}>+1</button>
            {single && <button className="btn-ghost" onClick={() => setCount((c) => c + 5)}>+5</button>}
          </div>
        </div>
      )}
      {finished && <div className="card"><NoteField value={note} onChange={setNote} /></div>}
      {finished && <button className="btn-primary w-full" onClick={save}>Ergebnis speichern</button>}
      {running && <button className="btn-ghost w-full text-sm" onClick={() => { setRunning(false); setFinished(true) }}>Vorzeitig beenden</button>}
    </div>
  )
}
