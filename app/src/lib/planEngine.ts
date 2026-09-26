import { EXERCISE_MAP } from '../data/exercises'
import { CHALLENGE_TARGETS, WEEKS, blockOfWeek, weekByNumber } from '../data/plan'
import { timedMinutes, type Prescription, type Segment, type Session, type TimedItem, type Week } from '../data/planTypes'
import type { Benchmark, SetLog } from '../db/types'
import { planWeekOf, weekday } from './dates'
import { BF_MAX_LB, BF_MIN_LB, BF_PROGRESS_LB, BF_STEP_LB, fmtLb, kgToLb, lbToKg, loadText } from './bioforce'

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
    if (s.type === 'measure') ids.add(s.exerciseId)
    // Warm-up und Cool-down zählen nicht zu den Übungen der Einheit; die Posten einer Mobility-Routine schon
    if (s.type === 'timed' && s.role === 'mobility') s.items.forEach((it) => { if (it.exerciseId) ids.add(it.exerciseId) })
  }
  return [...ids]
}

/** Text eines zeitgeführten Postens: Übungsname oder Titel, Vorgabe, Dauer. */
export function timedItemText(it: TimedItem): string {
  const name = it.exerciseId ? EXERCISE_MAP[it.exerciseId]?.name ?? it.exerciseId : it.title ?? ''
  const dur = it.perSide ? `${it.seconds} s je Seite` : `${it.seconds} s`
  return [name, it.reps, dur].filter(Boolean).join(' · ')
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
    case 'timed': return `${s.title} ${timedMinutes(s.items)} min`
    case 'measure': return `Messung ${s.label}`
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
  variant?: string // zuletzt verwendete Variante (vorbelegen)
  nextVariant?: string // nächste Stufe, wenn die letzte zu leicht war
}

/** Kleine Übungen (smallStep): so viele Wiederholungen über dem Ziel, bevor eine Raste (2,5 lb) dazukommt. */
const SMALL_STEP_EXTRA_REPS = 2

/** Auf die 2,5-lb-Raste runden. */
const roundLb = (lb: number) => Math.round(lb / BF_STEP_LB) * BF_STEP_LB

/** Alle Sätze haben das Ziel erreicht und überall waren 3 oder mehr Wiederholungen übrig: Last zu leicht. */
const tooLight = (sets: SetLog[], repsMax?: number) =>
  !!repsMax && sets.length > 0 && sets.every((s) => (s.reps ?? 0) >= repsMax && s.rir !== undefined && s.rir >= 3)

/** Vorschlag aus der letzten Ausführung derselben Übung (letzte Einheit, keine Tests). */
export function suggestLoad(p: Prescription, history: SetLog[], loadType: string, smallStep = false, variants?: string[]): Suggestion {
  const real = history.filter((s) => !s.isTest && !s.deleted && s.segmentLabel !== 'challenge')
  if (real.length === 0) {
    const first = loadType === 'bioforce'
      ? `Erste Ausführung: Last so wählen, dass am Satzende noch ${p.rir ?? '1–2'} saubere Wiederholungen möglich wären (RIR). Unten eintragen, wie viele tatsächlich noch gegangen wären.`
      : ''
    return { text: p.loadHint ? (first ? `${p.loadHint}. ${first}` : p.loadHint) : first }
  }
  const lastWorkoutId = real.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.setIndex - a.setIndex))[0].workoutId
  const last = real.filter((s) => s.workoutId === lastWorkoutId).sort((a, b) => a.setIndex - b.setIndex)
  const weights = last.map((s) => s.weightKg).filter((x): x is number => x !== undefined)
  const w = weights[0]
  const repsStr = last.map((s) => s.reps ?? (s.seconds ? `${s.seconds}s` : '–')).join('/')
  // Variante der letzten Ausführung (die des letzten Satzes, falls innerhalb der Einheit gewechselt wurde)
  const variant = variants ? (last[last.length - 1]?.variant ?? variants[0]) : undefined
  const base = `Letztes Mal: ${repsStr}${w !== undefined ? ` @ ${loadText(w, loadType)}` : ''}${variant && variant !== variants?.[0] ? ` (${variant})` : ''}`
  if (p.ramp) return { weightKg: w, text: base }
  // Letztes Mal war eine Einstufung (aufsteigende Sätze, Woche 1): der schwerste Satz ist das 10RM,
  // die Arbeitslast für die Aufbauwochen liegt zwei Rasten darunter (Plan-Hinweis Woche 2)
  if (loadType === 'bioforce' && new Set(weights).size > 1) {
    // War der schwerste Satz noch leicht (RIR eingetragen), wird das 10RM über Epley aus Wiederholungen + RIR geschätzt,
    // sonst hätte ein vorsichtig gewählter Einstufungssatz eine zu leichte Woche 2 zur Folge
    const top = last.filter((s) => s.weightKg !== undefined).sort((a, b) => b.weightKg! - a.weightKg!)[0]
    const topLb = kgToLb(top.weightKg!)
    const oneRM = epley1RM(top.weightKg!, (top.reps ?? 10) + (top.rir ?? 1))
    const tenRmLb = roundLb(kgToLb(oneRM / (1 + 10 / 30)))
    const startLb = Math.max(BF_MIN_LB, Math.min(BF_MAX_LB, tenRmLb - BF_PROGRESS_LB))
    const est = tenRmLb > topLb ? `, geschätztes 10RM ${fmtLb(tenRmLb)} lb (RIR ${top.rir ?? 1} eingerechnet)` : ''
    return { weightKg: lbToKg(startLb), text: `Einstufung: schwerster Satz ${fmtLb(topLb)} lb × ${top.reps ?? '–'}${est} → Start mit ${fmtLb(startLb)} lb, Ziel ${p.repsMax ?? ''} Wiederholungen mit ${p.rir ?? '1–2'} RIR. Fühlt sich der erste Satz nach 3+ RIR an: nächster Satz 5 lb mehr.` }
  }
  if (loadType === 'bioforce' && w !== undefined && p.repsMax && smallStep) {
    // Schon eine Raste (2,5 lb) ist hier ein großer Sprung: erst über Wiederholungen steigern, dann über die Last
    const goal = p.repsMax + SMALL_STEP_EXTRA_REPS
    const allOver = last.every((s) => (s.reps ?? 0) >= goal)
    const nextLb = Math.min(BF_MAX_LB, kgToLb(w) + BF_STEP_LB)
    if (allOver || tooLight(last, p.repsMax)) return { weightKg: lbToKg(nextLb), text: `${base} → ${allOver ? `alle Sätze mit ${goal}+ Wiederholungen` : 'Ziel erreicht mit 3+ RIR, also zu leicht'}, Vorschlag ${fmtLb(nextLb)} lb (eine Raste mehr), wieder bei ${p.repsMax} beginnen` }
    return { weightKg: w, text: `${base} → gleiche Last, Wiederholungen steigern. Erst bei ${goal} in allen Sätzen eine Raste (2,5 lb) mehr` }
  }
  if (loadType === 'bioforce' && w !== undefined && p.repsMax) {
    const allTop = last.every((s) => (s.reps ?? 0) >= (p.repsMax ?? 0) && (s.rir ?? 9) <= 1)
    const nextLb = Math.min(BF_MAX_LB, kgToLb(w) + BF_PROGRESS_LB)
    if (allTop) return { weightKg: lbToKg(nextLb), text: `${base} → alle Sätze am oberen Ende, Vorschlag ${fmtLb(nextLb)} lb (+${BF_PROGRESS_LB} lb; wenn das zu viel ist, nur eine Raste = +${fmtLb(BF_STEP_LB)} lb)` }
    if (tooLight(last, p.repsMax)) {
      // Ziel erreicht, aber überall 3+ RIR: die Last war zu leicht, gleich zwei Rasten mehr (bei 4+ auch mehr, siehe Hinweis am RIR-Feld)
      return { weightKg: lbToKg(nextLb), text: `${base} → Ziel erreicht mit 3+ RIR, also zu leicht. Vorschlag ${fmtLb(nextLb)} lb (+${BF_PROGRESS_LB} lb); bei 4+ RIR ruhig ${fmtLb(Math.min(BF_MAX_LB, nextLb + BF_PROGRESS_LB))} lb` }
    }
    return { weightKg: w, text: `${base} → gleiche Last, mehr Wiederholungen` }
  }
  if (loadType === 'bodyweight' && p.repsMax) {
    const allTop = last.every((s) => (s.reps ?? 0) >= (p.repsMax ?? 0))
    const easy = allTop && (tooLight(last, p.repsMax) || last.every((s) => s.rir === undefined))
    if (variants && variant !== undefined) {
      const idx = variants.indexOf(variant)
      const next = idx >= 0 && idx + 1 < variants.length ? variants[idx + 1] : undefined
      if (easy && next) return { text: `${base} → Ziel erreicht${tooLight(last, p.repsMax) ? ' mit 3+ RIR' : ''}, nächste Stufe: ${next}`, variant, nextVariant: next }
      if (allTop) return { text: `${base} → Ziel erreicht, ${next ? `bei ≤ 1 RIR noch einmal so, sonst nächste Stufe: ${next}` : 'schwerste Stufe, +2 Wiederholungen'}`, variant }
      return { text: base, variant }
    }
    return { text: allTop ? `${base} → schwerere Variante oder +2 Wiederholungen` : base }
  }
  return { weightKg: w, text: base, variant }
}

export function epley1RM(weightKg: number, reps: number) {
  if (reps <= 1) return weightKg
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}
