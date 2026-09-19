import Dexie, { type EntityTable } from 'dexie'
import type { BodyMetric, Benchmark, Profile, ProgressPhoto, SetLog, Settings, Workout } from './types'

export class FitDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>
  settings!: EntityTable<Settings, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  sets!: EntityTable<SetLog, 'id'>
  body!: EntityTable<BodyMetric, 'id'>
  benchmarks!: EntityTable<Benchmark, 'id'>
  photos!: EntityTable<ProgressPhoto, 'id'>

  constructor() {
    super('transformation16')
    this.version(1).stores({
      profiles: 'id',
      settings: 'id',
      workouts: 'id, profileId, date, [profileId+date], [profileId+week], [profileId+sessionKey]',
      sets: 'id, workoutId, profileId, exerciseId, [profileId+exerciseId], date',
      body: 'id, profileId, date, [profileId+date]',
      benchmarks: 'id, profileId, key, [profileId+key]',
    })
    // Version 2 (19.09.2026): Fortschrittsfotos. Nur neue Tabelle, keine Datenwanderung.
    this.version(2).stores({
      photos: 'id, profileId, date, [profileId+date]',
    })
  }
}

export const db = new FitDB()
export const now = () => new Date().toISOString()
