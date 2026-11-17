import type { Prescription, Segment, Session } from '../data/planTypes'

export type Step =
  | { kind: 'timed'; seg: Extract<Segment, { type: 'timed' }> }
  | { kind: 'measure'; seg: Extract<Segment, { type: 'measure' }> }
  | { kind: 'note'; title: string; text: string }
  | {
      kind: 'set'
      label: string // Anzeige, z. B. „C1“
      segKey: string // Speicherplatz (SetLog.segmentLabel): wie label, aber aus Segment.id, falls gesetzt
      exerciseId: string
      setIndex: number // 1-basiert
      totalSets: number
      p: Prescription
      restSec: number
      partners?: { label: string; exerciseId: string; p: Prescription }[] // Supersatz: die anderen Übungen dieser Runde (zum Vorbereiten des Umbaus)
      isTest?: boolean
      benchmarkKey?: string
      testUnit?: 'reps' | 'seconds'
      description?: string
    }
  | { kind: 'amrap'; seg: Extract<Segment, { type: 'amrap' }> }
  | { kind: 'interval'; seg: Extract<Segment, { type: 'interval' }> }
  | { kind: 'cardio'; seg: Extract<Segment, { type: 'cardio' }> }
  | { kind: 'challenge'; seg: Extract<Segment, { type: 'challenge' }> }

type Labeled = Extract<Segment, { type: 'block' | 'test' | 'amrap' | 'interval' | 'cardio' }>
/** Speicher-Kennung eines Abschnitts: die feste id, sonst das label. */
const keyOf = (seg: Labeled) => seg.id ?? seg.label
/** segmentLabel der Sätze von AMRAP, Intervallen und Cardio, z. B. „interval-A“. */
export const storeLabel = (seg: Extract<Segment, { type: 'amrap' | 'interval' | 'cardio' }>) => `${seg.type}-${keyOf(seg)}`

export function buildSteps(session: Session): Step[] {
  const steps: Step[] = []
  for (const seg of session.segments) {
    switch (seg.type) {
      case 'timed':
        steps.push({ kind: 'timed', seg })
        break
      case 'measure':
        steps.push({ kind: 'measure', seg })
        break
      case 'note':
        steps.push({ kind: 'note', title: seg.title, text: seg.text })
        break
      case 'block': {
        if (seg.kind === 'straight') {
          for (const p of seg.exercises) {
            for (let i = 1; i <= p.sets; i++) {
              steps.push({ kind: 'set', label: seg.label, segKey: keyOf(seg), exerciseId: p.exerciseId, setIndex: i, totalSets: p.sets, p, restSec: seg.restSec })
            }
          }
        } else {
          const max = Math.max(...seg.exercises.map((e) => e.sets))
          for (let i = 1; i <= max; i++) {
            const active = seg.exercises.filter((e) => e.sets >= i)
            const labeled = active.map((p, j) => ({ label: `${seg.label}${j + 1}`, segKey: `${keyOf(seg)}${j + 1}`, exerciseId: p.exerciseId, p }))
            labeled.forEach((cur, j) => {
              const last = j === labeled.length - 1
              steps.push({
                kind: 'set', label: cur.label, segKey: cur.segKey, exerciseId: cur.exerciseId, setIndex: i, totalSets: cur.p.sets, p: cur.p,
                restSec: last ? seg.restSec : (seg.restBetweenSec ?? 30),
                partners: labeled.filter((_, k) => k !== j).map(({ label, exerciseId, p }) => ({ label, exerciseId, p })),
              })
            })
          }
        }
        break
      }
      case 'test': {
        steps.push({
          kind: 'set', label: seg.label, segKey: keyOf(seg), exerciseId: seg.exerciseId, setIndex: 1, totalSets: 1,
          p: { exerciseId: seg.exerciseId, sets: 1 }, restSec: seg.restSec, isTest: true, benchmarkKey: seg.benchmarkKey, testUnit: seg.unit, description: seg.description,
        })
        if (seg.followUp) {
          // Eigenes Label: sonst teilen sich Test und 1. Folgesatz (gleiche Übung, Satz 1) denselben Speicherplatz
          // und der Folgesatz überschreibt den Test-Satz
          const label = `${seg.label} danach`
          const segKey = `${keyOf(seg)} danach`
          for (let i = 1; i <= seg.followUp.sets; i++) {
            steps.push({ kind: 'set', label, segKey, exerciseId: seg.followUp.exerciseId, setIndex: i, totalSets: seg.followUp.sets, p: seg.followUp, restSec: 120 })
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
