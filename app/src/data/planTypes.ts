export interface Prescription {
  exerciseId: string
  sets: number
  repsMin?: number
  repsMax?: number
  seconds?: number
  rir?: string // z. B. "1–2"
  tempo?: string
  perSide?: boolean
  loadHint?: string
  ramp?: boolean // Einstufung: aufsteigende Sätze, 10RM finden
  note?: string
}

/** Ein Posten eines zeitgeführten Ablaufs (Warm-up, Cool-down, Mobility): läuft mit Timer, danach geht es von selbst weiter. */
export interface TimedItem {
  exerciseId?: string // Übung aus der Bibliothek (Bild, Anleitung); ohne Übung nur ein Text (title)
  title?: string // Text statt Übung, z. B. „Pause“, „Gehen bis der Puls unter 100 ist“
  seconds: number // Dauer je Durchgang; bei perSide je Seite
  perSide?: boolean // läuft zweimal: erst links, dann rechts
  reps?: string // Vorgabe als Text, z. B. „10×“, „2 × 10 leicht“
  note?: string
}

export type TimedRole = 'warmup' | 'cooldown' | 'mobility'

export type Segment =
  | { type: 'timed'; role: TimedRole; title: string; items: TimedItem[] }
  | {
      type: 'measure' // Mobility-Check: ein Messwert in cm, gespeichert als Benchmark (bei perSide je Seite ein Schlüssel _L/_R)
      label: string
      exerciseId: string
      benchmarkKey: string
      unit: 'cm'
      perSide?: boolean
      description: string
      hint?: string
      allowNegative?: boolean
    }
  | {
      type: 'block'
      label: string
      kind: 'straight' | 'superset'
      exercises: Prescription[]
      restSec: number // Pause nach dem Satz (straight) bzw. nach dem Paar (superset)
      restBetweenSec?: number // Supersatz: Pause zwischen A1 und A2
      note?: string
    }
  | {
      type: 'test'
      label: string
      exerciseId: string
      benchmarkKey: string
      unit: 'reps' | 'seconds'
      description: string
      restSec: number
      followUp?: Prescription
    }
  | {
      type: 'amrap'
      label: string
      minutes: number
      exercises: { exerciseId: string; reps: number }[]
      countLabel: 'Runden' | 'Wiederholungen'
      benchmarkKey?: string
      description?: string
    }
  | {
      type: 'interval'
      label: string
      rounds: number
      workSec: number
      restSec: number
      exerciseId: string
      description: string
      alternative?: string
    }
  | {
      type: 'cardio'
      label: string
      minutes: number
      exerciseId: string
      description: string
      hrZone?: string
      alternative?: string
      benchmarkKey?: string
    }
  | {
      type: 'challenge'
      label: string
      description: string
      items: { exerciseId: string; share: number }[] // Anteil am Wochenziel
    }
  | { type: 'note'; title: string; text: string }

export type SessionKind = 'kraft' | 'cardio' | 'challenge' | 'mobility'

export interface Session {
  key: string
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7 // Routinen (Mobility) stehen außerhalb des Wochenplans und tragen 7
  title: string
  kind: SessionKind
  minutes: number
  focus: string
  segments: Segment[]
}

export interface Week {
  number: number
  title: string
  note?: string
  sessions: Session[]
}

export interface Block {
  number: number
  name: string
  weeks: number[]
  focus: string
  repRange: string
}

export interface ChallengeTarget {
  exerciseId: string
  label: string
  benchmarkKey: string
  factor: number
  fallback: number
}

/** Gesamtdauer eines zeitgeführten Ablaufs in Sekunden (perSide zählt doppelt). */
export const timedSeconds = (items: TimedItem[]) => items.reduce((a, it) => a + it.seconds * (it.perSide ? 2 : 1), 0)
export const timedMinutes = (items: TimedItem[]) => Math.round(timedSeconds(items) / 60)
