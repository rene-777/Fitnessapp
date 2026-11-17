import { describe, expect, it } from 'vitest'
import { BF_MAX_LB, BF_MIN_LB, bfStepAt, floorLb, kgToLb, lbToKg, snapLb, stepLb } from './bioforce'

/** Alle einstellbaren Rasten: 5–100 in 2,5ern, darüber in 5ern bis 125. */
const NOTCHES: number[] = []
for (let lb = BF_MIN_LB; lb <= 100; lb += 2.5) NOTCHES.push(lb)
for (let lb = 105; lb <= BF_MAX_LB; lb += 5) NOTCHES.push(lb)

describe('Bio-Force-Skala', () => {
  it('jede Raste übersteht die Umrechnung lb → kg → lb', () => {
    for (const lb of NOTCHES) expect(kgToLb(lbToKg(lb))).toBe(lb)
  })

  it('rastet bis 100 lb in 2,5ern, darüber in 5ern', () => {
    expect(snapLb(98.7)).toBe(97.5)
    expect(snapLb(99)).toBe(100)
    expect(snapLb(102)).toBe(100)
    expect(snapLb(103)).toBe(105)
    expect(floorLb(104.9)).toBe(100)
    expect(floorLb(37.4)).toBe(35)
  })

  it('bleibt im Skalenbereich', () => {
    expect(snapLb(1)).toBe(BF_MIN_LB)
    expect(snapLb(300)).toBe(BF_MAX_LB)
    expect(stepLb(125)).toBe(125)
    expect(stepLb(5, -1)).toBe(5)
  })

  it('Schritte über die 100-lb-Grenze (Rückmeldung 27.10.2026)', () => {
    expect(stepLb(97.5)).toBe(100)
    expect(stepLb(100)).toBe(105)
    expect(stepLb(105)).toBe(110)
    expect(stepLb(110, -1)).toBe(105)
    expect(stepLb(105, -1)).toBe(100)
    expect(stepLb(100, -1)).toBe(97.5)
    expect(stepLb(95, 2)).toBe(100)
    expect(bfStepAt(100, 1)).toBe(5)
    expect(bfStepAt(100, -1)).toBe(2.5)
  })
})
