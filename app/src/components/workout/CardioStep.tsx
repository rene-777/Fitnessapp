import { useState } from 'react'
import ExerciseCard from '../ExerciseCard'
import NumberInput from '../NumberInput'
import NoteField, { cleanNote } from '../NoteField'
import Timer, { GetReady } from '../Timer'
import { ex } from '../../data/exercises'
import type { Workout as WorkoutRow } from '../../db/types'
import { beepGo, speak, unlockAudio } from '../../lib/audio'
import { storeLabel, type Step } from '../../lib/steps'
import { saveBenchmark, saveSet } from '../../lib/workouts'

/** Alternative zum Laufen (z. B. Seilspringen 45 s / Gehen 15 s) als Wechsel-Timer über die ganze Dauer. */
function AltIntervals({ minutes, workSec, restSec }: { minutes: number; workSec: number; restSec: number }) {
  const rounds = Math.ceil((minutes * 60) / (workSec + restSec))
  const [state, setState] = useState<{ round: number; mode: 'work' | 'rest' | 'done' } | 'off' | 'ready'>('off')
  if (state === 'off') return <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); setState('ready') }}>Start · {rounds} × {workSec} s Seil / {restSec} s Gehen</button>
  if (state === 'ready') return <GetReady onGo={() => { speak('Los'); setState({ round: 1, mode: 'work' }) }} />
  if (state.mode === 'done') return <div className="card text-center h2">Fertig ✓ {rounds} Runden</div>
  const { round, mode } = state
  if (mode === 'work') {
    return <Timer key={`w${round}`} seconds={workSec} allowExtend={false} label={`Runde ${round}/${rounds} · SEIL`} big={{ phase: 'work', title: 'SEIL', round: `Runde ${round}/${rounds}` }}
      onDone={() => { if (round >= rounds) { speak('Fertig'); setState({ round, mode: 'done' }) } else { speak('Gehen'); setState({ round, mode: 'rest' }) } }} />
  }
  return <Timer key={`r${round}`} seconds={restSec} allowExtend={false} label={`Gehen · danach Runde ${round + 1}`} big={{ phase: 'rest', title: 'GEHEN', round: `nächste: ${round + 1}/${rounds}` }}
    onDone={() => { beepGo(); speak('Los'); setState({ round: round + 1, mode: 'work' }) }} />
}

export default function CardioStep({ step, workout, onNext }: { step: Extract<Step, { kind: 'cardio' }>; workout: WorkoutRow; onNext: () => void }) {
  const seg = step.seg
  const e = ex(seg.exerciseId)
  const [alt, setAlt] = useState(false)
  const [minutes, setMinutes] = useState<number | ''>(seg.minutes)
  const [dist, setDist] = useState<number | ''>('')
  const [hr, setHr] = useState<number | ''>('')
  const [timer, setTimer] = useState<'off' | 'ready' | 'on'>('off')
  const [note, setNote] = useState('')
  const save = async () => {
    await saveSet(workout, {
      exerciseId: seg.exerciseId, segmentLabel: storeLabel(seg), setIndex: 1,
      seconds: minutes === '' ? undefined : Number(minutes) * 60, distanceM: dist === '' ? undefined : Number(dist), avgHr: hr === '' ? undefined : Number(hr),
      isTest: !!seg.benchmarkKey, variant: alt ? 'Alternative' : undefined, note: cleanNote(note),
    })
    if (seg.benchmarkKey) {
      const value = dist !== '' ? Number(dist) : 0
      if (value > 0) await saveBenchmark(workout, seg.benchmarkKey, value, 'm')
    }
    onNext()
  }
  return (
    <div className="space-y-3">
      <ExerciseCard e={e} subtitle={`${seg.minutes} min${seg.hrZone ? ` · HF ${seg.hrZone}` : ''}`} />
      <div className="card text-sm space-y-2">
        <div>{seg.description}</div>
        {seg.alternative && (
          <label className="flex items-center gap-2 text-muted"><input type="checkbox" checked={alt} onChange={(ev) => setAlt(ev.target.checked)} className="accent-[#ff7a1a]" /> Alternative: {seg.alternative}</label>
        )}
      </div>
      {alt && seg.altWorkSec && seg.altRestSec
        ? <AltIntervals key="alt" minutes={seg.minutes} workSec={seg.altWorkSec} restSec={seg.altRestSec} />
        : <>
          {timer === 'off' && <button className="btn-ghost w-full" onClick={() => { unlockAudio(); setTimer('ready') }}>Countdown {seg.minutes} min starten</button>}
          {timer === 'ready' && <GetReady onGo={() => setTimer('on')} />}
          {timer === 'on' && <Timer seconds={seg.minutes * 60} onDone={() => setTimer('off')} label={e.name} />}
        </>}
      <div className="card space-y-3">
        <div className="flex gap-3">
          <NumberInput label="Dauer" suffix="min" value={minutes} onChange={setMinutes} compact />
          <NumberInput label="Distanz" suffix="m" value={dist} onChange={setDist} step={100} compact />
          <NumberInput label="Ø Puls" value={hr} onChange={setHr} compact />
        </div>
        <NoteField value={note} onChange={setNote} />
        <button className="btn-primary w-full" onClick={save}>Speichern</button>
      </div>
    </div>
  )
}
