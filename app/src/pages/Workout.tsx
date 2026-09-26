import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ErrorCard, errorText } from '../components/ErrorBoundary'
import ExerciseCard, { ExerciseImages, MuscleChips } from '../components/ExerciseCard'
import NumberInput from '../components/NumberInput'
import Timer, { GetReady, Stopwatch } from '../components/Timer'
import { ex } from '../data/exercises'
import { findSession } from '../data/plan'
import { db } from '../db/db'
import type { Readiness, Workout as WorkoutRow } from '../db/types'
import { useProfile } from '../hooks/useProfile'
import { beepGo, speak, unlockAudio } from '../lib/audio'
import { fmtSec, mondayOfWeek, addDays, planWeekOf, today } from '../lib/dates'
import { MeasureStep, TimedStep } from '../components/TimedFlow'
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
  const planStart = profile?.planStartDate
  // Routinen (Mobility) hängen an keiner Planwoche: die Woche kommt aus dem Datum
  const weekNo = found ? (found.week.number === 0 && planStart ? planWeekOf(date, planStart) : found.week.number) : 0
  const isRoutine = found?.session.kind === 'mobility'
  const [workout, setWorkout] = useState<WorkoutRow | null>(null)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'work' | 'rest' | 'done'>('work')
  const [restSec, setRestSec] = useState(0)
  const [askReadiness, setAskReadiness] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [loadError, setLoadError] = useState<string>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!profileId || !found) return
    let cancelled = false
    setLoadError(undefined)
    // Kommt die Datenbank nicht zurück, nach 8 s eine Meldung zeigen statt endlos „Lade …“
    const slow = setTimeout(() => { if (!cancelled) setLoadError('Zeitüberschreitung: Die Datenbank antwortet nicht (getOrCreateWorkout).') }, 8000)
    getOrCreateWorkout(profileId, date, weekNo, found.session).then((w) => {
      clearTimeout(slow)
      if (cancelled) return
      setLoadError(undefined)
      setWorkout(w)
      const start = w.stepIndex ?? 0
      if (w.status === 'fertig') { setIdx(0); setPhase('work') }
      else { setIdx(Math.min(start, steps.length - 1)); setPhase('work') }
      // Mobility-Routinen ohne Kurz-Check: kurz, freiwillig, das Datum steht schon in der Route (heute)
      setAskReadiness(w.status !== 'fertig' && !w.readiness && !isRoutine)
    }).catch((e) => { clearTimeout(slow); if (!cancelled) setLoadError(errorText(e)) })
    return () => { cancelled = true; clearTimeout(slow) }
  }, [profileId, found, date, weekNo, isRoutine, steps.length, attempt])

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

  // Für die Pause: Umbau-Hinweise (note) bis zum nächsten echten Schritt einsammeln.
  // Sie werden in der Pause angezeigt und danach übersprungen, der Umbau passiert schon während der Pause.
  const upcoming = useMemo(() => {
    const notes: Extract<Step, { kind: 'note' }>[] = []
    let j = idx + 1
    while (j < steps.length && steps[j].kind === 'note') { notes.push(steps[j] as Extract<Step, { kind: 'note' }>); j++ }
    return { notes, step: steps[j] as Step | undefined, index: j }
  }, [steps, idx])
  const afterRest = useCallback(() => { beepGo(); void goTo(upcoming.index) }, [goTo, upcoming.index])

  const afterSet = (rest: number) => {
    const isLast = idx + 1 >= steps.length
    if (rest > 0 && !isLast) {
      setRestSec(rest)
      setPhase('rest')
      speak('Pause')
    } else next()
  }

  if (!profile || !found) return <div className="text-muted">Einheit nicht gefunden.</div>
  if (!workout && loadError) return <ErrorCard title="Einheit lässt sich nicht starten" error={`${loadError}\n${sessionKey} · ${date}`} onRetry={() => setAttempt((a) => a + 1)} />
  if (!workout) return <div className="text-muted">Lade …</div>
  const { session } = found
  const step = steps[idx]

  if (askReadiness) {
    // Die Uhr startet erst hier: wer die Einheit vorher nur angesehen hat, soll keine Stunden auf dem Zähler haben.
    // Das Datum wird auf den tatsächlichen Trainingstag gesetzt: die Route trägt das Plan-Datum, das beim Vorziehen oder Nachholen nicht stimmt.
    return <ReadinessForm onDone={async (r) => {
      const startedAt = new Date().toISOString()
      const trainedOn = today()
      await patchWorkout(workout.id, { readiness: r, startedAt, date: trainedOn })
      setWorkout({ ...workout, readiness: r, startedAt, date: trainedOn })
      unlockAudio(); setAskReadiness(false)
    }} />
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
        {isRoutine ? <Link to="/mobility" className="btn-ghost block text-center">Zur Mobility-Seite</Link> : <Link to={`/session/${date}/${sessionKey}`} className="btn-ghost block text-center">Einheit ansehen</Link>}
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
      case 'timed': return s.seg.title
      case 'measure': return `Messung ${s.seg.label}`
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
          <Timer key={`rest-${idx}`} seconds={restSec} label="Pause" onDone={afterRest} />
          {upcoming.notes.map((n, i) => (
            <div key={i} className="rounded-xl bg-accent/10 border border-accent/50 p-3 text-sm">
              <span className="label text-accent">Jetzt in der Pause · {n.title}</span>
              <div>{n.text}</div>
            </div>
          ))}
          {upcoming.step && <NextPreview step={upcoming.step} label={stepLabel(upcoming.step)} currentExerciseId={step?.kind === 'set' ? step.exerciseId : undefined} />}
        </div>
      )}

      {phase === 'work' && step && (
        <>
          <div className="label px-1">{stepLabel(step)}</div>
          {step.kind === 'timed' && <TimedStep key={idx} seg={step.seg} onDone={next} />}
          {step.kind === 'measure' && <MeasureStep key={idx} seg={step.seg} workout={workout} onNext={next} />}
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

// ---------- Vorschau in der Pause ----------
/** Zeigt den nächsten Schritt so, dass man während der Pause schon umbauen kann: Gerät, Aufstellung, Fotos. */
function NextPreview({ step, label, currentExerciseId }: { step: Step; label: string; currentExerciseId?: string }) {
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

// ---------- Satz ----------
function SetStepView({ step, workout, onSaved, onSkip }: { step: SetStep; workout: WorkoutRow; onSaved: (restSec: number) => void; onSkip: () => void }) {
  const e = ex(step.exerciseId)
  const history = useLiveQuery(() => db.sets.where('[profileId+exerciseId]').equals([workout.profileId, step.exerciseId]).toArray(), [workout.profileId, step.exerciseId])
  const existing = useLiveQuery(
    () => db.sets.where('workoutId').equals(workout.id).toArray().then((rows) => rows.filter((r) => r.exerciseId === step.exerciseId && r.segmentLabel === step.label && r.setIndex === step.setIndex && !r.deleted)),
    [workout.id, step.exerciseId, step.label, step.setIndex],
  )
  const suggestion = useMemo(() => (history ? suggestLoad(step.p, history.filter((h) => h.workoutId !== workout.id), e.loadType, e.smallStep) : undefined), [history, step.p, e.loadType, e.smallStep, workout.id])
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
  const [missing, setMissing] = useState(false)
  const [noLoad, setNoLoad] = useState(false) // Bio Force ohne Skalenwert: erst Hinweis, zweiter Tipp speichert

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
    if (value === '' || value === 0) { setMissing(true); return }
    if (isBf && weight === '' && !noLoad) { setNoLoad(true); return }
    setMissing(false)
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
            {holdTimer === 'off' && step.p.seconds && <button className="btn-ghost w-full" onClick={() => { unlockAudio(); setHoldTimer('ready') }}>Halte-Timer {step.p.seconds} s</button>}
            {holdTimer === 'ready' && <GetReady onGo={() => setHoldTimer('on')} />}
            {holdTimer === 'on' && step.p.seconds && <Timer seconds={step.p.seconds} onDone={() => setHoldTimer('off')} label="Halten" size="md" allowExtend={false} />}
            {step.isTest && <Stopwatch leadIn onChange={(s) => setSeconds(Math.round(s))} />}
            <NumberInput label="Sekunden" value={seconds} onChange={(v) => { setSeconds(v); setMissing(false) }} step={5} error={missing ? 'Bitte die Sekunden eintragen.' : undefined} />
          </>
        )}
        {!timed && <NumberInput label={step.p.perSide ? 'Wiederholungen je Seite' : 'Wiederholungen'} value={reps} onChange={(v) => { setReps(v); setMissing(false) }} error={missing ? 'Bitte die Wiederholungen eintragen.' : undefined} />}
        <div className="space-y-3">
          {showWeight && (isBf
            ? <NumberInput label="Skala (lb) pro Seite" value={weight} onChange={(v) => { setWeight(v); setNoLoad(false) }} step={BF_STEP_LB} min={BF_MIN_LB} max={BF_MAX_LB} hint={weight === '' ? 'Wert am Schwingarm, 5–125 in 2,5er-Rasten' : `≈ ${fmtKg(lbToKg(Number(weight)))} kg pro Seite`} error={noLoad ? 'Kein Skalenwert eingetragen. Nochmal tippen, um ohne Last zu speichern.' : undefined} />
            : <NumberInput label="kg" value={weight} onChange={setWeight} step={1} />)}
          {showRir && (
            <div className="flex-1">
              <div className="label mb-1">RIR · wie viele wären noch gegangen?</div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((v) => (
                  <button key={v} type="button" className={`flex-1 rounded-lg py-3 border ${rir === v ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => setRir(v)}>{v === 4 ? '4+' : v}</button>
                ))}
              </div>
              {isBf && rir !== '' && rir >= 3 && step.setIndex < step.totalSets && (
                <div className="text-xs text-accent2 mt-1">Zu leicht: nächsten Satz {rir >= 4 ? '10 lb (vier Rasten)' : '5 lb (zwei Rasten)'} mehr, die Wiederholungszahl bleibt das Ziel.</div>
              )}
            </div>
          )}
        </div>
        <button className="btn-primary w-full" onClick={save}>{noLoad ? 'Ohne Last speichern' : 'Satz speichern'}{step.restSec > 0 ? ` · Pause ${step.restSec} s` : ''}</button>
        <button className="btn-ghost w-full text-sm" onClick={onSkip}>Satz auslassen</button>
      </div>
    </div>
  )
}

// ---------- AMRAP ----------
function AmrapStep({ step, workout, onNext }: { step: Extract<Step, { kind: 'amrap' }>; workout: WorkoutRow; onNext: () => void }) {
  const seg = step.seg
  const [ready, setReady] = useState(false)
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
  const [ready, setReady] = useState(false)
  const start = () => { setReady(false); speak('Los'); setRound(1); setMode('work') }
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
      {round === 0 && !ready && <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); setReady(true) }}>Start</button>}
      {ready && <GetReady onGo={start} />}
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
  const [timer, setTimer] = useState<'off' | 'ready' | 'on'>('off')
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
      {timer === 'off' && <button className="btn-ghost w-full" onClick={() => { unlockAudio(); setTimer('ready') }}>Countdown {seg.minutes} min starten</button>}
      {timer === 'ready' && <GetReady onGo={() => setTimer('on')} />}
      {timer === 'on' && <Timer seconds={seg.minutes * 60} onDone={() => setTimer('off')} label={e.name} />}
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
  const [started, setStarted] = useState<'no' | 'ready' | 'yes'>('no')
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
      {started === 'no' && <button className="btn-primary w-full text-xl py-4" onClick={() => { unlockAudio(); setStarted('ready') }}>Start (Zeit läuft nach 3-2-1)</button>}
      {started === 'ready' && <GetReady onGo={() => setStarted('yes')} />}
      {started === 'yes' && <Stopwatch autoStart />}
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
