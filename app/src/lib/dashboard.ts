import { EXERCISE_MAP } from '../data/exercises'
import { BLOCKS, WEEKS } from '../data/plan'
import type { Session } from '../data/planTypes'
import type { Benchmark, SetLog, Workout } from '../db/types'
import { dateOf, mondayOfWeek, parseISO } from './dates'
import { sessionExerciseIds } from './planEngine'
import { isStrengthSet } from './stats'
import { BENCHMARK_LABELS } from './workouts'

// Kennzahlen für den Startbildschirm, als reine Funktionen wie in stats.ts.

const daysBetween = (from: string, to: string) => Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000)
const PLAN_DAYS = WEEKS.length * 7

/** Anteil des Plans, der vergangen ist (0–1), nach Tagen. */
export const planProgress = (date: string, start: string) => Math.min(1, Math.max(0, (daysBetween(start, date) + 1) / PLAN_DAYS))

export interface Totals { sessions: number; minutes: number }
export function totals(workouts: Workout[]): Totals {
  const done = workouts.filter((w) => !w.deleted && w.status === 'fertig')
  return { sessions: done.length, minutes: done.reduce((a, w) => a + (w.durationMin ?? 0), 0) }
}

/** Geplante Einheiten in Folge ohne Ausfall, rückwärts ab heute. Eine am Samstag nachgeholte Einheit zählt. */
export function sessionStreak(workouts: Workout[], start: string, date: string): number {
  const doneKeys = new Set(workouts.filter((w) => !w.deleted && w.status === 'fertig').map((w) => w.sessionKey))
  const planned = WEEKS.flatMap((week) => week.sessions.map((s) => ({ key: s.key, date: dateOf(start, week.number, s.weekday), weekEnd: dateOf(start, week.number, 7) })))
    .filter((s) => s.date <= date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  let streak = 0
  for (const s of planned) {
    if (doneKeys.has(s.key)) streak++
    else if (s.weekEnd >= date) continue // noch offen, kann diese Woche nachgeholt werden
    else break
  }
  return streak
}

/** Nächste Challenge-Woche (letzte Woche jedes Blocks). days = 0: läuft gerade. */
export function nextMilestone(date: string, start: string): { label: string; days: number; week: number } | undefined {
  for (const b of BLOCKS) {
    const week = b.weeks[b.weeks.length - 1]
    const monday = mondayOfWeek(start, week)
    const days = daysBetween(date, monday)
    if (days > 0) return { label: `Challenge-Woche ${b.number}`, days, week }
    if (days > -7) return { label: `Challenge-Woche ${b.number} läuft`, days: 0, week }
  }
  return undefined
}

/** „Letztes Mal“ für die erste Bio-Force-Übung der Einheit, zu der es schon Arbeitssätze gibt. */
export function lastPerformance(session: Session, sets: SetLog[]): { exerciseId: string; weightKg: number; reps: number[] } | undefined {
  for (const id of sessionExerciseIds(session)) {
    if (EXERCISE_MAP[id]?.loadType !== 'bioforce') continue
    const rows = sets.filter((s) => s.exerciseId === id && isStrengthSet(s) && !s.isTest && s.weightKg !== undefined && s.reps)
    if (rows.length === 0) continue
    const lastDate = rows.reduce((a, s) => (s.date > a ? s.date : a), '')
    const last = rows.filter((s) => s.date === lastDate).sort((a, b) => a.setIndex - b.setIndex)
    return { exerciseId: id, weightKg: Math.max(...last.map((s) => s.weightKg!)), reps: last.map((s) => s.reps!) }
  }
  return undefined
}

export interface RecordNews {
  date: string
  title: string
  kind: 'load' | 'benchmark'
  weightKg?: number
  reps?: number
  value?: number
  previous?: number
}

/** Jüngste Bestleistung: schwererer Satz an der Bio Force oder verbesserter Benchmark. Der erste Wert zählt nicht als Rekord. */
export function latestRecord(sets: SetLog[], benchmarks: Benchmark[]): RecordNews | undefined {
  let news: RecordNews | undefined
  const consider = (n: RecordNews) => { if (!news || n.date >= news.date) news = n }

  const byExercise = new Map<string, SetLog[]>()
  for (const s of sets) {
    if (!isStrengthSet(s) || s.weightKg === undefined || !s.reps || EXERCISE_MAP[s.exerciseId]?.loadType !== 'bioforce') continue
    byExercise.set(s.exerciseId, [...(byExercise.get(s.exerciseId) ?? []), s])
  }
  for (const [id, rows] of byExercise) {
    let best: SetLog | undefined
    for (const s of rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.setIndex - b.setIndex))) {
      const better = !best || s.weightKg! > best.weightKg! || (s.weightKg === best.weightKg && s.reps! > best.reps!)
      if (better && best && s.date > best.date && s.weightKg! > best.weightKg!) consider({ date: s.date, title: EXERCISE_MAP[id].name, kind: 'load', weightKg: s.weightKg, reps: s.reps })
      if (better) best = s
    }
  }

  const byKey = new Map<string, Benchmark[]>()
  for (const b of benchmarks) if (!b.deleted) byKey.set(b.key, [...(byKey.get(b.key) ?? []), b])
  for (const [key, rows] of byKey) {
    let best: number | undefined
    for (const b of rows.sort((a, c) => (a.date < c.date ? -1 : 1))) {
      if (best !== undefined && b.value > best) consider({ date: b.date, title: BENCHMARK_LABELS[key] ?? key, kind: 'benchmark', value: b.value, previous: best })
      best = best === undefined ? b.value : Math.max(best, b.value)
    }
  }
  return news
}

/** Letzter Kniewert aus dem Kurz-Check. */
export function latestKnee(workouts: Workout[]): number | undefined {
  const rows = workouts.filter((w) => !w.deleted && w.readiness?.knee !== undefined).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.updatedAt < b.updatedAt ? 1 : -1))
  return rows[0]?.readiness?.knee
}
