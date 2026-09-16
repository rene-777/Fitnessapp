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

/** Planwoche (1-basiert) für ein Datum; 0 = vor Planstart */
export function planWeekOf(date: string, start: string) {
  const diff = Math.round((parseISO(date).getTime() - parseISO(start).getTime()) / 86400000)
  if (diff < 0) return 0
  return Math.floor(diff / 7) + 1
}
export const mondayOfWeek = (start: string, week: number) => addDays(start, (week - 1) * 7)
export const dateOf = (start: string, week: number, wd: number) => addDays(start, (week - 1) * 7 + (wd - 1))

export const fmtSec = (s: number) => {
  const m = Math.floor(s / 60)
  const r = Math.max(0, Math.round(s % 60))
  return `${m}:${String(r).padStart(2, '0')}`
}
