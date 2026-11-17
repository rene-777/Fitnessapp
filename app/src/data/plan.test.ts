import { describe, expect, it } from 'vitest'
import { EXERCISES, EXERCISE_MAP } from './exercises'
import { MOBILITY_SESSIONS } from './mobility'
import { BLOCKS, WEEKS, findSession } from './plan'
import type { Session } from './planTypes'
import { accumulatorBurpees } from './accumulator'
import { sessionExerciseIds } from '../lib/planEngine'
import { buildSteps } from '../lib/steps'

const SESSIONS: Session[] = [...WEEKS.flatMap((w) => w.sessions), ...MOBILITY_SESSIONS]
// Vorhandene Bilddateien (Vite löst das Muster zur Build-Zeit auf, ohne die Dateien zu laden)
const IMAGES = new Set(Object.keys(import.meta.glob('../../public/img/**/*.webp')).map((p) => p.replace('../../public/', '')))

describe('Plan-Daten', () => {
  it('jede Woche gehört zu genau einem Block, Wochen sind lückenlos nummeriert', () => {
    WEEKS.forEach((w, i) => expect(w.number).toBe(i + 1))
    for (const w of WEEKS) expect(BLOCKS.filter((b) => b.weeks.includes(w.number)).length).toBe(1)
  })

  it('Einheiten haben eindeutige Schlüssel und je Woche eindeutige Wochentage', () => {
    const keys = SESSIONS.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const w of WEEKS) {
      const days = w.sessions.map((s) => s.weekday)
      expect(new Set(days).size, `Woche ${w.number}`).toBe(days.length)
    }
    for (const s of SESSIONS) expect(findSession(s.key)?.session).toBe(s)
  })

  it('alle Übungen im Plan gibt es in der Bibliothek', () => {
    for (const s of SESSIONS) {
      for (const id of sessionExerciseIds(s)) expect(EXERCISE_MAP[id], `${s.key}: ${id}`).toBeDefined()
      for (const seg of s.segments) if (seg.type === 'timed') for (const it of seg.items) if (it.exerciseId) expect(EXERCISE_MAP[it.exerciseId], `${s.key}: ${it.exerciseId}`).toBeDefined()
    }
  })

  it('kein Satz teilt sich den Speicherplatz mit einem anderen (Übung + Abschnitt + Satznummer)', () => {
    // Fehler vom 17.09.2026: Max-Test und erster Folgesatz hatten denselben Schlüssel, der Folgesatz überschrieb den Test
    for (const s of SESSIONS) {
      const keys = buildSteps(s).flatMap((st) => (st.kind === 'set' ? [`${st.exerciseId}|${st.label}|${st.setIndex}`] : []))
      expect(new Set(keys).size, s.key).toBe(keys.length)
    }
  })

  it('Supersätze mischen nie Übungen mit und ohne Sitz', () => {
    for (const s of SESSIONS) for (const seg of s.segments) {
      if (seg.type !== 'block' || seg.kind !== 'superset') continue
      const seats = new Set(seg.exercises.map((p) => EXERCISE_MAP[p.exerciseId].seat).filter(Boolean))
      expect(seats.size, `${s.key} Supersatz ${seg.label}`).toBeLessThanOrEqual(1)
    }
  })

  it('Lastgrenzen und Wiederholungsbereiche sind plausibel', () => {
    for (const s of SESSIONS) for (const seg of s.segments) {
      if (seg.type !== 'block') continue
      for (const p of seg.exercises) {
        expect(p.sets, `${s.key} ${p.exerciseId}`).toBeGreaterThan(0)
        if (p.repsMin !== undefined && p.repsMax !== undefined) expect(p.repsMin).toBeLessThanOrEqual(p.repsMax)
        if (p.maxLb !== undefined) {
          expect(EXERCISE_MAP[p.exerciseId].loadType, `${s.key} ${p.exerciseId}: maxLb nur an der Bio Force`).toBe('bioforce')
          expect(p.maxLb).toBeGreaterThanOrEqual(5)
          expect(p.maxLb).toBeLessThanOrEqual(125)
        }
      }
    }
  })
})

describe('Übungsbibliothek', () => {
  it('eindeutige Kennungen; eine Sitz-Angabe gibt es nur an der Bio Force', () => {
    const ids = EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    // Übungen, die mit und ohne Sitz gehen (Wadenheben), tragen bewusst keine Angabe
    for (const e of EXERCISES) if (e.seat) expect(e.loadType, e.id).toBe('bioforce')
  })

  it('zu jedem Bildverweis liegt die Datei im Projekt', () => {
    expect(IMAGES.size).toBeGreaterThan(100)
    for (const e of EXERCISES) {
      if (e.genImage) {
        expect(IMAGES.has(`img/gen/${e.genImage}_start.webp`), `${e.id}: Startbild`).toBe(true)
        if (!e.noEndPhoto) expect(IMAGES.has(`img/gen/${e.genImage}_end.webp`), `${e.id}: Endbild`).toBe(true)
      } else if (e.bioforceNo) {
        expect(IMAGES.has(`img/bioforce/bf${String(e.bioforceNo).padStart(3, '0')}_start.webp`), `${e.id}: Nr. ${e.bioforceNo}`).toBe(true)
      }
    }
  })
})

describe('Accumulator', () => {
  it('nur 16–65, ganzzahlig, Burpees steigen mit der Zahl', () => {
    expect(accumulatorBurpees(15)).toBeUndefined()
    expect(accumulatorBurpees(66)).toBeUndefined()
    expect(accumulatorBurpees(44.5)).toBeUndefined()
    expect(accumulatorBurpees(16)).toBe(1)
    expect(accumulatorBurpees(65)).toBe(120)
    for (let n = 17; n <= 65; n++) expect(accumulatorBurpees(n)!).toBeGreaterThan(accumulatorBurpees(n - 1)!)
  })
})
