import { useCallback, useEffect, useMemo, useState } from 'react'
import { calOf } from '../lib/planShift'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorCard, errorText } from '../components/ErrorBoundary'
import Timer from '../components/Timer'
import { findSession } from '../data/plan'
import type { Workout as WorkoutRow } from '../db/types'
import { useProfile } from '../hooks/useProfile'
import { beepGo, speak, unlockAudio } from '../lib/audio'
import { fmtSec, planWeekOf, today } from '../lib/dates'
import { MeasureStep, TimedStep } from '../components/TimedFlow'
import { buildSteps, type Step } from '../lib/steps'
import { keepAwake } from '../lib/wakeLock'
import { finishWorkout, getOrCreateWorkout, patchWorkout } from '../lib/workouts'
import { SetNote, WorkoutNote } from '../components/workout/Notes'
import NextPreview from '../components/workout/NextPreview'
import ReadinessForm from '../components/workout/ReadinessForm'
import SetStepView from '../components/workout/SetStepView'
import AmrapStep from '../components/workout/AmrapStep'
import IntervalStep from '../components/workout/IntervalStep'
import CardioStep from '../components/workout/CardioStep'
import ChallengeStep from '../components/workout/ChallengeStep'


export default function Workout() {
  const { date = '', sessionKey = '' } = useParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const found = useMemo(() => findSession(sessionKey), [sessionKey])
  const steps = useMemo(() => (found ? buildSteps(found.session) : []), [found])
  const profileId = profile?.id
  const planStart = useMemo(() => (profile ? calOf(profile) : undefined), [profile])
  // Routinen (Mobility) hängen an keiner Planwoche: die Woche kommt aus dem Datum
  const weekNo = found ? (found.week.number === 0 && planStart ? planWeekOf(date, planStart) : found.week.number) : 0
  const isRoutine = found?.session.kind === 'mobility'
  const [workout, setWorkout] = useState<WorkoutRow | null>(null)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'work' | 'rest' | 'done'>('work')
  const [restSec, setRestSec] = useState(0)
  const [lastSetId, setLastSetId] = useState<string>() // der gerade gespeicherte Satz: Bemerkung in der Pause
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
    // Nach dem Abschluss (Cool-down fertig, „Beenden“) steht die Uhr still
    if (!workout?.startedAt || phase === 'done') return
    const t0 = new Date(workout.startedAt).getTime()
    const tick = () => setElapsed((Date.now() - t0) / 1000)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [workout?.startedAt, phase])

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

  const afterSet = (rest: number, setId?: string) => {
    setLastSetId(setId)
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
        <WorkoutNote workout={workout} />
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
          {lastSetId && <SetNote key={lastSetId} setId={lastSetId} />}
          {upcoming.notes.map((n, i) => (
            <div key={i} className="rounded-xl bg-accent/10 border border-accent/50 p-3 text-sm">
              <span className="label text-accent">Jetzt in der Pause · {n.title}</span>
              <div>{n.text}</div>
            </div>
          ))}
          {upcoming.step && <NextPreview step={upcoming.step} label={stepLabel(upcoming.step)} workoutId={workout.id} profileId={workout.profileId} currentExerciseId={step?.kind === 'set' ? step.exerciseId : undefined} />}
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
          {step.kind === 'challenge' && <ChallengeStep key={idx} step={step} workout={workout} profileStart={calOf(profile)} onNext={next} />}
        </>
      )}

      <div className="flex justify-between text-sm pt-2">
        <button className="btn-ghost px-3 py-1.5" disabled={idx === 0} onClick={() => void goTo(idx - 1)}>‹ Zurück</button>
        <button className="btn-ghost px-3 py-1.5" onClick={next}>Überspringen ›</button>
      </div>
    </div>
  )
}
