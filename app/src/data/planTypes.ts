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

export type Segment =
  | { type: 'warmup'; minutes: number; items: string[] }
  | { type: 'cooldown'; minutes: number; items: string[] }
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

export type SessionKind = 'kraft' | 'cardio' | 'challenge'

export interface Session {
  key: string
  weekday: 1 | 2 | 3 | 4 | 5 | 6
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
