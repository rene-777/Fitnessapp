import type { LoadType } from '../data/exercises'

// Die Skala an den Schwingarmen der Bio Force zeigt amerikanische Pfund pro Seite (5–125, beschriftet in 5er-Schritten,
// siehe Umrechnungstabelle der Finnlo-Anleitung). Einstellen lässt sie sich in 2,5-lb-Rasten (vom User am Gerät geprüft). Eingegeben und angezeigt wird der Skalenwert,
// gespeichert wird weiterhin weightKg (kg pro Seite), damit Export und Auswertung einheitlich bleiben.
export const BF_MIN_LB = 5
export const BF_MAX_LB = 125
export const BF_STEP_LB = 2.5 // eine Raste
export const BF_PROGRESS_LB = 5 // üblicher Steigerungsschritt, kleine Übungen (smallStep) nur eine Raste
const KG_PER_LB = 0.45359

export const lbToKg = (lb: number) => Math.round(lb * KG_PER_LB * 100) / 100

/** Nächste Raste der Skala zu einer kg-Last. */
export function kgToLb(kg: number) {
  const lb = Math.round(kg / KG_PER_LB / BF_STEP_LB) * BF_STEP_LB
  return Math.min(BF_MAX_LB, Math.max(BF_MIN_LB, lb))
}

export const fmtLb = (lb: number) => lb.toLocaleString('de-DE', { maximumFractionDigits: 1 })
export const fmtKg = (kg: number) => kg.toLocaleString('de-DE', { maximumFractionDigits: 1 })

/** Last als Text: Bio Force als Skalenwert in lb mit kg-Näherung, sonst kg. */
export function loadText(weightKg: number, loadType: LoadType | string) {
  if (loadType !== 'bioforce') return `${fmtKg(weightKg)} kg`
  return `${fmtLb(kgToLb(weightKg))} lb (≈ ${fmtKg(weightKg)} kg)`
}
