import type { Prescription, Segment, Session } from '../data/planTypes'

export type Step =
  | { kind: 'info'; title: string; items: string[]; minutes?: number }
  | { kind: 'note'; title: string; text: string }
  | {
      kind: 'set'
      label: string
      exerciseId: string
      setIndex: number // 1-basiert
      totalSets: number
      p: Prescription
      restSec: number
      isTest?: boolean
      benchmarkKey?: string
      testUnit?: 'reps' | 'seconds'
      description?: string
    }
  | { kind: 'amrap'; seg: Extract<Segment, { type: 'amrap' }> }
  | { kind: 'interval'; seg: Extract<Segment, { type: 'interval' }> }
  | { kind: 'cardio'; seg: Extract<Segment, { type: 'cardio' }> }
  | { kind: 'challenge'; seg: Extract<Segment, { type: 'challenge' }> }

export function buildSteps(session: Session): Step[] {
  const steps: Step[] = []
  for (const seg of session.segments) {
    switch (seg.type) {
      case 'warmup':
        steps.push({ kind: 'info', title: `Warm-up · ${seg.minutes} min`, items: seg.items, minutes: seg.minutes })
        break
      case 'cooldown':
        steps.push({ kind: 'info', title: `Cool-down · ${seg.minutes} min`, items: seg.items, minutes: seg.minutes })
        break
      case 'note':
        steps.push({ kind: 'note', title: seg.title, text: seg.text })
        break
      case 'block': {
        if (seg.kind === 'straight') {
          for (const p of seg.exercises) {
            for (let i = 1; i <= p.sets; i++) {
              steps.push({ kind: 'set', label: seg.label, exerciseId: p.exerciseId, setIndex: i, totalSets: p.sets, p, restSec: seg.restSec })
            }
          }
        } else {
          const max = Math.max(...seg.exercises.map((e) => e.sets))
          for (let i = 1; i <= max; i++) {
            const active = seg.exercises.filter((e) => e.sets >= i)
            active.forEach((p, j) => {
              const last = j === active.length - 1
              steps.push({
                kind: 'set', label: `${seg.label}${j + 1}`, exerciseId: p.exerciseId, setIndex: i, totalSets: p.sets, p,
                restSec: last ? seg.restSec : (seg.restBetweenSec ?? 30),
              })
            })
          }
        }
        break
      }
      case 'test': {
        steps.push({
          kind: 'set', label: seg.label, exerciseId: seg.exerciseId, setIndex: 1, totalSets: 1,
          p: { exerciseId: seg.exerciseId, sets: 1 }, restSec: seg.restSec, isTest: true, benchmarkKey: seg.benchmarkKey, testUnit: seg.unit, description: seg.description,
        })
        if (seg.followUp) {
          // Eigenes Label: sonst teilen sich Test und 1. Folgesatz (gleiche Übung, Satz 1) denselben Speicherplatz
          // und der Folgesatz überschreibt den Test-Satz
          const label = `${seg.label} danach`
          for (let i = 1; i <= seg.followUp.sets; i++) {
            steps.push({ kind: 'set', label, exerciseId: seg.followUp.exerciseId, setIndex: i, totalSets: seg.followUp.sets, p: seg.followUp, restSec: 120 })
          }
        }
        break
      }
      case 'amrap':
        steps.push({ kind: 'amrap', seg })
        break
      case 'interval':
        steps.push({ kind: 'interval', seg })
        break
      case 'cardio':
        steps.push({ kind: 'cardio', seg })
        break
      case 'challenge':
        steps.push({ kind: 'challenge', seg })
        break
    }
  }
  return steps
}
