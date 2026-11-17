import type { Week } from '../data/planTypes'
import type { Profile } from '../db/types'
import { mondayOf, weekdayOf, type PlanCal } from './dates'

// Plan an den Alltag anpassen, ohne den Plan-Code zu ändern (17.11.2026): Woche pausieren, Einheit auf einen
// anderen Wochentag legen. Reine Funktionen: Profil hinein, geändertes Profil heraus; gespeichert wird mit saveProfile().

/** Kalender des Profils für alle Datumsfunktionen (dates.ts). */
export const calOf = (p: Pick<Profile, 'planStartDate' | 'pauses' | 'moves'>): PlanCal => ({ start: p.planStartDate, pauses: p.pauses, moves: p.moves })

/** Kalenderwoche des Datums als Pause eintragen: die Planwoche, die dort läge, und alle folgenden rücken um sieben Tage. */
export function withPause(p: Profile, date: string): Profile {
  const monday = mondayOf(date)
  if (monday < p.planStartDate || p.pauses?.includes(monday)) return p
  return { ...p, pauses: [...(p.pauses ?? []), monday].sort() }
}

export function withoutPause(p: Profile, date: string): Profile {
  const monday = mondayOf(date)
  const pauses = (p.pauses ?? []).filter((x) => x !== monday)
  return { ...p, pauses: pauses.length ? pauses : undefined }
}

/**
 * Einheit auf einen anderen Wochentag ihrer Woche legen. Liegt dort schon eine Einheit, tauschen die beiden die Plätze.
 * Ein Eintrag, der dem Plan-Tag entspricht, wird entfernt, damit „moves“ nur echte Abweichungen enthält.
 */
export function withMove(p: Profile, week: Week, sessionKey: string, wd: number): Profile {
  const cal = calOf(p)
  const session = week.sessions.find((s) => s.key === sessionKey)
  if (!session || wd < 1 || wd > 7) return p
  const from = weekdayOf(session, cal)
  if (from === wd) return p
  const moves = { ...(p.moves ?? {}) }
  const other = week.sessions.find((s) => s.key !== sessionKey && weekdayOf(s, cal) === wd)
  const put = (key: string, planDay: number, day: number) => { if (day === planDay) delete moves[key]; else moves[key] = day }
  put(session.key, session.weekday, wd)
  if (other) put(other.key, other.weekday, from)
  return { ...p, moves: Object.keys(moves).length ? moves : undefined }
}

/** Alle Verschiebungen einer Woche zurücknehmen. */
export function withoutMoves(p: Profile, week: Week): Profile {
  const moves = { ...(p.moves ?? {}) }
  for (const s of week.sessions) delete moves[s.key]
  return { ...p, moves: Object.keys(moves).length ? moves : undefined }
}
