export interface Profile {
  id: string
  name: string
  birthYear?: number
  heightCm?: number
  sex?: 'm' | 'w'
  planStartDate: string // YYYY-MM-DD, Montag
  hrMax?: number
  createdAt: string
  updatedAt: string
  deleted?: boolean
}

export interface Settings {
  id: string // 'app'
  activeProfileId: string
  audio: boolean
  voice: boolean
}

export type WorkoutStatus = 'laufend' | 'fertig' | 'abgebrochen'

export interface Readiness {
  sleepH?: number
  soreness?: number // 0-10
  knee?: number // 0-10
  mood?: number // 1-5
}

export interface Workout {
  id: string
  profileId: string
  date: string
  week: number
  sessionKey: string
  title: string
  status: WorkoutStatus
  stepIndex?: number
  startedAt?: string
  finishedAt?: string
  durationMin?: number
  readiness?: Readiness
  notes?: string
  backfilled?: boolean
  updatedAt: string
  deleted?: boolean
}

export interface SetLog {
  id: string
  workoutId: string
  profileId: string
  date: string
  exerciseId: string
  segmentLabel: string
  setIndex: number
  reps?: number
  weightKg?: number // pro Seite bei Bio Force
  rir?: number
  seconds?: number
  rounds?: number
  distanceM?: number
  avgHr?: number
  side?: 'L' | 'R'
  isTest?: boolean
  note?: string
  updatedAt: string
  deleted?: boolean
}

export interface BodyMetric {
  id: string
  profileId: string
  date: string
  weightKg?: number
  waistCm?: number
  note?: string
  updatedAt: string
  deleted?: boolean
}

export interface Benchmark {
  id: string
  profileId: string
  date: string
  key: string
  value: number
  unit: string
  workoutId?: string
  updatedAt: string
  deleted?: boolean
}

export type Pose = 'vorne' | 'links' | 'rechts' | 'hinten'

/** Fortschrittsfoto des Foto-Checks. Das Bild liegt als JPEG-Blob in IndexedDB (verkleinert, s. lib/photos.ts). */
export interface ProgressPhoto {
  id: string
  profileId: string
  date: string
  pose: Pose
  blob: Blob
  width: number
  height: number
  bytes: number
  updatedAt: string
}
