import { CHALLENGE_TARGETS, WEEKS, blockOfWeek, weekByNumber } from '../data/plan'
import type { Prescription, Segment, Session, Week } from '../data/planTypes'
import type { Benchmark, SetLog } from '../db/types'
import { planWeekOf, weekday } from './dates'
import { BF_MAX_LB, BF_STEP_LB, kgToLb, lbToKg, loadText } from './bioforce'

export interface DayInfo {
  date: string
  week: number // 0 = vor Planstart, >16 = nach Plan
  weekday: number
  weekData?: Week
  session?: Session
  kind: 'vorher' | 'training' | 'puffer' | 'ruhe' | 'frei' | 'nachher'
}

export function dayInfo(date: string, start: string): DayInfo {
  const week = planWeekOf(date, start)
  const wd = weekday(date)
  if (week === 0) return { date, week, weekday: wd, kind: 'vorher' }
  if (week > WEEKS.length) return { date, week, weekday: wd, kind: 'nachher' }
  const weekData = weekByNumber(week)
  const session = weekData?.sessions.find((s) => s.weekday === wd)
  if (session) return { date, week, weekday: wd, weekData, session, kind: 'training' }
  if (wd === 6) return { date, week, weekday: wd, weekData, kind: 'puffer' }
  if (wd === 7) return { date, week, weekday: wd, weekData, kind: 'ruhe' }
  return { date, week, weekday: wd, weekData, kind: 'frei' }
}

export const blockLabel = (week: number) => {
  const b = blockOfWeek(week)
  return b ? `Block ${b.number} · ${b.name}` : ''
}

/** Alle Übungs-IDs einer Einheit (für Vorschau und Nachtragen) */
export function sessionExerciseIds(session: Session): string[] {
  const ids = new Set<string>()
  for (const s of session.segments) {
    if (s.type === 'block') s.exercises.forEach((e) => ids.add(e.exerciseId))
    if (s.type === 'test') { ids.add(s.exerciseId); if (s.followUp) ids.add(s.followUp.exerciseId) }
    if (s.type === 'amrap') s.exercises.forEach((e) => ids.add(e.exerciseId))
    if (s.type === 'interval' || s.type === 'cardio') ids.add(s.exerciseId)
    if (s.type === 'challenge') s.items.forEach((e) => ids.add(e.exerciseId))
  }
  return [...ids]
}

export function prescriptionText(p: Prescription): string {
  const parts: string[] = []
  if (p.seconds) parts.push(`${p.sets} × ${p.seconds} s`)
  else if (p.repsMin !== undefined && p.repsMax !== undefined)
    parts.push(`${p.sets} × ${p.repsMin === p.repsMax ? p.repsMin : `${p.repsMin}–${p.repsMax}`}`)
  else parts.push(`${p.sets} Sätze`)
  if (p.perSide) parts.push('je Seite')
  if (p.rir) parts.push(`${p.rir} RIR`)
  if (p.tempo) parts.push(`Tempo ${p.tempo}`)
  return parts.join(' · ')
}

export function segmentSummary(s: Segment): string {
  switch (s.type) {
    case 'warmup': return `Warm-up ${s.minutes} min`
    case 'cooldown': return `Cool-down ${s.minutes} min`
    case 'block': return s.kind === 'superset' ? `Supersatz ${s.label}` : `Block ${s.label}`
    case 'test': return `Test ${s.label}`
    case 'amrap': return `AMRAP ${s.minutes} min`
    case 'interval': return `Intervalle ${s.rounds} × ${s.workSec}/${s.restSec} s`
    case 'cardio': return `${s.label}: ${s.minutes} min`
    case 'challenge': return 'Challenge-Block'
    case 'note': return s.title
  }
}

// ---------- Challenge ----------
export interface ChallengeStatus {
  exerciseId: string
  label: string
  weekTarget: number
  done: number
  todayTarget: number
}

export function latestBenchmark(benchmarks: Benchmark[], key: string): number | undefined {
  const list = benchmarks.filter((b) => b.key === key && !b.deleted).sort((a, b) => (a.date < b.date ? 1 : -1))
  return list[0]?.value
}

export function challengeStatus(benchmarks: Benchmark[], weekSets: SetLog[], share: number): ChallengeStatus[] {
  return CHALLENGE_TARGETS.map((t) => {
    const bench = latestBenchmark(benchmarks, t.benchmarkKey)
    const weekTarget = Math.round((bench !== undefined ? bench * t.factor : t.fallback) / 10) * 10
    const done = weekSets.filter((s) => s.exerciseId === t.exerciseId && !s.deleted).reduce((a, s) => a + (s.reps ?? 0), 0)
    const todayTarget = share < 0 ? Math.max(0, weekTarget - done) : Math.round(weekTarget * share)
    return { exerciseId: t.exerciseId, label: t.label, weekTarget, done, todayTarget }
  })
}

// ---------- Progression ----------
export interface Suggestion {
  weightKg?: number
  text: string
}

/** Vorschlag aus der letzten Ausführung derselben Übung (letzte Einheit, keine Tests). */
export function suggestLoad(p: Prescription, history: SetLog[], loadType: string): Suggestion {
  const real = history.filter((s) => !s.isTest && !s.deleted && s.segmentLabel !== 'challenge')
  if (real.length === 0) {
    const first = loadType === 'bioforce'
      ? `Erste Ausführung: Last so wählen, dass am Satzende noch ${p.rir ?? '1–2'} saubere Wiederholungen möglich wären (RIR). Unten eintragen, wie viele tatsächlich noch gegangen wären.`
      : ''
    return { text: p.loadHint ? (first ? `${p.loadHint}. ${first}` : p.loadHint) : first }
  }
  const lastWorkoutId = real.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.setIndex - a.setIndex))[0].workoutId
  const last = real.filter((s) => s.workoutId === lastWorkoutId).sort((a, b) => a.setIndex - b.setIndex)
  const w = last.find((s) => s.weightKg !== undefined)?.weightKg
  const repsStr = last.map((s) => s.reps ?? (s.seconds ? `${s.seconds}s` : '–')).join('/')
  const base = `Letztes Mal: ${repsStr}${w !== undefined ? ` @ ${loadText(w, loadType)}` : ''}`
  if (p.ramp) return { weightKg: w, text: base }
  if (loadType === 'bioforce' && w !== undefined && p.repsMax) {
    const allTop = last.every((s) => (s.reps ?? 0) >= (p.repsMax ?? 0) && (s.rir ?? 9) <= 1)
    const nextLb = Math.min(BF_MAX_LB, kgToLb(w) + BF_STEP_LB)
    if (allTop) return { weightKg: lbToKg(nextLb), text: `${base} → alle Sätze am oberen Ende, Vorschlag ${nextLb} lb (eine Raste mehr)` }
    return { weightKg: w, text: `${base} → gleiche Last, mehr Wiederholungen` }
  }
  if (loadType === 'bodyweight' && p.repsMax) {
    const allTop = last.every((s) => (s.reps ?? 0) >= (p.repsMax ?? 0))
    return { text: allTop ? `${base} → schwerere Variante oder +2 Wiederholungen` : base }
  }
  return { weightKg: w, text: base }
}

export function epley1RM(weightKg: number, reps: number) {
  if (reps <= 1) return weightKg
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}
