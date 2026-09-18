import { EXERCISE_MAP } from '../data/exercises'
import { MUSCLE_GROUPS, type MuscleKey } from '../data/muscles'
import { weekByNumber } from '../data/plan'
import type { Benchmark, SetLog, Workout } from '../db/types'
import { planWeekOf } from './dates'
import { isFreeWorkout } from './workouts'

// Auswertung: reine Funktionen über die gespeicherten Zeilen, damit die Seite nur noch darstellt.
// Volumen zählt Sätze (primär 1, sekundär 0,5), nicht kg: an der Bio Force ist die Last pro Übung
// wegen der Hebel nicht vergleichbar, die Satzzahl schon.

const NON_STRENGTH_PREFIX = ['amrap-', 'interval-', 'cardio-']

/** Kraftsatz = Satz aus einem Block oder Test, nicht AMRAP, Intervall, Cardio oder Challenge. */
export function isStrengthSet(s: SetLog): boolean {
  if (s.deleted) return false
  if (s.segmentLabel === 'challenge' || NON_STRENGTH_PREFIX.some((p) => s.segmentLabel.startsWith(p))) return false
  const e = EXERCISE_MAP[s.exerciseId]
  return !!e && e.category !== 'cardio' && e.category !== 'warmup'
}

const GROUP_OF = new Map<MuscleKey, string>()
for (const [group, keys] of Object.entries(MUSCLE_GROUPS)) keys.forEach((k) => GROUP_OF.set(k, group))
export const GROUP_NAMES = Object.keys(MUSCLE_GROUPS)

/** Sätze pro Muskelgruppe für eine Planwoche. Zählt eine Gruppe pro Satz nur einmal (höchster Anteil). */
export function volumeByGroup(sets: SetLog[], start: string, week: number): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(GROUP_NAMES.map((g) => [g, 0]))
  for (const s of sets) {
    if (!isStrengthSet(s) || planWeekOf(s.date, start) !== week) continue
    const e = EXERCISE_MAP[s.exerciseId]
    const share = new Map<string, number>()
    for (const m of e.secondary) { const g = GROUP_OF.get(m); if (g) share.set(g, 0.5) }
    for (const m of e.primary) { const g = GROUP_OF.get(m); if (g) share.set(g, 1) }
    for (const [g, v] of share) out[g] += v
  }
  return out
}

// ---------- Gesamtwiederholungen ----------
export const REP_GROUPS: { key: string; label: string; ids: string[] }[] = [
  { key: 'burpees', label: 'Burpees', ids: ['burpee'] },
  { key: 'pushups', label: 'Push-Ups', ids: ['pushup', 'pushup-defizit', 'plyo-pushup'] },
  { key: 'pullups', label: 'Pull-Ups', ids: ['pullup'] },
  { key: 'dips', label: 'Dips', ids: ['dips'] },
  { key: 'squats', label: 'Kniebeugen', ids: ['kniebeuge-bw'] },
]

/** Wiederholungen je Gruppe und Planwoche, über alle Satzarten (Blöcke, Tests, AMRAP-Summen, Challenge). */
export function repsByWeek(sets: SetLog[], start: string): Map<number, Record<string, number>> {
  const out = new Map<number, Record<string, number>>()
  for (const s of sets) {
    if (s.deleted || !s.reps) continue
    const g = REP_GROUPS.find((x) => x.ids.includes(s.exerciseId))
    if (!g) continue
    const week = planWeekOf(s.date, start)
    const row = out.get(week) ?? Object.fromEntries(REP_GROUPS.map((x) => [x.key, 0]))
    row[g.key] += s.reps
    out.set(week, row)
  }
  return out
}

// ---------- Benchmarks ----------
export interface BenchmarkSeries {
  key: string
  unit: string // 'reps' | 'seconds' | 'meters' | 'rounds', wie beim Test gespeichert
  points: { date: string; value: number }[]
  first: number
  latest: number
  best: number
}

export function benchmarkSeries(benchmarks: Benchmark[]): BenchmarkSeries[] {
  const byKey = new Map<string, Benchmark[]>()
  for (const b of benchmarks) if (!b.deleted) byKey.set(b.key, [...(byKey.get(b.key) ?? []), b])
  return [...byKey.entries()].map(([key, rows]) => {
    const points = rows.sort((a, b) => (a.date < b.date ? -1 : 1)).map((b) => ({ date: b.date, value: b.value }))
    return { key, unit: rows[rows.length - 1].unit, points, first: points[0].value, latest: points[points.length - 1].value, best: Math.max(...points.map((p) => p.value)) }
  })
}

// ---------- Bestleistungen an der Bio Force ----------
export interface LoadRecord {
  exerciseId: string
  weightKg: number
  reps: number
  date: string
  firstWeightKg: number
}

/** Schwerster Satz je Bio-Force-Übung (bei gleicher Last der mit mehr Wiederholungen), dazu die erste Arbeitslast. */
export function loadRecords(sets: SetLog[]): LoadRecord[] {
  const out = new Map<string, LoadRecord>()
  const sorted = sets.filter((s) => isStrengthSet(s) && s.weightKg !== undefined && s.reps).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.setIndex - b.setIndex))
  for (const s of sorted) {
    if (EXERCISE_MAP[s.exerciseId]?.loadType !== 'bioforce') continue
    const cur = out.get(s.exerciseId)
    if (!cur) { out.set(s.exerciseId, { exerciseId: s.exerciseId, weightKg: s.weightKg!, reps: s.reps!, date: s.date, firstWeightKg: s.weightKg! }); continue }
    if (s.weightKg! > cur.weightKg || (s.weightKg === cur.weightKg && s.reps! > cur.reps)) out.set(s.exerciseId, { ...cur, weightKg: s.weightKg!, reps: s.reps!, date: s.date })
  }
  return [...out.values()].sort((a, b) => b.weightKg - a.weightKg)
}

// ---------- Frequenz ----------
export interface WeekFrequency {
  week: number
  planned: number
  done: number
  minutes: number
}

export function frequencyByWeek(workouts: Workout[], start: string, upToWeek: number): WeekFrequency[] {
  const out: WeekFrequency[] = []
  for (let week = 1; week <= upToWeek; week++) {
    const rows = workouts.filter((w) => !w.deleted && !isFreeWorkout(w) && w.status === 'fertig' && planWeekOf(w.date, start) === week)
    out.push({ week, planned: weekByNumber(week)?.sessions.length || 5, done: new Set(rows.map((w) => w.sessionKey)).size, minutes: rows.reduce((a, w) => a + (w.durationMin ?? 0), 0) })
  }
  return out
}

// ---------- Cardio und Kurz-Check ----------
export interface CardioPoint {
  date: string
  exerciseId: string
  minutes?: number
  distanceM?: number
  avgHr?: number
  paceMinPerKm?: number
}

export function cardioPoints(sets: SetLog[]): CardioPoint[] {
  return sets
    .filter((s) => !s.deleted && s.segmentLabel.startsWith('cardio-') && (s.avgHr || s.distanceM))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => {
      const minutes = s.seconds ? s.seconds / 60 : undefined
      const paceMinPerKm = minutes && s.distanceM ? Math.round((minutes / (s.distanceM / 1000)) * 100) / 100 : undefined
      return { date: s.date, exerciseId: s.exerciseId, minutes, distanceM: s.distanceM, avgHr: s.avgHr, paceMinPerKm }
    })
}

export function readinessPoints(workouts: Workout[]) {
  return workouts
    .filter((w) => !w.deleted && w.readiness && Object.keys(w.readiness).length > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((w) => ({ date: w.date, ...w.readiness }))
}
