// Gewichtstrend: Wochenmittel statt Tageswert, Trend in kg/Woche gegen einen Zielkorridor.
// Hintergrund (18.10.2026): Der User steuert ein späteres Defizit über die Waage, nicht über Kalorien-Tracking.
// Tageswerte schwanken verdauungsbedingt um ±1 kg, deshalb zählen nur 7-Tage-Mittel und der Trend über 14 Tage.
import { addDays } from './dates'

export type Goal = 'erhalt' | 'defizit' | 'aufbau'

export const GOAL_LABEL: Record<Goal, string> = { erhalt: 'Erhalt', defizit: 'Defizit', aufbau: 'Aufbau' }

/** Zielkorridor in kg pro Woche [min, max]. Defizit: −0,25 bis −0,4 (mehr kostet Muskel), Erhalt: ±0,25, Aufbau: +0,1 bis +0,25. */
export const CORRIDOR: Record<Goal, [number, number]> = { erhalt: [-0.25, 0.25], defizit: [-0.4, -0.25], aufbau: [0.1, 0.25] }

/** Mindestzahl Wiegungen je 7-Tage-Fenster, bevor ein Mittel gezeigt wird. */
export const MIN_PER_WEEK = 3

export type TrendStatus = 'zu_wenig' | 'im_korridor' | 'zu_langsam' | 'zu_schnell' | 'faellt' | 'steigt'

export interface WeightTrend {
  /** Mittel der letzten 7 Tage (heute und 6 Tage davor), undefined bei weniger als MIN_PER_WEEK Werten. */
  mean7?: number
  n7: number
  /** Mittel der 7 Tage davor. */
  meanPrev?: number
  nPrev: number
  /** Trend in kg/Woche: Steigung der Regressionsgeraden über die Einträge der letzten 14 Tage. */
  perWeek?: number
  status: TrendStatus
  /** Kurzer Hinweis für die Karte. */
  text: string
}

interface Entry { date: string; weightKg?: number; deleted?: boolean }

const round1 = (n: number) => Math.round(n * 10) / 10
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Steigung in kg/Tag über (Tagindex, kg); undefined, wenn alle Punkte am selben Tag liegen. */
function slopePerDay(points: { x: number; y: number }[]): number | undefined {
  if (points.length < 2) return undefined
  const mx = mean(points.map((p) => p.x))
  const my = mean(points.map((p) => p.y))
  const sxx = points.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  if (sxx === 0) return undefined
  return points.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / sxx
}

export const fmtPerWeek = (kg: number) => `${kg > 0 ? '+' : kg < 0 ? '−' : '±'}${Math.abs(kg).toFixed(2).replace('.', ',')} kg/Woche`

export function weightTrend(entries: Entry[], goal: Goal, today: string): WeightTrend {
  const rows = entries.filter((e) => !e.deleted && e.weightKg && e.date <= today)
  const from7 = addDays(today, -6)
  const fromPrev = addDays(today, -13)
  const cur = rows.filter((e) => e.date >= from7)
  const prev = rows.filter((e) => e.date >= fromPrev && e.date < from7)
  const n7 = cur.length
  const nPrev = prev.length
  const mean7 = n7 >= MIN_PER_WEEK ? round1(mean(cur.map((e) => e.weightKg!))) : undefined
  const meanPrev = nPrev >= MIN_PER_WEEK ? round1(mean(prev.map((e) => e.weightKg!))) : undefined

  let perWeek: number | undefined
  if (mean7 !== undefined && meanPrev !== undefined) {
    const base = new Date(fromPrev + 'T00:00:00').getTime()
    const pts = [...prev, ...cur].map((e) => ({ x: Math.round((new Date(e.date + 'T00:00:00').getTime() - base) / 86_400_000), y: e.weightKg! }))
    const s = slopePerDay(pts)
    perWeek = s === undefined ? undefined : Math.round(s * 7 * 100) / 100
  }

  if (perWeek === undefined) {
    const missing = mean7 === undefined ? `diese Woche ${n7}/${MIN_PER_WEEK}` : `Vorwoche ${nPrev}/${MIN_PER_WEEK}`
    return { mean7, n7, meanPrev, nPrev, status: 'zu_wenig', text: `Noch zu wenig Wiegungen (${missing}). Morgens nach der Toilette wiegen, mindestens dreimal pro Woche.` }
  }

  const [lo, hi] = CORRIDOR[goal]
  const t = fmtPerWeek(perWeek)
  let status: TrendStatus
  let text: string
  if (perWeek >= lo && perWeek <= hi) {
    status = 'im_korridor'
    text = goal === 'erhalt' ? `Stabil (${t}). Passt für Erhalt.` : goal === 'defizit' ? `Im Korridor (${t}). So weiter essen.` : `Im Korridor (${t}). Passt für Aufbau.`
  } else if (goal === 'erhalt') {
    status = perWeek < lo ? 'faellt' : 'steigt'
    text = perWeek < lo ? `Fällt (${t}). Für Erhalt etwas mehr essen, sonst leidet der Aufbau.` : `Steigt (${t}). Eine feste Stellschraube kleiner, z. B. Snacks oder Abendbeilage.`
  } else if (goal === 'defizit') {
    status = perWeek > hi ? 'zu_langsam' : 'zu_schnell'
    text = perWeek > hi
      ? `Fällt nicht genug (${t}). Bleibt es zwei Wochen so: zweite Stellschraube dazu (≈ 300 kcal).`
      : `Fällt zu schnell (${t}). Eine Stellschraube zurück, sonst kostet es Muskel.`
  } else {
    status = perWeek < lo ? 'zu_langsam' : 'zu_schnell'
    text = perWeek < lo ? `Steigt nicht (${t}). Etwas mehr essen, vor allem um das Training.` : `Steigt zu schnell (${t}). Das ist überwiegend Fett, Portionen leicht zurück.`
  }
  return { mean7, n7, meanPrev, nPrev, perWeek, status, text }
}
