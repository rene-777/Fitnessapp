import { MOBILITY_CHECK_KEY, MOBILITY_CHECK_WEEKS, MOBILITY_ROUTINES, suggestedRoutine } from '../data/mobility'
import type { Session } from '../data/planTypes'
import type { Workout } from '../db/types'
import { addDays, mondayOfWeek, planWeekOf, weekday } from './dates'
import { isMobilityWorkout } from './workouts'

// Reine Funktionen rund um Mobility: Check-Termine, Routinen-Status, Vorschlag für heute.

export type CheckState = 'fertig' | 'faellig' | 'offen'
export interface MobilityCheck { week: number; label: string; from: string; to: string; status: CheckState; doneDate?: string }

/** Mobility-Check je Termin: Woche 1 (Basis), dann die Challenge-Wochen 4, 8, 12, 16. Fenster = Montag bis Sonntag der Woche. */
export function mobilityCheckStatus(start: string, workouts: Workout[], today: string): MobilityCheck[] {
  const done = workouts.filter((w) => !w.deleted && w.sessionKey === MOBILITY_CHECK_KEY && w.status === 'fertig').map((w) => w.date)
  return MOBILITY_CHECK_WEEKS.map((week) => {
    const from = mondayOfWeek(start, week)
    const to = addDays(from, 6)
    const doneDate = done.find((d) => d >= from && d <= to)
    const label = week === 1 ? 'Basis' : `Woche ${week}`
    if (doneDate) return { week, label, from, to, status: 'fertig', doneDate }
    return { week, label, from, to, status: today >= from ? 'faellig' : 'offen' }
  })
}

/** Der Check, der jetzt ansteht (fällig und noch nicht erledigt), sonst undefined. */
export function dueMobilityCheck(start: string, workouts: Workout[], today: string): MobilityCheck | undefined {
  return mobilityCheckStatus(start, workouts, today).find((c) => c.status === 'faellig' && today <= c.to)
}

/** Letztes Datum je Routine und Anzahl in der laufenden Planwoche. */
export function routineStatus(workouts: Workout[], start: string, today: string) {
  const rows = workouts.filter((w) => !w.deleted && isMobilityWorkout(w) && w.sessionKey !== MOBILITY_CHECK_KEY && w.status === 'fertig')
  const last: Record<string, string | undefined> = {}
  for (const w of rows) if (!last[w.sessionKey] || w.date > last[w.sessionKey]!) last[w.sessionKey] = w.date
  const week = planWeekOf(today, start)
  const thisWeek = rows.filter((w) => planWeekOf(w.date, start) === week).length
  const doneToday = rows.filter((w) => w.date === today).map((w) => w.sessionKey)
  return { last, thisWeek, doneToday }
}

/** Vorschlag für heute: Samstag Hüfte, Sonntag Schulter, sonst die Routine, die länger zurückliegt. */
export function todaysRoutine(today: string, last: Record<string, string | undefined>): Session {
  return suggestedRoutine(weekday(today), last)
}

export const otherRoutine = (s: Session) => MOBILITY_ROUTINES.find((r) => r.key !== s.key) ?? s
