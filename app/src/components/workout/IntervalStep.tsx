import { useState } from 'react'
import NumberInput from '../NumberInput'
import NoteField, { cleanNote } from '../NoteField'
import Timer, { GetReady } from '../Timer'
import { ex } from '../../data/exercises'
import type { Workout as WorkoutRow } from '../../db/types'
import { beepGo, speak, unlockAudio } from '../../lib/audio'
import { storeLabel, type Step } from '../../lib/steps'
import { saveSet } from '../../lib/workouts'

export default function IntervalStep({ step, workout, onNext }: { step: Extract<Step, { kind: 'interval' }>; workout: WorkoutRow; onNext: () => void }) {
  const seg = step.seg
  const [round, setRound] = useState(0) // 0 = nicht gestartet
  const [mode, setMode] = useState<'work' | 'rest' | 'done'>('work')
  const [reps, setReps] = useState<number | ''>('')
  // Wiederholungen je Runde, eingetragen in der Pause nach der Runde (Wunsch 17.11.2026); die Summe wird zu reps
  const [roundReps, setRoundReps] = useState<(number | '')[]>(() => Array<number | ''>(seg.rounds).fill(''))
  const setRoundRep = (i: number, v: number | '') => setRoundReps((old) => old.map((x, j) => (j === i ? v : x)))
  const [note, setNote] = useState('')
  const anyRound = roundReps.some((v) => v !== '')
  const roundSum = roundReps.reduce<number>((a, v) => a + (v === '' ? 0 : v), 0)
  const e = ex(seg.exerciseId)
  const [ready, setReady] = useState(false)
  const start = () => { setReady(false); speak('Los'); setRound(1); setMode('work') }
  const onWorkDone = () => {
    if (round >= seg.rounds) { setMode('done'); speak('Fertig') }
    else { setMode('rest'); speak('Pause') }
    // Vorbelegung mit dem Wert der Vorrunde: meist stimmt er bis auf ±1, dann reichen die ±-Knöpfe
    setRoundReps((old) => (round >= 2 && old[round - 1] === '' && old[round - 2] !== '' ? old.map((x, j) => (j === round - 1 ? old[round - 2] : x)) : old))
  }
  const onRestDone = () => { beepGo(); speak('Los'); setRound((r) => r + 1); setMode('work') }
  const save = async () => {
    await saveSet(workout, { exerciseId: seg.exerciseId, segmentLabel: storeLabel(seg), setIndex: 1, rounds: seg.rounds, seconds: seg.rounds * seg.workSec,
      reps: anyRound ? roundSum : reps === '' ? undefined : Number(reps),
      roundReps: anyRound ? roundReps.map((v) => (v === '' ? 0 : v)) : undefined,
      note: cleanNote(note),
    })
    onNext()
  }
  return (
    <div className="space-y-3">
      <div className="card space-y-1">
        <div className="h2">{seg.rounds} × {seg.workSec} s {e.name} / {seg.restSec} s Pause</div>
        <div className="text-sm text-muted">{seg.description}</div>
        {seg.alternative && <div className="text-xs text-muted">Alternative: {seg.alternative}</div>}
      </div>
      {round === 0 && !ready && <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); setReady(true) }}>Start</button>}
      {ready && <GetReady onGo={start} />}
      {round > 0 && mode === 'work' && <Timer key={`w${round}`} seconds={seg.workSec} onDone={onWorkDone} label={`Runde ${round}/${seg.rounds} · ARBEIT`} allowExtend={false} big={{ phase: 'work', title: e.name.split(' (')[0].toUpperCase(), round: `Runde ${round}/${seg.rounds}` }} />}
      {round > 0 && mode === 'rest' && <Timer key={`r${round}`} seconds={seg.restSec} onDone={onRestDone} label={`Pause · danach Runde ${round + 1}`} allowExtend={false} big={{ phase: 'rest', title: 'PAUSE', round: `nächste: ${round + 1}/${seg.rounds}` }}
        extra={<NumberInput label={`Runde ${round}: Wiederholungen (optional)`} value={roundReps[round - 1]} onChange={(v) => setRoundRep(round - 1, v)} />} />}
      {mode === 'done' && (
        <div className="card space-y-3">
          <div className="h2">Intervalle fertig</div>
          <div>
            <div className="label mb-1">Wiederholungen je Runde (optional)</div>
            {anyRound && <div className="text-xs text-accent2 mb-2">Die letzte Runde hat keine Pause: R{seg.rounds} ist mit dem Wert der Vorrunde vorbelegt, bitte prüfen.</div>}
            <div className="grid grid-cols-4 gap-2">
              {roundReps.map((v, i) => <NumberInput key={i} compact label={`R${i + 1}`} value={v} onChange={(x) => setRoundRep(i, x)} />)}
            </div>
          </div>
          {anyRound
            ? <div className="text-sm">Gesamt: <span className="font-bold">{roundSum}</span> Wiederholungen</div>
            : <NumberInput label="Wiederholungen gesamt (optional)" value={reps} onChange={setReps} />}
          <NoteField value={note} onChange={setNote} />
          <button className="btn-primary w-full" onClick={save}>Speichern</button>
        </div>
      )}
    </div>
  )
}
