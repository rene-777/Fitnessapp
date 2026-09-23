import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXERCISE_MAP, ex } from '../data/exercises'
import { timedSeconds, type Segment, type TimedItem } from '../data/planTypes'
import { db } from '../db/db'
import type { Workout } from '../db/types'
import { beepCount, beepEnd, beepGo, speak, unlockAudio } from '../lib/audio'
import { fmtDate, fmtSec } from '../lib/dates'
import { fmtDec } from '../lib/decimal'
import { BENCHMARK_LABELS, LOWER_IS_BETTER, saveBenchmark } from '../lib/workouts'
import { ExerciseImages } from './ExerciseCard'
import NumberInput from './NumberInput'

type TimedSeg = Extract<Segment, { type: 'timed' }>
type MeasureSeg = Extract<Segment, { type: 'measure' }>

/** Ein Durchgang: ein Posten, bei perSide je Seite einer. */
interface Run { item: TimedItem; side?: 'L' | 'R'; seconds: number; itemIndex: number }

function expand(items: TimedItem[]): Run[] {
  const out: Run[] = []
  items.forEach((item, itemIndex) => {
    if (item.perSide) { out.push({ item, side: 'L', seconds: item.seconds, itemIndex }); out.push({ item, side: 'R', seconds: item.seconds, itemIndex }) }
    else out.push({ item, seconds: item.seconds, itemIndex })
  })
  return out
}

const runName = (r: Run) => (r.item.exerciseId ? EXERCISE_MAP[r.item.exerciseId]?.name ?? r.item.exerciseId : r.item.title ?? '')
const sideLabel = (s?: 'L' | 'R') => (s === 'L' ? 'Links' : s === 'R' ? 'Rechts' : '')

/**
 * Zeitgeführter Ablauf (Warm-up, Cool-down, Mobility): jeder Posten läuft mit Countdown, am Ende Signal und
 * automatisch weiter zum nächsten, mit Vorschau. Rechnet mit Zeitstempeln, damit Hintergrund-Drosselung nichts verschiebt.
 */
export function TimedStep({ seg, onDone }: { seg: TimedSeg; onDone: () => void }) {
  const runs = useMemo(() => expand(seg.items), [seg.items])
  const total = useMemo(() => timedSeconds(seg.items), [seg.items])
  const [idx, setIdx] = useState(0)
  const [endAt, setEndAt] = useState<number | null>(null) // null = nicht gestartet oder pausiert
  const [paused, setPaused] = useState<number | null>(null) // Restsekunden während der Pause
  const [remaining, setRemaining] = useState(runs[0]?.seconds ?? 0)
  const [showAll, setShowAll] = useState(false)
  const lastBeep = useRef(-1)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const started = endAt !== null || paused !== null
  const run = runs[idx]
  const nextRun = runs[idx + 1]

  // Automatischer Übergang: Signal, Ansage, nächster Posten startet ohne Tipp
  useEffect(() => {
    if (endAt === null) return
    const id = setInterval(() => {
      const r = Math.max(0, (endAt - Date.now()) / 1000)
      setRemaining(r)
      const whole = Math.ceil(r)
      if (whole <= 3 && whole >= 1 && lastBeep.current !== whole) { lastBeep.current = whole; beepCount() }
      if (r > 0) return
      clearInterval(id)
      lastBeep.current = -1
      if (idx + 1 < runs.length) {
        const n = runs[idx + 1]
        beepGo()
        speak(`${runName(n)}${n.side ? ' ' + sideLabel(n.side).toLowerCase() : ''}`)
        setIdx(idx + 1)
        setRemaining(n.seconds)
        setEndAt(endAt + n.seconds * 1000) // ohne Verzug anschließen
      } else {
        beepEnd()
        setEndAt(null)
        onDoneRef.current()
      }
    }, 200)
    return () => clearInterval(id)
  }, [endAt, idx, runs])

  const start = () => {
    unlockAudio()
    beepGo()
    speak(`${runName(run)}${run.side ? ' ' + sideLabel(run.side).toLowerCase() : ''}`)
    setRemaining(run.seconds)
    setEndAt(Date.now() + run.seconds * 1000)
  }
  const pause = () => { setPaused(remaining); setEndAt(null) }
  const resume = () => { setEndAt(Date.now() + (paused ?? run.seconds) * 1000); setPaused(null) }
  const jump = (i: number) => {
    if (i >= runs.length) { setEndAt(null); setPaused(null); onDoneRef.current(); return }
    const r = runs[i]
    lastBeep.current = -1
    setIdx(i)
    setRemaining(r.seconds)
    if (endAt !== null) setEndAt(Date.now() + r.seconds * 1000)
    else if (paused !== null) setPaused(r.seconds)
  }
  const extend = (s: number) => {
    if (endAt !== null) setEndAt(endAt + s * 1000)
    else if (paused !== null) setPaused(paused + s)
  }

  const doneSec = runs.slice(0, idx).reduce((a, r) => a + r.seconds, 0) + (run ? run.seconds - remaining : 0)
  const leftTotal = Math.max(0, total - doneSec)
  const pct = run ? Math.min(100, Math.max(0, (remaining / run.seconds) * 100)) : 0
  const e = run?.item.exerciseId ? EXERCISE_MAP[run.item.exerciseId] : undefined
  const running = endAt !== null

  if (!run) return null
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between px-1 text-xs text-muted">
        <span>{seg.title} · Posten {run.itemIndex + 1}/{seg.items.length}</span>
        <span>Rest gesamt {fmtSec(leftTotal)}</span>
      </div>

      {/* Aktueller Posten */}
      <div className="card space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            {e ? <Link to={`/exercises/${e.id}`} className="h2 leading-tight">{e.name}</Link> : <div className="h2 leading-tight">{run.item.title}</div>}
            {run.side && <span className={`chip-accent shrink-0 ${run.side === 'R' ? '!bg-accent !text-black' : ''}`}>{sideLabel(run.side)}</span>}
          </div>
          {(run.item.reps || run.item.note) && <div className="text-accent2 text-sm mt-0.5">{[run.item.reps, run.item.note].filter(Boolean).join(' · ')}</div>}
        </div>
        <div className="text-center">
          <div className="text-6xl font-bold tabular-nums">{fmtSec(Math.ceil(started ? remaining : run.seconds))}</div>
          <div className="h-1.5 w-full rounded bg-card2 overflow-hidden mt-2"><div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${started ? pct : 100}%` }} /></div>
        </div>
        {e && <ExerciseImages e={e} />}
        {e && (
          <div className="text-sm space-y-1">
            {e.setup && <div className="text-muted">{e.setup}</div>}
            <ol className="list-decimal pl-5 space-y-0.5">{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            {e.knee && <div className="text-xs text-warn">Knie: {e.knee}</div>}
          </div>
        )}
        {!started && <button className="btn-primary w-full text-xl py-4" onClick={start}>Start · läuft dann von selbst durch</button>}
        {started && (
          <div className="flex gap-2">
            {running ? <button className="btn-ghost flex-1" onClick={pause}>Pause</button> : <button className="btn-primary flex-1" onClick={resume}>Weiter</button>}
            <button className="btn-ghost" onClick={() => extend(15)}>+15 s</button>
            <button className="btn-ghost" disabled={idx === 0} onClick={() => jump(idx - 1)}>‹</button>
            <button className="btn-ghost" onClick={() => jump(idx + 1)}>{nextRun ? 'Nächste ›' : 'Fertig ›'}</button>
          </div>
        )}
      </div>

      {/* Vorschau */}
      {nextRun && <NextItem run={nextRun} />}

      {/* Alle Posten */}
      <button className="w-full text-sm text-muted py-1" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Liste ausblenden' : `Alle ${seg.items.length} Posten anzeigen`}</button>
      {showAll && (
        <ol className="card text-sm space-y-1">
          {seg.items.map((it, i) => {
            const name = it.exerciseId ? EXERCISE_MAP[it.exerciseId]?.name ?? it.exerciseId : it.title
            const state = i < run.itemIndex ? 'text-muted line-through' : i === run.itemIndex ? 'text-accent font-semibold' : ''
            return <li key={i} className={`flex justify-between gap-2 ${state}`}><span>{name}{it.reps ? ` · ${it.reps}` : ''}</span><span className="tabular-nums shrink-0">{it.perSide ? `2 × ${it.seconds} s` : `${it.seconds} s`}</span></li>
          })}
        </ol>
      )}
    </div>
  )
}

function NextItem({ run }: { run: Run }) {
  const e = run.item.exerciseId ? EXERCISE_MAP[run.item.exerciseId] : undefined
  return (
    <div className="card !py-3 space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label">Als Nächstes</span>
        <span className="text-xs text-muted tabular-nums">{run.seconds} s</span>
      </div>
      <div className="font-semibold leading-tight">{runName(run)}{run.side ? ` · ${sideLabel(run.side)}` : ''}</div>
      {run.item.reps && <div className="text-sm text-accent2">{run.item.reps}</div>}
      {e && <ExerciseImages e={e} small />}
      {e?.setup && <div className="text-xs text-muted">{e.setup}</div>}
    </div>
  )
}

/** Mobility-Check: ein Messwert in cm (je Seite oder einmal), gespeichert als Benchmark des Trainings. */
export function MeasureStep({ seg, workout, onNext }: { seg: MeasureSeg; workout: Workout; onNext: () => void }) {
  const e = ex(seg.exerciseId)
  const keys = seg.perSide ? [`${seg.benchmarkKey}_L`, `${seg.benchmarkKey}_R`] : [seg.benchmarkKey]
  const all = useLiveQuery(() => db.benchmarks.where('profileId').equals(workout.profileId).toArray(), [workout.profileId])
  const [values, setValues] = useState<(number | '')[]>(keys.map(() => ''))
  const [init, setInit] = useState(false)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (init || !all) return
    setValues(keys.map((k) => all.find((b) => b.key === k && b.workoutId === workout.id && !b.deleted)?.value ?? ''))
    setInit(true)
  }, [all, init, keys, workout.id])
  const previous = keys.map((k) => (all ?? []).filter((b) => b.key === k && b.workoutId !== workout.id && !b.deleted).sort((a, b) => (a.date < b.date ? 1 : -1))[0])
  const lower = LOWER_IS_BETTER.has(keys[0])

  const save = async () => {
    if (values.some((v) => v === '')) { setMissing(true); return }
    for (let i = 0; i < keys.length; i++) await saveBenchmark(workout, keys[i], Number(values[i]), 'cm')
    onNext()
  }
  const set = (i: number, v: number | '') => { setValues((vals) => vals.map((x, j) => (j === i ? v : x))); setMissing(false) }

  return (
    <div className="space-y-3">
      <div className="card space-y-2">
        <Link to={`/exercises/${e.id}`} className="h2 leading-tight block">{e.name}</Link>
        <div className="text-sm">{seg.description}</div>
        {seg.hint && <div className="text-xs text-muted">{seg.hint}</div>}
        <ExerciseImages e={e} />
        <div className="text-sm space-y-1">
          {e.setup && <div className="text-muted">{e.setup}</div>}
          <ol className="list-decimal pl-5 space-y-0.5">{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          {e.tips && <ul className="list-disc pl-5 text-xs text-muted">{e.tips.map((s, i) => <li key={i}>{s}</li>)}</ul>}
        </div>
      </div>
      <div className="card space-y-3">
        <div className={keys.length > 1 ? 'flex gap-3' : ''}>
          {keys.map((k, i) => (
            <NumberInput key={k} label={keys.length > 1 ? (i === 0 ? 'Links' : 'Rechts') : 'Messwert'} suffix="cm" value={values[i]} onChange={(v) => set(i, v)} step={0.5} min={seg.allowNegative ? -60 : 0} max={100} compact={keys.length > 1} error={missing && values[i] === '' ? 'Bitte messen und eintragen.' : undefined} hint={previous[i] ? `Zuletzt ${fmtDec(previous[i].value)} cm (${fmtDate(previous[i].date, { day: '2-digit', month: '2-digit' })})` : undefined} />
          ))}
        </div>
        <div className="text-xs text-muted">{BENCHMARK_LABELS[keys[0]]?.replace(/ (links|rechts)/, '')} · {lower ? 'kleiner ist besser' : 'größer ist besser'}</div>
        <button className="btn-primary w-full" onClick={save}>Messung speichern</button>
        <button className="btn-ghost w-full text-sm" onClick={onNext}>Auslassen</button>
      </div>
    </div>
  )
}
