import { describe, expect, it } from 'vitest'
import type { Session } from '../data/planTypes'
import { buildSteps } from './steps'

const session = (segments: Session['segments']): Session => ({ key: 't', weekday: 1, title: 'Test', kind: 'kraft', minutes: 60, focus: '', segments })
const sets = (s: Session) => buildSteps(s).flatMap((st) => (st.kind === 'set' ? [st] : []))

describe('buildSteps', () => {
  it('gerader Block: alle Sätze einer Übung nacheinander, Pause nach jedem Satz', () => {
    const st = sets(session([{ type: 'block', label: 'A', kind: 'straight', restSec: 120, exercises: [{ exerciseId: 'rdl', sets: 3 }, { exerciseId: 'dips', sets: 2 }] }]))
    expect(st.map((x) => `${x.exerciseId}${x.setIndex}`)).toEqual(['rdl1', 'rdl2', 'rdl3', 'dips1', 'dips2'])
    expect(st.every((x) => x.restSec === 120 && x.label === 'A' && !x.partners)).toBe(true)
  })

  it('Supersatz: im Wechsel, kurze Pause dazwischen, lange nach der Runde, Partner für die Umbau-Karte', () => {
    const st = sets(session([{ type: 'block', label: 'C', kind: 'superset', restSec: 75, restBetweenSec: 20, exercises: [{ exerciseId: 'latzug-einarmig', sets: 3 }, { exerciseId: 'dead-bug', sets: 2 }] }]))
    expect(st.map((x) => `${x.label}:${x.setIndex}:${x.restSec}`)).toEqual(['C1:1:20', 'C2:1:75', 'C1:2:20', 'C2:2:75', 'C1:3:75'])
    expect(st[0].partners?.map((q) => q.exerciseId)).toEqual(['dead-bug'])
    expect(st[4].partners).toEqual([])
  })

  it('Test mit Folgesätzen: eigenes Label, damit der Folgesatz den Test nicht überschreibt', () => {
    const st = sets(session([{ type: 'test', label: 'B', exerciseId: 'dips', benchmarkKey: 'dipsMax', unit: 'reps', description: '', restSec: 180, followUp: { exerciseId: 'dips', sets: 2 } }]))
    expect(st.map((x) => `${x.label}|${x.setIndex}|${!!x.isTest}`)).toEqual(['B|1|true', 'B danach|1|false', 'B danach|2|false'])
    expect(st[0].benchmarkKey).toBe('dipsMax')
  })

  it('Hinweise, AMRAP, Intervalle und Cardio bleiben je ein Schritt in der Reihenfolge der Einheit', () => {
    const steps = buildSteps(session([
      { type: 'note', title: 'Umbau', text: '' },
      { type: 'interval', label: 'A', rounds: 8, workSec: 30, restSec: 60, exerciseId: 'seil', description: '' },
      { type: 'amrap', label: 'F', minutes: 6, exercises: [{ exerciseId: 'burpee', reps: 5 }], countLabel: 'Runden' },
      { type: 'cardio', label: 'B', minutes: 20, exerciseId: 'laufen-z2', description: '' },
    ]))
    expect(steps.map((s) => s.kind)).toEqual(['note', 'interval', 'amrap', 'cardio'])
  })
})
