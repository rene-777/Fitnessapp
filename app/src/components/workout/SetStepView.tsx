import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import ExerciseCard from '../ExerciseCard'
import NumberInput from '../NumberInput'
import NoteField, { cleanNote } from '../NoteField'
import Timer, { GetReady, Stopwatch } from '../Timer'
import { ex } from '../../data/exercises'
import { db } from '../../db/db'
import type { Workout as WorkoutRow } from '../../db/types'
import { unlockAudio } from '../../lib/audio'
import { prescriptionText, suggestLoad } from '../../lib/planEngine'
import { type Step } from '../../lib/steps'
import { ACCUMULATOR_EXERCISE_ID, ACCUMULATOR_MAX, ACCUMULATOR_MIN, accumulatorBurpees } from '../../data/accumulator'
import { saveBenchmark, saveSet } from '../../lib/workouts'
import { BF_MAX_LB, BF_MIN_LB, BF_SCALE_HINT, bfStepAt, fmtKg, kgToLb, lbToKg } from '../../lib/bioforce'
import SupersetPartners from './SupersetPartners'

type SetStep = Extract<Step, { kind: 'set' }>

export default function SetStepView({ step, workout, onSaved, onSkip }: { step: SetStep; workout: WorkoutRow; onSaved: (restSec: number, setId?: string) => void; onSkip: () => void }) {
  const e = ex(step.exerciseId)
  const history = useLiveQuery(() => db.sets.where('[profileId+exerciseId]').equals([workout.profileId, step.exerciseId]).toArray(), [workout.profileId, step.exerciseId])
  const existing = useLiveQuery(
    () => db.sets.where('workoutId').equals(workout.id).toArray().then((rows) => rows.filter((r) => r.exerciseId === step.exerciseId && r.segmentLabel === step.segKey && r.setIndex === step.setIndex && !r.deleted)),
    [workout.id, step.exerciseId, step.segKey, step.setIndex],
  )
  const suggestion = useMemo(() => (history ? suggestLoad(step.p, history.filter((h) => h.workoutId !== workout.id), e.loadType, e.smallStep, e.variants) : undefined), [history, step.p, e.loadType, e.smallStep, e.variants, workout.id])
  // Variante innerhalb der Einheit: der vorige Satz derselben Übung gibt die Vorbelegung vor
  const prevInWorkout = useLiveQuery(
    () => db.sets.where('workoutId').equals(workout.id).toArray().then((rows) => rows.filter((r) => r.exerciseId === step.exerciseId && !r.deleted && (r.segmentLabel !== step.segKey || r.setIndex < step.setIndex)).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0] ?? null), // null = keiner (undefined hieße: lädt noch)
    [workout.id, step.exerciseId, step.segKey, step.setIndex],
  )
  const timed = step.p.seconds !== undefined || step.testUnit === 'seconds'
  // Bio Force: das Eingabefeld zeigt den Skalenwert in lb, gespeichert wird kg pro Seite
  const isBf = e.loadType === 'bioforce'
  const toInput = (kg: number) => (isBf ? kgToLb(kg) : kg)
  const [reps, setReps] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [rir, setRir] = useState<number | ''>('')
  const [seconds, setSeconds] = useState<number | ''>('')
  const [init, setInit] = useState(false)
  const [holdTimer, setHoldTimer] = useState<'off' | 'ready' | 'on'>('off')
  // Haltezeit vor dem Start wählbar: Planwert, 60/90/120 s oder offen bis Stopp (Wunsch 19.10.2026, damit Planks nicht am Countdown enden)
  const [holdTarget, setHoldTarget] = useState<number | 'offen'>(step.p.seconds ?? 'offen')
  const holdOptions = useMemo(() => [...new Set([step.p.seconds, 60, 90, 120].filter((n): n is number => !!n))].sort((a, b) => a - b), [step.p.seconds])
  const onHoldTick = useCallback((s: number) => setSeconds(Math.round(s)), [])
  const [missing, setMissing] = useState(false)
  const [noLoad, setNoLoad] = useState(false) // Bio Force ohne Skalenwert: erst Hinweis, zweiter Tipp speichert
  const [variant, setVariant] = useState<string>('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (init || existing === undefined || suggestion === undefined || prevInWorkout === undefined) return
    const ex0 = existing[0]
    if (ex0) {
      setReps(ex0.reps ?? ''); setWeight(ex0.weightKg === undefined ? '' : toInput(ex0.weightKg)); setRir(ex0.rir ?? ''); setSeconds(ex0.seconds ?? '')
      if (e.variants) setVariant(ex0.variant ?? e.variants[0])
      setNote(ex0.note ?? '')
    } else {
      setReps(step.p.repsMax ?? step.p.repsMin ?? '')
      setSeconds(step.p.seconds ?? '')
      if (suggestion.weightKg !== undefined) setWeight(toInput(suggestion.weightKg))
      // Variante: erst der vorige Satz dieser Einheit, dann die letzte Ausführung, sonst Standard
      if (e.variants) setVariant(prevInWorkout ? (prevInWorkout.variant ?? e.variants[0]) : (suggestion.variant ?? e.variants[0]))
    }
    setInit(true)
  }, [existing, suggestion, prevInWorkout, init, step.p, e.variants])

  const showWeight = e.loadType === 'bioforce' || e.loadType === 'extern'
  const showRir = !step.isTest && e.loadType !== 'none'
  // Accumulator: eingetragen wird die letzte angesagte Zahl, die Burpees kommen aus der Tabelle
  const isAccumulator = step.exerciseId === ACCUMULATOR_EXERCISE_ID
  const accBurpees = isAccumulator && reps !== '' ? accumulatorBurpees(Number(reps)) : undefined

  const save = async () => {
    const value = timed ? seconds : reps
    if (value === '' || value === 0 || (isAccumulator && accBurpees === undefined)) { setMissing(true); return }
    if (isBf && weight === '' && !noLoad) { setNoLoad(true); return }
    setMissing(false)
    const row = await saveSet(workout, {
      exerciseId: step.exerciseId, segmentLabel: step.segKey, setIndex: step.setIndex,
      reps: timed ? undefined : Number(reps), seconds: timed ? Number(seconds) : undefined,
      weightKg: showWeight && weight !== '' ? (isBf ? lbToKg(Number(weight)) : Number(weight)) : undefined,
      rir: showRir && rir !== '' ? Number(rir) : undefined,
      isTest: step.isTest,
      variant: e.variants && variant && variant !== e.variants[0] ? variant : undefined,
      note: cleanNote(note),
    })
    if (step.isTest && step.benchmarkKey) await saveBenchmark(workout, step.benchmarkKey, Number(value), step.testUnit ?? 'reps')
    onSaved(step.restSec, row.id)
  }

  const sub = step.isTest ? step.description : `${prescriptionText(step.p)}${step.p.loadHint ? ` · ${step.p.loadHint}` : ''}${step.p.note ? ` · ${step.p.note}` : ''}`

  return (
    <div className="space-y-3">
      <ExerciseCard e={e} subtitle={sub} />
      {step.partners && step.partners.length > 0 && <SupersetPartners partners={step.partners} currentExerciseId={step.exerciseId} />}
      {step.p.ramp && <div className="card text-sm"><span className="label">Einstufung</span><div>Aufsteigende Sätze: Satz 1 leicht, dann schwerer, im letzten Satz die vermutete {step.p.repsMax ?? 10}RM-Last. Die schwerste saubere Last ist dein {step.p.repsMax ?? 10}RM.</div></div>}
      {suggestion?.text && <div className="card text-sm"><span className="label">Vorschlag</span><div>{suggestion.text}</div></div>}
      <div className="card space-y-3">
        {timed && (
          <>
            {holdTimer === 'off' && step.p.seconds && (
              <div className="space-y-2">
                <div className="label">Haltezeit</div>
                <div className="flex flex-wrap gap-1">
                  {holdOptions.map((n) => (
                    <button key={n} type="button" className={`rounded-full px-3 py-1.5 text-sm border ${holdTarget === n ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => { setHoldTarget(n); setSeconds(n); setMissing(false) }}>{n} s{n === step.p.seconds ? ' · Plan' : ''}</button>
                  ))}
                  <button type="button" className={`rounded-full px-3 py-1.5 text-sm border ${holdTarget === 'offen' ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => setHoldTarget('offen')}>Offen bis Stopp</button>
                </div>
                <button className="btn-ghost w-full" onClick={() => { unlockAudio(); setHoldTimer('ready') }}>Halte-Timer starten · {holdTarget === 'offen' ? 'offen' : `${holdTarget} s`}</button>
              </div>
            )}
            {holdTimer === 'ready' && <GetReady onGo={() => setHoldTimer('on')} />}
            {holdTimer === 'on' && holdTarget !== 'offen' && <Timer seconds={holdTarget} onDone={() => { setSeconds(holdTarget); setHoldTimer('off') }} label="Halten" size="md" allowExtend={false} />}
            {holdTimer === 'on' && holdTarget === 'offen' && <Stopwatch autoStart onChange={onHoldTick} />}
            {step.isTest && <Stopwatch leadIn onChange={(s) => setSeconds(Math.round(s))} />}
            <NumberInput label="Sekunden" value={seconds} onChange={(v) => { setSeconds(v); setMissing(false) }} step={5} error={missing ? 'Bitte die Sekunden eintragen.' : undefined} />
          </>
        )}
        {e.variants && !step.isTest && (
          <div>
            <div className="label mb-1">Variante{suggestion?.nextVariant && variant !== suggestion.nextVariant ? <span className="text-accent normal-case tracking-normal"> · nächste Stufe: {suggestion.nextVariant}</span> : ''}</div>
            <div className="flex flex-wrap gap-1">
              {e.variants.map((v) => (
                <button key={v} type="button" className={`rounded-full px-3 py-1.5 text-sm border ${variant === v ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => setVariant(v)}>{v}</button>
              ))}
            </div>
          </div>
        )}
        {!timed && <NumberInput label={e.repsLabel ?? (step.p.perSide ? 'Wiederholungen je Seite' : 'Wiederholungen')} value={reps} onChange={(v) => { setReps(v); setMissing(false) }} error={missing ? (isAccumulator ? `Bitte die letzte angesagte Zahl eintragen (${ACCUMULATOR_MIN}–${ACCUMULATOR_MAX}).` : 'Bitte die Wiederholungen eintragen.') : undefined} hint={isAccumulator ? (accBurpees !== undefined ? `Zahl ${reps} = ${accBurpees} Burpees, wird mitgespeichert` : `Ansagen laufen von ${ACCUMULATOR_MIN} bis ${ACCUMULATOR_MAX}`) : undefined} />}
        <div className="space-y-3">
          {showWeight && (isBf
            ? <NumberInput label="Skala (lb) pro Seite" value={weight} onChange={(v) => { setWeight(v); setNoLoad(false) }} step={bfStepAt} min={BF_MIN_LB} max={BF_MAX_LB} hint={weight === '' ? BF_SCALE_HINT : `≈ ${fmtKg(lbToKg(Number(weight)))} kg pro Seite`} error={noLoad ? 'Kein Skalenwert eingetragen. Nochmal tippen, um ohne Last zu speichern.' : undefined} />
            : <NumberInput label="kg" value={weight} onChange={setWeight} step={1} />)}
          {showRir && (
            <div className="flex-1">
              <div className="label mb-1">RIR · wie viele wären noch gegangen?</div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((v) => (
                  <button key={v} type="button" className={`flex-1 rounded-lg py-3 border ${rir === v ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => setRir(v)}>{v === 4 ? '4+' : v}</button>
                ))}
              </div>
              {isBf && !step.p.hold && rir !== '' && rir >= 3 && step.setIndex < step.totalSets && (
                <div className="text-xs text-accent2 mt-1">Zu leicht: nächsten Satz {rir >= 4 ? '10 lb (vier Rasten)' : '5 lb (zwei Rasten)'} mehr, die Wiederholungszahl bleibt das Ziel.</div>
              )}
            </div>
          )}
        </div>
        <NoteField value={note} onChange={setNote} />
        <button className="btn-primary w-full" onClick={save}>{noLoad ? 'Ohne Last speichern' : 'Satz speichern'}{step.restSec > 0 ? ` · Pause ${step.restSec} s` : ''}</button>
        <button className="btn-ghost w-full text-sm" onClick={onSkip}>Satz auslassen</button>
      </div>
    </div>
  )
}
