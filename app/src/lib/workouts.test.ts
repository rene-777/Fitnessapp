import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { findSession } from '../data/plan'
import { ACCUMULATOR_BURPEES_KEY, ACCUMULATOR_KEY } from '../data/accumulator'
import { exportAll, importDump } from './exportImport'
import { totals } from './dashboard'
import { frequencyByWeek } from './stats'
import { deleteSet, deleteWorkout, finishWorkout, getOrCreateFreeWorkout, getOrCreateWorkout, saveBenchmark, saveSet, saveSetNote, saveWorkoutNote, withoutEmpty } from './workouts'

const P = 'profil'
const session = findSession('w9-pull')!.session
const aliveSets = async () => (await db.sets.toArray()).filter((s) => !s.deleted)
const aliveBenchmarks = async () => (await db.benchmarks.toArray()).filter((b) => !b.deleted)

beforeEach(async () => {
  await Promise.all([db.workouts.clear(), db.sets.clear(), db.benchmarks.clear(), db.body.clear(), db.profiles.clear()])
})

describe('Sätze speichern', () => {
  it('derselbe Platz (Übung, Abschnitt, Satznummer) wird überschrieben, ein anderer angelegt', async () => {
    const w = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    const a = await saveSet(w, { exerciseId: 'rdl', segmentLabel: 'B', setIndex: 1, reps: 8 })
    const b = await saveSet(w, { exerciseId: 'rdl', segmentLabel: 'B', setIndex: 1, reps: 7, note: 'korrigiert' })
    await saveSet(w, { exerciseId: 'rdl', segmentLabel: 'B', setIndex: 2, reps: 6 })
    expect(b.id).toBe(a.id)
    const sets = await aliveSets()
    expect(sets.length).toBe(2)
    expect(sets.find((s) => s.setIndex === 1)).toMatchObject({ reps: 7, note: 'korrigiert', date: '2026-11-18', profileId: P })
  })

  it('Bemerkungen zu Satz und Einheit: gespeichert ohne Rand-Leerzeichen, leer entfernt sie', async () => {
    const w = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    const s = await saveSet(w, { exerciseId: 'rdl', segmentLabel: 'B', setIndex: 1, reps: 8 })
    await saveSetNote(s.id, '  Schulter zieht ')
    await saveWorkoutNote(w.id, ' müde ')
    expect((await db.sets.get(s.id))?.note).toBe('Schulter zieht')
    expect((await db.sets.get(s.id))?.reps).toBe(8)
    expect((await db.workouts.get(w.id))?.notes).toBe('müde')
    await saveSetNote(s.id, '   ')
    expect((await db.sets.get(s.id))?.note).toBeUndefined()
  })

  it('Accumulator: aus der angesagten Zahl entstehen Burpee-Benchmark und Burpee-Satz; Löschen des Tests nimmt beides mit', async () => {
    const w = await getOrCreateWorkout(P, '2026-11-20', 9, findSession('w9-acc')!.session)
    const test = await saveSet(w, { exerciseId: 'accumulator', segmentLabel: 'A', setIndex: 1, reps: 44, isTest: true })
    await saveBenchmark(w, ACCUMULATOR_KEY, 44, 'reps')
    const bm = await aliveBenchmarks()
    expect(bm.find((b) => b.key === ACCUMULATOR_KEY)?.value).toBe(44)
    expect(bm.find((b) => b.key === ACCUMULATOR_BURPEES_KEY)?.value).toBe(75)
    expect((await aliveSets()).find((s) => s.exerciseId === 'burpee')?.reps).toBe(75)
    // Korrektur des Testwerts legt nichts doppelt an
    await saveBenchmark(w, ACCUMULATOR_KEY, 45, 'reps')
    expect((await aliveBenchmarks()).length).toBe(2)
    expect((await aliveSets()).find((s) => s.exerciseId === 'burpee')?.reps).toBe(77)
    await deleteSet(test.id)
    expect(await aliveSets()).toEqual([])
    expect(await aliveBenchmarks()).toEqual([])
  })
})

describe('Training zu einer Einheit holen', () => {
  it('laufendes Training mit Sätzen wird fortgesetzt, auch an einem anderen Tag', async () => {
    const w = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    await saveSet(w, { exerciseId: 'pullup', segmentLabel: 'A', setIndex: 1, reps: 6 })
    expect((await getOrCreateWorkout(P, '2026-11-19', 9, session)).id).toBe(w.id)
  })

  it('leere Trainings werden wiederverwendet, überzählige gelöscht', async () => {
    const a = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    await finishWorkout(a.id) // versehentlich beendet, ohne Sätze
    await db.workouts.put({ ...a, id: 'zweites-leeres', date: '2026-11-17', status: 'laufend' })
    const again = await getOrCreateWorkout(P, '2026-11-19', 9, session)
    expect(again).toMatchObject({ status: 'laufend', date: '2026-11-19', stepIndex: 0 })
    expect(again.finishedAt).toBeUndefined()
    expect((await db.workouts.toArray()).filter((w) => !w.deleted).length).toBe(1)
  })

  it('fertiges Training mit Sätzen wird nur angesehen, nicht neu angelegt', async () => {
    const w = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    await saveSet(w, { exerciseId: 'pullup', segmentLabel: 'A', setIndex: 1, reps: 6 })
    await finishWorkout(w.id)
    const again = await getOrCreateWorkout(P, '2026-11-25', 10, session)
    expect(again.id).toBe(w.id)
    expect(again.status).toBe('fertig')
  })

  it('Löschen nimmt Sätze und Testwerte mit', async () => {
    const w = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    await saveSet(w, { exerciseId: 'pullup', segmentLabel: 'A', setIndex: 1, reps: 15, isTest: true })
    await saveBenchmark(w, 'pullupsMax', 15, 'reps')
    await deleteWorkout(w.id)
    expect(await aliveSets()).toEqual([])
    expect(await aliveBenchmarks()).toEqual([])
    expect((await db.workouts.get(w.id))?.deleted).toBe(true)
  })
})

describe('Zählung', () => {
  it('leere Plan-Trainings und freies Training zählen nicht als Einheit', async () => {
    const start = '2026-09-21'
    const full = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    await saveSet(full, { exerciseId: 'pullup', segmentLabel: 'A', setIndex: 1, reps: 6 })
    await finishWorkout(full.id)
    const empty = await getOrCreateWorkout(P, '2026-11-16', 9, findSession('w9-beine')!.session)
    await finishWorkout(empty.id)
    const free = await getOrCreateFreeWorkout(P, '2026-11-17', 9)
    await saveSet(free, { exerciseId: 'plank', segmentLabel: 'frei', setIndex: 1, seconds: 90 })
    const counted = withoutEmpty(await db.workouts.toArray(), await db.sets.toArray())
    expect(totals(counted).sessions).toBe(1)
    expect(frequencyByWeek(counted, start, 9)[8]).toMatchObject({ week: 9, done: 1, planned: 5 })
  })
})

describe('Export und Import', () => {
  it('Import ergänzt Unbekanntes, das Neuere gewinnt, Älteres überschreibt nichts', async () => {
    const w = await getOrCreateWorkout(P, '2026-11-18', 9, session)
    const s = await saveSet(w, { exerciseId: 'rdl', segmentLabel: 'B', setIndex: 1, reps: 8, note: 'vom Handy' })
    const dump = await exportAll()
    // Auf dem „anderen Gerät“: Satz geändert (neuer), Training fehlt
    await db.workouts.clear()
    await db.sets.put({ ...s, reps: 9, updatedAt: '2999-01-01T00:00:00.000Z' })
    const res = await importDump(dump)
    expect(res).toEqual({ added: 1, updated: 0 })
    expect((await db.sets.get(s.id))?.reps).toBe(9)
    expect((await db.workouts.get(w.id))?.sessionKey).toBe('w9-pull')
    // Umgekehrt: lokaler Stand älter als die Sicherung
    await db.sets.put({ ...s, reps: 5, updatedAt: '2000-01-01T00:00:00.000Z' })
    expect((await importDump(dump)).updated).toBe(1)
    expect(await db.sets.get(s.id)).toMatchObject({ reps: 8, note: 'vom Handy' })
    await expect(importDump('{"app":"etwas anderes"}')).rejects.toThrow()
  })
})
