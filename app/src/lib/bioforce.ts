import type { LoadType } from '../data/exercises'

// Die Skala an den Schwingarmen der Bio Force zeigt amerikanische Pfund pro Seite (5–125, beschriftet in 5er-Schritten,
// siehe Umrechnungstabelle der Finnlo-Anleitung). Einstellen lässt sie sich bis 100 lb in 2,5-lb-Rasten, darüber nur noch
// in 5-lb-Schritten (beides vom User am Gerät geprüft, 17.09. und 27.10.2026). Eingegeben und angezeigt wird der Skalenwert,
// gespeichert wird weiterhin weightKg (kg pro Seite), damit Export und Auswertung einheitlich bleiben.
export const BF_MIN_LB = 5
export const BF_MAX_LB = 125
export const BF_FINE_MAX_LB = 100 // bis hier 2,5-lb-Rasten, darüber 5 lb
export const BF_STEP_LB = 2.5 // eine Raste im feinen Bereich
export const BF_COARSE_STEP_LB = 5 // eine Raste über 100 lb
export const BF_PROGRESS_LB = 5 // üblicher Steigerungsschritt, kleine Übungen (smallStep) nur eine Raste
export const BF_SCALE_HINT = 'Wert am Schwingarm, 5–100 in 2,5er-Rasten, darüber in 5er-Schritten'
const KG_PER_LB = 0.45359

export const lbToKg = (lb: number) => Math.round(lb * KG_PER_LB * 100) / 100

const clampLb = (lb: number) => Math.min(BF_MAX_LB, Math.max(BF_MIN_LB, lb))

/** Rastengröße an einer Stelle der Skala; `dir` = −1 beim Abwärtsdrehen (von 100 geht es in 2,5ern weiter nach unten). */
export function bfStepAt(lb: number, dir: 1 | -1 = 1) {
  return (dir > 0 ? lb >= BF_FINE_MAX_LB : lb > BF_FINE_MAX_LB) ? BF_COARSE_STEP_LB : BF_STEP_LB
}

/** Nächste einstellbare Raste zu einem beliebigen lb-Wert (kaufmännisch gerundet, in den Skalenbereich geklemmt). */
export function snapLb(lb: number) {
  const step = lb > BF_FINE_MAX_LB ? BF_COARSE_STEP_LB : BF_STEP_LB
  return clampLb(Math.round(lb / step) * step)
}

/** Größte einstellbare Raste, die den Wert nicht überschreitet. */
export function floorLb(lb: number) {
  const step = lb > BF_FINE_MAX_LB ? BF_COARSE_STEP_LB : BF_STEP_LB
  return clampLb(Math.floor(lb / step) * step)
}

/** `n` Rasten weiter (negativ: zurück), ausgehend von einer gültigen Raste. */
export function stepLb(lb: number, n = 1) {
  let v = snapLb(lb)
  const dir: 1 | -1 = n < 0 ? -1 : 1
  for (let i = 0; i < Math.abs(n); i++) v = clampLb(v + dir * bfStepAt(v, dir))
  return v
}

/** Nächste Raste der Skala zu einer kg-Last. */
export const kgToLb = (kg: number) => snapLb(kg / KG_PER_LB)

export const fmtLb = (lb: number) => lb.toLocaleString('de-DE', { maximumFractionDigits: 1 })
export const fmtKg = (kg: number) => kg.toLocaleString('de-DE', { maximumFractionDigits: 1 })

/** Last als Text: Bio Force als Skalenwert in lb mit kg-Näherung, sonst kg. */
export function loadText(weightKg: number, loadType: LoadType | string) {
  if (loadType !== 'bioforce') return `${fmtKg(weightKg)} kg`
  return `${fmtLb(kgToLb(weightKg))} lb (≈ ${fmtKg(weightKg)} kg)`
}
