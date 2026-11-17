import { describe, expect, it } from 'vitest'
import type { Prescription } from '../data/planTypes'
import type { SetLog } from '../db/types'
import { kgToLb, lbToKg } from './bioforce'
import { challengeStatus, dayInfo, epley1RM, prescriptionText, suggestLoad } from './planEngine'

let n = 0
/** Sätze einer Einheit: [Wiederholungen, lb, RIR] je Satz. */
function workout(date: string, exerciseId: string, rows: [number, number | undefined, number | undefined][], extra: Partial<SetLog> = {}): SetLog[] {
  const workoutId = `w${++n}`
  return rows.map(([reps, lb, rir], i) => ({
    id: `${workoutId}-${i}`, workoutId, profileId: 'p', date, exerciseId, segmentLabel: 'A', setIndex: i + 1,
    reps, weightKg: lb === undefined ? undefined : lbToKg(lb), rir, updatedAt: `${date}T08:00:00Z`, ...extra,
  }))
}
const p = (repsMin: number, repsMax: number, o: Partial<Prescription> = {}): Prescription => ({ exerciseId: 'x', sets: 3, repsMin, repsMax, ...o })
const lb = (kg?: number) => (kg === undefined ? undefined : kgToLb(kg))

describe('suggestLoad an der Bio Force', () => {
  it('ohne Verlauf: kein Lastvorschlag, Hinweis auf die erste Ausführung', () => {
    const s = suggestLoad(p(8, 10, { loadHint: 'Leicht starten' }), [], 'bioforce')
    expect(s.weightKg).toBeUndefined()
    expect(s.text).toContain('Leicht starten')
    expect(s.text).toContain('Erste Ausführung')
  })

  it('oberes Ende mit RIR ≤ 1: +5 lb mit Hinweis auf die halbe Stufe', () => {
    const s = suggestLoad(p(6, 8), workout('2026-10-20', 'schraegdruecken', [[8, 40, 1], [8, 40, 1], [8, 40, 0]]), 'bioforce')
    expect(lb(s.weightKg)).toBe(45)
    expect(s.text).toContain('nur eine Raste = +2,5 lb')
  })

  it('oberes Ende mit RIR 2: eine Raste mehr; ab 100 lb ist das ein 5er-Schritt (RDL 110 → 115)', () => {
    expect(lb(suggestLoad(p(6, 8), workout('2026-10-20', 'rdl', [[8, 110, 2], [8, 110, 2], [8, 110, 2]]), 'bioforce').weightKg)).toBe(115)
    expect(lb(suggestLoad(p(6, 8), workout('2026-10-20', 'rudern-stehend', [[8, 30, 2], [8, 30, 2], [8, 30, 2]]), 'bioforce').weightKg)).toBe(32.5)
  })

  it('Ziel erreicht mit 3+ RIR: zu leicht, zwei Rasten mehr', () => {
    const s = suggestLoad(p(6, 8), workout('2026-10-20', 'x', [[8, 40, 3], [8, 40, 4], [8, 40, 3]]), 'bioforce')
    expect(lb(s.weightKg)).toBe(45)
    expect(s.text).toContain('zu leicht')
  })

  it('Ziel nicht in allen Sätzen erreicht: gleiche Last', () => {
    const s = suggestLoad(p(6, 8), workout('2026-10-20', 'x', [[8, 40, 1], [7, 40, 1], [6, 40, 0]]), 'bioforce')
    expect(lb(s.weightKg)).toBe(40)
    expect(s.text).toContain('gleiche Last')
  })

  it('Obergrenze aus dem Plan kappt den Vorschlag (maxLb)', () => {
    const s = suggestLoad(p(6, 8, { maxLb: 115 }), workout('2026-11-02', 'rdl', [[8, 115, 1], [8, 115, 1], [8, 115, 1]]), 'bioforce')
    expect(lb(s.weightKg)).toBe(115)
    expect(s.text).toContain('Obergrenze')
  })

  it('Wiedereinstieg (hold): Last halten, auch wenn sie zu leicht war', () => {
    const s = suggestLoad(p(6, 8, { hold: true }), workout('2026-11-02', 'x', [[8, 40, 4], [8, 40, 4], [8, 40, 4]]), 'bioforce')
    expect(lb(s.weightKg)).toBe(40)
    expect(s.text).toContain('Wiedereinstieg')
  })

  it('kleine Übungen: erst 2 Wiederholungen über dem Ziel, dann eine Raste', () => {
    const stay = suggestLoad(p(12, 15), workout('2026-10-20', 'seitheben', [[15, 10, 1], [15, 10, 1], [15, 10, 1]]), 'bioforce', true)
    expect(lb(stay.weightKg)).toBe(10)
    const up = suggestLoad(p(12, 15), workout('2026-10-21', 'seitheben', [[17, 10, 1], [17, 10, 1], [17, 10, 1]]), 'bioforce', true)
    expect(lb(up.weightKg)).toBe(12.5)
  })

  it('neuer Wiederholungsbereich: Last wird umgerechnet und nie leichter', () => {
    const hist = workout('2026-10-15', 'x', [[10, 35, 3], [10, 35, 3], [10, 35, 3]])
    const s = suggestLoad(p(6, 8), hist, 'bioforce')
    expect(lb(s.weightKg)).toBe(37.5)
    expect(s.text).toContain('neuer Bereich')
    const hard = suggestLoad(p(6, 8), workout('2026-10-16', 'x', [[10, 35, 0], [10, 35, 0], [10, 35, 0]]), 'bioforce')
    expect(lb(hard.weightKg)).toBe(35)
  })

  it('nach der Einstufung (aufsteigende Sätze): 10RM aus Wiederholungen + RIR, Start eine Stufe darunter', () => {
    const s = suggestLoad(p(8, 10), workout('2026-09-21', 'x', [[10, 20, undefined], [10, 30, undefined], [10, 40, 2]]), 'bioforce')
    expect(lb(s.weightKg)).toBe(37.5)
    expect(s.text).toContain('geschätztes 10RM')
  })

  it('nimmt die letzte Einheit und ignoriert Tests, gelöschte Sätze und Challenge-Sätze', () => {
    const hist = [
      ...workout('2026-10-10', 'x', [[8, 30, 1], [8, 30, 1]]),
      ...workout('2026-10-17', 'x', [[8, 35, 1], [8, 35, 1]]),
      ...workout('2026-10-18', 'x', [[5, 60, undefined]], { isTest: true }),
      ...workout('2026-10-19', 'x', [[8, 80, 1]], { deleted: true }),
      ...workout('2026-10-19', 'x', [[20, 10, undefined]], { segmentLabel: 'challenge' }),
    ]
    expect(lb(suggestLoad(p(6, 8), hist, 'bioforce').weightKg)).toBe(40)
  })
})

describe('suggestLoad bei Körpergewicht', () => {
  const variants = ['Standard', 'Füße auf der Box', 'Tempo 3-1-1']
  it('Ziel mit 3+ RIR erreicht: nächste Variante', () => {
    const s = suggestLoad(p(10, 15), workout('2026-10-20', 'pushup', [[15, undefined, 3], [15, undefined, 3]]), 'bodyweight', false, variants)
    expect(s.variant).toBe('Standard')
    expect(s.nextVariant).toBe('Füße auf der Box')
  })
  it('merkt sich die zuletzt genutzte Variante', () => {
    const s = suggestLoad(p(10, 15), workout('2026-10-20', 'pushup', [[12, undefined, 1], [11, undefined, 1]], { variant: 'Füße auf der Box' }), 'bodyweight', false, variants)
    expect(s.variant).toBe('Füße auf der Box')
    expect(s.nextVariant).toBeUndefined()
  })
})

describe('Hilfsfunktionen', () => {
  it('epley1RM', () => {
    expect(epley1RM(50, 1)).toBe(50)
    expect(epley1RM(30, 10)).toBe(40)
  })
  it('prescriptionText', () => {
    expect(prescriptionText(p(6, 8, { rir: '1–2', tempo: '3-1-1', perSide: true }))).toBe('3 × 6–8 · je Seite · 1–2 RIR · Tempo 3-1-1')
    expect(prescriptionText({ exerciseId: 'plank', sets: 2, seconds: 60 })).toBe('2 × 60 s')
  })
  it('dayInfo: Woche 7 liegt auf Di–Sa, Montag ist frei', () => {
    const start = '2026-09-21'
    expect(dayInfo('2026-09-20', start).kind).toBe('vorher')
    expect(dayInfo('2026-09-21', start)).toMatchObject({ week: 1, kind: 'training' })
    expect(dayInfo('2026-09-27', start).kind).toBe('ruhe')
    expect(dayInfo('2026-11-02', start)).toMatchObject({ week: 7, kind: 'frei' })
    expect(dayInfo('2026-11-07', start)).toMatchObject({ week: 7, kind: 'training' })
    expect(dayInfo('2027-01-18', start).kind).toBe('nachher')
  })
  it('challengeStatus rechnet Wochenziele aus den Benchmarks und zählt erledigte Wiederholungen', () => {
    const st = challengeStatus([], [], 0.2)
    expect(st.length).toBeGreaterThan(0)
    for (const x of st) {
      expect(x.weekTarget % 10).toBe(0)
      expect(x.todayTarget).toBe(Math.round(x.weekTarget * 0.2))
      expect(x.done).toBe(0)
    }
    const first = st[0]
    const done = challengeStatus([], workout('2026-10-12', first.exerciseId, [[30, undefined, undefined]]), -1)[0]
    expect(done.done).toBe(30)
    expect(done.todayTarget).toBe(first.weekTarget - 30)
  })
})
