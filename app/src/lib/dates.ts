export const toISO = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
export const today = () => toISO(new Date())
export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
/** 1 = Montag … 7 = Sonntag */
export const weekday = (s: string) => {
  const w = parseISO(s).getDay()
  return w === 0 ? 7 : w
}
export const WEEKDAY_SHORT = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const WEEKDAY_LONG = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

export const fmtDate = (s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: '2-digit' }) =>
  parseISO(s).toLocaleDateString('de-DE', opts)
export const fmtDateLong = (s: string) => parseISO(s).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })

// ---------- Plan-Kalender ----------
// Der Plan läuft ab dem Startmontag Woche für Woche. Zwei Abweichungen kann der User selbst eintragen (17.11.2026):
// Pausenwochen (Kalenderwochen, in denen der Plan ruht; alle folgenden Planwochen rücken um sieben Tage) und
// verschobene Einheiten (anderer Wochentag innerhalb ihrer Planwoche). Beides steht am Profil (pauses, moves).

export interface PlanCal {
  start: string // Startmontag
  pauses?: string[] // Montage der Pausenwochen
  moves?: Record<string, number> // Einheit (key) → Wochentag 1–7, abweichend vom Plan
}
/** Überall, wo bisher der Startmontag genügte, geht auch der ganze Kalender. */
export type Cal = string | PlanCal
const asCal = (c: Cal): PlanCal => (typeof c === 'string' ? { start: c } : c)
export const calStart = (c: Cal) => asCal(c).start

const dayDiff = (from: string, to: string) => Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 86400000)
/** Montag der Kalenderwoche, in der das Datum liegt. */
export const mondayOf = (date: string) => addDays(date, 1 - weekday(date))
/** Pausen als Nummern der Kalenderwochen ab Planstart (0 = Startwoche). */
const pausedWeeks = (c: PlanCal) => new Set((c.pauses ?? []).map((p) => Math.floor(dayDiff(c.start, p) / 7)).filter((i) => i >= 0))

/** Liegt das Datum in einer Pausenwoche? */
export function isPausedDate(date: string, c: Cal) {
  const cal = asCal(c)
  const diff = dayDiff(cal.start, date)
  return diff >= 0 && pausedWeeks(cal).has(Math.floor(diff / 7))
}

/** Planwoche (1-basiert) für ein Datum; 0 = vor Planstart. In einer Pausenwoche: die Planwoche, die danach beginnt. */
export function planWeekOf(date: string, c: Cal) {
  const cal = asCal(c)
  const diff = dayDiff(cal.start, date)
  if (diff < 0) return 0
  const idx = Math.floor(diff / 7)
  let before = 0
  for (const p of pausedWeeks(cal)) if (p < idx) before++
  return idx - before + 1
}
export function mondayOfWeek(c: Cal, week: number) {
  const cal = asCal(c)
  const paused = pausedWeeks(cal)
  let idx = 0
  for (let n = 0; ; idx++) {
    if (paused.has(idx)) continue
    if (++n >= week) break
  }
  return addDays(cal.start, idx * 7)
}
export const dateOf = (c: Cal, week: number, wd: number) => addDays(mondayOfWeek(c, week), wd - 1)
/** Wochentag einer Einheit: der verschobene, sonst der aus dem Plan. */
export const weekdayOf = (s: { key: string; weekday: number }, c: Cal) => asCal(c).moves?.[s.key] ?? s.weekday

export const fmtSec = (s: number) => {
  const m = Math.floor(s / 60)
  const r = Math.max(0, Math.round(s % 60))
  return `${m}:${String(r).padStart(2, '0')}`
}
