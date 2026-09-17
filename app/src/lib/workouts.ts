import { v4 as uuid } from 'uuid'
import { db, now } from '../db/db'
import type { Benchmark, SetLog, Workout } from '../db/types'
import type { Session } from '../data/planTypes'

export async function findWorkout(profileId: string, sessionKey: string, date?: string) {
  const list = await db.workouts.where('[profileId+sessionKey]').equals([profileId, sessionKey]).toArray()
  const alive = list.filter((w) => !w.deleted)
  if (date) {
    const exact = alive.find((w) => w.date === date)
    if (exact) return exact
  }
  return alive.sort((a, b) => (a.date < b.date ? 1 : -1))[0]
}

export async function getOrCreateWorkout(profileId: string, date: string, week: number, session: Session): Promise<Workout> {
  const existing = await findWorkout(profileId, session.key, date)
  if (existing && existing.status !== 'abgebrochen') return existing
  const w: Workout = {
    id: uuid(), profileId, date, week, sessionKey: session.key, title: session.title, status: 'laufend', stepIndex: 0, startedAt: now(), updatedAt: now(),
  }
  await db.workouts.put(w)
  return w
}

export async function patchWorkout(id: string, patch: Partial<Workout>) {
  const w = await db.workouts.get(id)
  if (w) await db.workouts.put({ ...w, ...patch, updatedAt: now() })
}

/** Länger dauert keine Einheit: darüber wurde das Beenden vergessen oder die App lag stundenlang offen. */
const MAX_DURATION_MIN = 180

export async function finishWorkout(id: string) {
  const w = await db.workouts.get(id)
  if (!w) return
  const started = w.startedAt ? new Date(w.startedAt).getTime() : Date.now()
  const minutesUntil = (t: number) => Math.max(1, Math.round((t - started) / 60000))
  let durationMin = w.backfilled ? w.durationMin : minutesUntil(Date.now())
  if (!w.backfilled && durationMin !== undefined && durationMin > MAX_DURATION_MIN) {
    // Unplausibel lang: bis zum letzten gespeicherten Satz rechnen, sonst lieber keine Dauer als eine falsche
    const sets = (await db.sets.where('workoutId').equals(id).toArray()).filter((s) => !s.deleted)
    const lastSet = Math.max(0, ...sets.map((s) => new Date(s.updatedAt).getTime()))
    durationMin = lastSet > started && minutesUntil(lastSet) <= MAX_DURATION_MIN ? minutesUntil(lastSet) : undefined
  }
  await db.workouts.put({ ...w, status: 'fertig', finishedAt: now(), durationMin, updatedAt: now() })
}

/** Training samt Sätzen und Testwerten löschen (als gelöscht markiert, damit ein späterer Sync es mitbekommt). */
export async function deleteWorkout(id: string) {
  await db.transaction('rw', [db.workouts, db.sets, db.benchmarks], async () => {
    const w = await db.workouts.get(id)
    if (!w) return
    const t = now()
    await db.workouts.put({ ...w, deleted: true, updatedAt: t })
    const sets = await db.sets.where('workoutId').equals(id).toArray()
    await db.sets.bulkPut(sets.map((s) => ({ ...s, deleted: true, updatedAt: t })))
    const benchmarks = (await db.benchmarks.where('profileId').equals(w.profileId).toArray()).filter((b) => b.workoutId === id)
    await db.benchmarks.bulkPut(benchmarks.map((b) => ({ ...b, deleted: true, updatedAt: t })))
  })
}

export type SetInput = Omit<SetLog, 'id' | 'updatedAt' | 'profileId' | 'workoutId' | 'date'>

export async function saveSet(w: Workout, s: SetInput): Promise<SetLog> {
  // Ein bestehender Satz derselben Stelle wird überschrieben (z. B. beim Zurückgehen)
  const existing = (await db.sets.where('workoutId').equals(w.id).toArray()).find(
    (x) => x.exerciseId === s.exerciseId && x.segmentLabel === s.segmentLabel && x.setIndex === s.setIndex && x.side === s.side && !x.deleted,
  )
  const row: SetLog = { ...(existing ?? { id: uuid() }), ...s, workoutId: w.id, profileId: w.profileId, date: w.date, updatedAt: now() }
  await db.sets.put(row)
  return row
}

export async function saveBenchmark(w: Workout, key: string, value: number, unit: string): Promise<Benchmark> {
  const existing = (await db.benchmarks.where('[profileId+key]').equals([w.profileId, key]).toArray()).find((b) => b.workoutId === w.id && !b.deleted)
  const row: Benchmark = { ...(existing ?? { id: uuid() }), profileId: w.profileId, date: w.date, key, value, unit, workoutId: w.id, updatedAt: now() }
  await db.benchmarks.put(row)
  return row
}

export const BENCHMARK_LABELS: Record<string, string> = {
  pushupsMax: 'Push-Ups max',
  pullupsMax: 'Pull-Ups max',
  dipsMax: 'Dips max',
  plankMax: 'Plank max (s)',
  burpees5min: 'Burpees in 5 min',
  pushups5min: 'Push-Ups in 5 min',
  squats1min: 'Kniebeugen in 1 min',
  cooper12: 'Cooper-Test (m)',
  amrap6: 'AMRAP 6 min (Runden)',
  amrap8: 'AMRAP 8 min (Runden)',
  amrap12: 'AMRAP 12 min (Runden)',
}
