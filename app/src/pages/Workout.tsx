import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import ExerciseCard from '../components/ExerciseCard'
import NumberInput from '../components/NumberInput'
import Timer, { Stopwatch } from '../components/Timer'
import { ex } from '../data/exercises'
import { findSession } from '../data/plan'
import { db } from '../db/db'
import type { Readiness, Workout as WorkoutRow } from '../db/types'
import { useProfile } from '../hooks/useProfile'
import { beepGo, speak, unlockAudio } from '../lib/audio'
import { fmtSec, mondayOfWeek, addDays } from '../lib/dates'
import { challengeStatus, prescriptionText, suggestLoad } from '../lib/planEngine'
import { buildSteps, type Step } from '../lib/steps'
import { keepAwake } from '../lib/wakeLock'
import { finishWorkout, getOrCreateWorkout, patchWorkout, saveBenchmark, saveSet } from '../lib/workouts'
import { BF_MAX_LB, BF_MIN_LB, BF_STEP_LB, fmtKg, kgToLb, lbToKg } from '../lib/bioforce'

type SetStep = Extract<Step, { kind: 'set' }>

export default function Workout() {
  const { date = '', sessionKey = '' } = useParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const found = useMemo(() => findSession(sessionKey), [sessionKey])
  const steps = useMemo(() => (found ? buildSteps(found.session) : []), [found])
  const profileId = profile?.id
  const [workout, setWorkout] = useState<WorkoutRow | null>(null)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'work' | 'rest' | 'done'>('work')
  const [restSec, setRestSec] = useState(0)
  const [askReadiness, setAskReadiness] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!profileId || !found) return
    let cancelled = false
    getOrCreateWorkout(profileId, date, found.week.number, found.session).then((w) => {
      if (cancelled) return
      setWorkout(w)
      const start = w.stepIndex ?? 0
      if (w.status === 'fertig') { setIdx(0); setPhase('work') }
      else { setIdx(Math.min(start, steps.length - 1)); setPhase('work') }
      setAskReadiness(w.status !== 'fertig' && !w.readiness)
    })
    return () => { cancelled = true }
  }, [profileId, found, date, steps.length])

  useEffect(() => {
    keepAwake(true)
    return () => keepAwake(false)
  }, [])

  useEffect(() => {
    if (!workout?.startedAt) return
    const t0 = new Date(workout.startedAt).getTime()
    const id = setInterval(() => setElapsed((Date.now() - t0) / 1000), 1000)
    return () => clearInterval(id)
  }, [workout?.startedAt])

  const goTo = useCallback(async (i: number) => {
    if (!workout) return
    if (i >= steps.length) {
      await finishWorkout(workout.id)
      setPhase('done')
      return
    }
    setIdx(i)
    setPhase('work')
    await patchWorkout(workout.id, { stepIndex: i })
  }, [workout, steps.length])

  const next = useCallback(() => void goTo(idx + 1), [goTo, idx])

  const afterSet = (rest: number) => {
    const isLast = idx + 1 >= steps.length
    if (rest > 0 && !isLast) {
      setRestSec(rest)
      setPhase('rest')
      speak('Pause')
    } else next()
  }

  if (!profile || !found) return <div className="text-muted">Einheit nicht gefunden.</div>
  if (!workout) return <div className="text-muted">Lade …</div>
  const { session } = found
  const step = steps[idx]

  if (askReadiness) {
    return <ReadinessForm onDone={async (r) => { await patchWorkout(workout.id, { readiness: r }); unlockAudio(); setAskReadiness(false) }} />
  }

  if (phase === 'done') {
    return (
      <div className="space-y-4 pt-6">
        <div className="card text-center space-y-2">
          <div className="text-4xl">✓</div>
          <div className="h1">Einheit abgeschlossen</div>
          <div className="text-muted">{session.title} · {fmtSec(elapsed)}</div>
        </div>
        <Link to="/" className="btn-primary block text-center">Zur Startseite</Link>
        <Link to={`/session/${date}/${sessionKey}`} className="btn-ghost block text-center">Einheit ansehen</Link>
      </div>
    )
  }

  const stepLabel = (s: Step) => {
    switch (s.kind) {
      case 'set': return s.isTest ? `Test ${s.label}` : `${s.label} · Satz ${s.setIndex}/${s.totalSets}`
      case 'amrap': return `AMRAP ${s.seg.minutes} min`
      case 'interval': return 'Intervalle'
      case 'cardio': return s.seg.label
      case 'challenge': return 'Challenge'
      case 'info': return s.title
      case 'note': return s.title
    }
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-2">
        <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => { if (confirm('Einheit verlassen? Der Fortschritt bleibt gespeichert.')) navigate('/') }}>✕</button>
        <div className="text-center min-w-0">
          <div className="font-semibold truncate">{session.title}</div>
          <div className="text-xs text-muted">Schritt {idx + 1}/{steps.length} · {fmtSec(elapsed)}</div>
        </div>
        <button className="btn-ghost px-3 py-1.5 text-sm" onClick={async () => { if (confirm('Einheit jetzt beenden und als erledigt speichern?')) { await finishWorkout(workout.id); setPhase('done') } }}>Beenden</button>
      </header>
      <div className="h-1 w-full bg-card2 rounded overflow-hidden"><div className="h-full bg-accent" style={{ width: `${(idx / steps.length) * 100}%` }} /></div>

      {phase === 'rest' && (
        <div className="space-y-3">
          <Timer key={`rest-${idx}`} seconds={restSec} label="Pause" onDone={() => { beepGo(); next() }} />
          {steps[idx + 1] && <div className="card text-sm"><span className="label">Als Nächstes</span><div>{stepLabel(steps[idx + 1])}{steps[idx + 1].kind === 'set' ? ` · ${ex((steps[idx + 1] as SetStep).exerciseId).name}` : ''}</div></div>}
        </div>
      )}

      {phase === 'work' && step && (
        <>
          <div className="label px-1">{stepLabel(step)}</div>
          {step.kind === 'info' && <InfoStep key={idx} step={step} onNext={next} />}
          {step.kind === 'note' && <div className="card space-y-3"><div className="h2">{step.title}</div><div>{step.text}</div><button className="btn-primary w-full" onClick={next}>Weiter</button></div>}
          {step.kind === 'set' && <SetStepView key={idx} step={step} workout={workout} onSaved={afterSet} onSkip={next} />}
          {step.kind === 'amrap' && <AmrapStep key={idx} step={step} workout={workout} onNext={next} />}
          {step.kind === 'interval' && <IntervalStep key={idx} step={step} workout={workout} onNext={next} />}
          {step.kind === 'cardio' && <CardioStep key={idx} step={step} workout={workout} onNext={next} />}
          {step.kind === 'challenge' && <ChallengeStep key={idx} step={step} workout={workout} profileStart={profile.planStartDate} onNext={next} />}
        </>
      )}

      <div className="flex justify-between text-sm pt-2">
        <button className="btn-ghost px-3 py-1.5" disabled={idx === 0} onClick={() => void goTo(idx - 1)}>‹ Zurück</button>
        <button className="btn-ghost px-3 py-1.5" onClick={next}>Überspringen ›</button>
      </div>
    </div>
  )
}

// ---------- Readiness ----------
function ReadinessForm({ onDone }: { onDone: (r: Readiness) => void }) {
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

// ---------- Info (Warm-up / Cool-down) ----------
function InfoStep({ step, onNext }: { step: Extract<Step, { kind: 'info' }>; onNext: () => void }) {
  const [timer, setTimer] = useState(false)
  return (
    <div className="space-y-3">
      <div className="card">
        <div className="h2 mb-2">{step.title}</div>
        <ul className="list-disc pl-5 space-y-1">{step.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
      </div>
      {step.minutes && !timer && <button className="btn-ghost w-full" onClick={() => { unlockAudio(); setTimer(true) }}>Timer {step.minutes} min starten</button>}
      {timer && step.minutes && <Timer seconds={step.minutes * 60} onDone={onNext} label={step.title} />}
      <button className="btn-primary w-full" onClick={onNext}>Fertig, weiter</button>
    </div>
  )
}

// ---------- Satz ----------
function SetStepView({ step, workout, onSaved, onSkip }: { step: SetStep; workout: WorkoutRow; onSaved: (restSec: number) => void; onSkip: () => void }) {
  const e = ex(step.exerciseId)
  const history = useLiveQuery(() => db.sets.where('[profileId+exerciseId]').equals([workout.profileId, step.exerciseId]).toArray(), [workout.profileId, step.exerciseId])
  const existing = useLiveQuery(
    () => db.sets.where('workoutId').equals(workout.id).toArray().then((rows) => rows.filter((r) => r.exerciseId === step.exerciseId && r.segmentLabel === step.label && r.setIndex === step.setIndex && !r.deleted)),
    [workout.id, step.exerciseId, step.label, step.setIndex],
  )
  const suggestion = useMemo(() => (history ? suggestLoad(step.p, history.filter((h) => h.workoutId !== workout.id), e.loadType) : undefined), [history, step.p, e.loadType, workout.id])
  const timed = step.p.seconds !== undefined || step.testUnit === 'seconds'
  // Bio Force: das Eingabefeld zeigt den Skalenwert in lb, gespeichert wird kg pro Seite
  const isBf = e.loadType === 'bioforce'
  const toInput = (kg: number) => (isBf ? kgToLb(kg) : kg)
  const [reps, setReps] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [rir, setRir] = useState<number | ''>('')
  const [seconds, setSeconds] = useState<number | ''>('')
  const [init, setInit] = useState(false)
  const [holdTimer, setHoldTimer] = useState(false)

  useEffect(() => {
    if (init || existing === undefined || suggestion === undefined) return
    const ex0 = existing[0]
    if (ex0) {
      setReps(ex0.reps ?? ''); setWeight(ex0.weightKg === undefined ? '' : toInput(ex0.weightKg)); setRir(ex0.rir ?? ''); setSeconds(ex0.seconds ?? '')
    } else {
      setReps(step.p.repsMax ?? step.p.repsMin ?? '')
      setSeconds(step.p.seconds ?? '')
      if (suggestion.weightKg !== undefined) setWeight(toInput(suggestion.weightKg))
    }
    setInit(true)
  }, [existing, suggestion, init, step.p])

  const showWeight = e.loadType === 'bioforce' || e.loadType === 'extern'
  const showRir = !step.isTest && e.loadType !== 'none'

  const save = async () => {
    const value = timed ? seconds : reps
    if (value === '' || value === 0) { alert('Bitte einen Wert eintragen.'); return }
    await saveSet(workout, {
      exerciseId: step.exerciseId, segmentLabel: step.label, setIndex: step.setIndex,
      reps: timed ? undefined : Number(reps), seconds: timed ? Number(seconds) : undefined,
      weightKg: showWeight && weight !== '' ? (isBf ? lbToKg(Number(weight)) : Number(weight)) : undefined,
      rir: showRir && rir !== '' ? Number(rir) : undefined,
      isTest: step.isTest,
    })
    if (step.isTest && step.benchmarkKey) await saveBenchmark(workout, step.benchmarkKey, Number(value), step.testUnit ?? 'reps')
    onSaved(step.restSec)
  }

  const sub = step.isTest ? step.description : `${prescriptionText(step.p)}${step.p.loadHint ? ` · ${step.p.loadHint}` : ''}${step.p.note ? ` · ${step.p.note}` : ''}`

  return (
    <div className="space-y-3">
      <ExerciseCard e={e} subtitle={sub} />
      {step.p.ramp && <div className="card text-sm"><span className="label">Einstufung</span><div>Satz 1 leicht, Satz 2 deutlich schwerer, Satz 3 die vermutete 10RM-Last. Die Last aus Satz 3 ist dein 10RM.</div></div>}
      {suggestion?.text && <div className="card text-sm"><span className="label">Vorschlag</span><div>{suggestion.text}</div></div>}
      <div className="card space-y-3">
        {timed && (
          <>
            {!holdTimer && step.p.seconds && <button className="btn-ghost w-full" onClick={() => { unlockAudio(); setHoldTimer(true) }}>Halte-Timer {step.p.seconds} s</button>}
            {holdTimer && step.p.seconds && <Timer seconds={step.p.seconds} onDone={() => setHoldTimer(false)} label="Halten" size="md" allowExtend={false} />}
            {step.isTest && <Stopwatch onChange={(s) => setSeconds(Math.round(s))} />}
            <NumberInput label="Sekunden" value={seconds} onChange={setSeconds} step={5} />
          </>
        )}
        {!timed && <NumberInput label={step.p.perSide ? 'Wiederholungen je Seite' : 'Wiederholungen'} value={reps} onChange={setReps} />}
        <div className="space-y-3">
          {showWeight && (isBf
            ? <NumberInput label="Skala (lb) pro Seite" value={weight} onChange={setWeight} step={BF_STEP_LB} min={BF_MIN_LB} max={BF_MAX_LB} hint={weight === '' ? 'Wert am Schwingarm, 5–125' : `≈ ${fmtKg(lbToKg(Number(weight)))} kg pro Seite`} />
            : <NumberInput label="kg" value={weight} onChange={setWeight} step={1} />)}
          {showRir && (
            <div className="flex-1">
              <div className="label mb-1">RIR · wie viele wären noch gegangen?</div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((v) => (
                  <button key={v} type="button" className={`flex-1 rounded-lg py-3 border ${rir === v ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => setRir(v)}>{v === 4 ? '4+' : v}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="btn-primary w-full" onClick={save}>Satz speichern{step.restSec > 0 ? ` · Pause ${step.restSec} s` : ''}</button>
        <button className="btn-ghost w-full text-sm" onClick={onSkip}>Satz auslassen</button>
      </div>
    </div>
  )
}

// ---------- AMRAP ----------
function AmrapStep({ step, workout, onNext }: { step: Extract<Step, { kind: 'amrap' }>; workout: WorkoutRow; onNext: () => void }) {
  const seg = step.seg
  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const single = seg.exercises.length === 1 && seg.exercises[0].reps === 1
  const save = async () => {
    const exId = single ? seg.exercises[0].exerciseId : seg.exercises[0].exerciseId
    await saveSet(workout, {
      exerciseId: exId, segmentLabel: `amrap-${seg.label}`, setIndex: 1,
      reps: single ? count : undefined, rounds: single ? undefined : count, seconds: seg.minutes * 60, isTest: !!seg.benchmarkKey,
      note: single ? undefined : seg.exercises.map((x) => `${x.reps} ${ex(x.exerciseId).name}`).join(', '),
    })
    if (!single) {
      // Wiederholungen der einzelnen Übungen mitzählen (für Wochen-Summen)
      for (const x of seg.exercises) {
        await saveSet(workout, { exerciseId: x.exerciseId, segmentLabel: `amrap-${seg.label}-sum`, setIndex: 1, reps: x.reps * count })
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
      {!running && !finished && <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); beepGo(); setRunning(true) }}>Start</button>}
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
      {finished && <button className="btn-primary w-full" onClick={save}>Ergebnis speichern</button>}
      {running && <button className="btn-ghost w-full text-sm" onClick={() => { setRunning(false); setFinished(true) }}>Vorzeitig beenden</button>}
    </div>
  )
}

// ---------- Intervalle ----------
function IntervalStep({ step, workout, onNext }: { step: Extract<Step, { kind: 'interval' }>; workout: WorkoutRow; onNext: () => void }) {
  const seg = step.seg
  const [round, setRound] = useState(0) // 0 = nicht gestartet
  const [mode, setMode] = useState<'work' | 'rest' | 'done'>('work')
  const [reps, setReps] = useState<number | ''>('')
  const e = ex(seg.exerciseId)
  const start = () => { unlockAudio(); beepGo(); speak('Los'); setRound(1); setMode('work') }
  const onWorkDone = () => {
    if (round >= seg.rounds) { setMode('done'); speak('Fertig') }
    else { setMode('rest'); speak('Pause') }
  }
  const onRestDone = () => { beepGo(); speak('Los'); setRound((r) => r + 1); setMode('work') }
  const save = async () => {
    await saveSet(workout, { exerciseId: seg.exerciseId, segmentLabel: `interval-${seg.label}`, setIndex: 1, rounds: seg.rounds, seconds: seg.rounds * seg.workSec, reps: reps === '' ? undefined : Number(reps) })
    onNext()
  }
  return (
    <div className="space-y-3">
      <div className="card space-y-1">
        <div className="h2">{seg.rounds} × {seg.workSec} s {e.name} / {seg.restSec} s Pause</div>
        <div className="text-sm text-muted">{seg.description}</div>
        {seg.alternative && <div className="text-xs text-muted">Alternative: {seg.alternative}</div>}
      </div>
      {round === 0 && <button className="btn-primary w-full text-xl py-4" onClick={start}>Start</button>}
      {round > 0 && mode === 'work' && <Timer key={`w${round}`} seconds={seg.workSec} onDone={onWorkDone} label={`Runde ${round}/${seg.rounds} · ARBEIT`} allowExtend={false} />}
      {round > 0 && mode === 'rest' && <Timer key={`r${round}`} seconds={seg.restSec} onDone={onRestDone} label={`Pause · danach Runde ${round + 1}`} allowExtend={false} />}
      {mode === 'done' && (
        <div className="card space-y-3">
          <div className="h2">Intervalle fertig</div>
          <NumberInput label="Wiederholungen gesamt (optional)" value={reps} onChange={setReps} />
          <button className="btn-primary w-full" onClick={save}>Speichern</button>
        </div>
      )}
    </div>
  )
}

// ---------- Cardio ----------
function CardioStep({ step, workout, onNext }: { step: Extract<Step, { kind: 'cardio' }>; workout: WorkoutRow; onNext: () => void }) {
  const seg = step.seg
  const e = ex(seg.exerciseId)
  const [alt, setAlt] = useState(false)
  const [minutes, setMinutes] = useState<number | ''>(seg.minutes)
  const [dist, setDist] = useState<number | ''>('')
  const [hr, setHr] = useState<number | ''>('')
  const [timer, setTimer] = useState(false)
  const save = async () => {
    await saveSet(workout, {
      exerciseId: seg.exerciseId, segmentLabel: `cardio-${seg.label}`, setIndex: 1,
      seconds: minutes === '' ? undefined : Number(minutes) * 60, distanceM: dist === '' ? undefined : Number(dist), avgHr: hr === '' ? undefined : Number(hr),
      isTest: !!seg.benchmarkKey, note: alt ? 'Alternative' : undefined,
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
      {!timer && <button className="btn-ghost w-full" onClick={() => { unlockAudio(); setTimer(true) }}>Countdown {seg.minutes} min starten</button>}
      {timer && <Timer seconds={seg.minutes * 60} onDone={() => setTimer(false)} label={e.name} />}
      <div className="card space-y-3">
        <div className="flex gap-3">
          <NumberInput label="Dauer" suffix="min" value={minutes} onChange={setMinutes} compact />
          <NumberInput label="Distanz" suffix="m" value={dist} onChange={setDist} step={100} compact />
          <NumberInput label="Ø Puls" value={hr} onChange={setHr} compact />
        </div>
        <button className="btn-primary w-full" onClick={save}>Speichern</button>
      </div>
    </div>
  )
}

// ---------- Challenge ----------
function ChallengeStep({ step, workout, profileStart, onNext }: { step: Extract<Step, { kind: 'challenge' }>; workout: WorkoutRow; profileStart: string; onNext: () => void }) {
  const seg = step.seg
  const monday = mondayOfWeek(profileStart, workout.week)
  const sunday = addDays(monday, 6)
  const benchmarks = useLiveQuery(() => db.benchmarks.where('profileId').equals(workout.profileId).toArray(), [workout.profileId])
  const weekSets = useLiveQuery(
    () => db.sets.where('profileId').equals(workout.profileId).toArray().then((rows) => rows.filter((s) => s.date >= monday && s.date <= sunday && s.workoutId !== workout.id && (s.segmentLabel === 'challenge' || s.segmentLabel.endsWith('-sum') || s.isTest))),
    [workout.profileId, monday, sunday, workout.id],
  )
  const status = useMemo(() => (benchmarks && weekSets ? challengeStatus(benchmarks, weekSets, seg.items[0]?.share ?? 0.2) : []), [benchmarks, weekSets, seg.items])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [started, setStarted] = useState(false)
  const save = async () => {
    for (const st of status) {
      const c = counts[st.exerciseId] ?? 0
      if (c > 0) await saveSet(workout, { exerciseId: st.exerciseId, segmentLabel: 'challenge', setIndex: 1, reps: c })
    }
    onNext()
  }
  return (
    <div className="space-y-3">
      <div className="card text-sm"><div className="h2">{seg.label}</div><div className="text-muted">{seg.description}</div></div>
      {!started && <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); setStarted(true) }}>Start (Zeit läuft)</button>}
      {started && <Stopwatch />}
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
      <button className="btn-primary w-full" onClick={save}>Challenge-Block speichern</button>
    </div>
  )
}
