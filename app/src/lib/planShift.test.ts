import { describe, expect, it } from 'vitest'
import { WEEKS, weekByNumber } from '../data/plan'
import type { Profile } from '../db/types'
import { nextMilestone, planProgress, sessionStreak } from './dashboard'
import { dateOf, isPausedDate, mondayOf, mondayOfWeek, planWeekOf, weekdayOf } from './dates'
import { photoSchedule } from './photos'
import { dayInfo } from './planEngine'
import { calOf, withMove, withPause, withoutMoves, withoutPause } from './planShift'
import { frequencyByWeek } from './stats'

const START = '2026-09-21'
const base: Profile = { id: 'p', name: 'Test', planStartDate: START, createdAt: '', updatedAt: '' }
const XMAS = '2026-12-21' // Montag, ohne Pause der Beginn von Woche 14

describe('Kalender ohne Abweichungen', () => {
  it('verhält sich wie der reine Startmontag', () => {
    const cal = calOf(base)
    for (const d of ['2026-09-20', '2026-09-21', '2026-11-17', '2026-12-21', '2027-01-17', '2027-01-18']) expect(planWeekOf(d, cal)).toBe(planWeekOf(d, START))
    expect(mondayOfWeek(cal, 1)).toBe(START)
    expect(mondayOfWeek(cal, 14)).toBe(XMAS)
    expect(dateOf(cal, 9, 2)).toBe('2026-11-17')
    expect(mondayOf('2026-12-24')).toBe(XMAS)
  })
})

describe('Woche pausieren', () => {
  const paused = withPause(base, '2026-12-24') // irgendein Tag der Weihnachtswoche
  const cal = calOf(paused)

  it('speichert den Montag, doppelt pausieren ändert nichts, vor dem Start geht nicht', () => {
    expect(paused.pauses).toEqual([XMAS])
    expect(withPause(paused, '2026-12-27')).toBe(paused)
    expect(withPause(base, '2026-09-01')).toBe(base)
  })

  it('die Pausenwoche gehört zu keiner Planwoche, Woche 14 und alle folgenden rücken um sieben Tage', () => {
    expect(isPausedDate('2026-12-20', cal)).toBe(false)
    expect(isPausedDate('2026-12-21', cal)).toBe(true)
    expect(isPausedDate('2026-12-27', cal)).toBe(true)
    expect(isPausedDate('2026-12-28', cal)).toBe(false)
    expect(planWeekOf('2026-12-20', cal)).toBe(13)
    expect(planWeekOf('2026-12-23', cal)).toBe(14) // in der Pause: die Woche, die danach beginnt
    expect(planWeekOf('2026-12-28', cal)).toBe(14)
    expect(mondayOfWeek(cal, 13)).toBe('2026-12-14')
    expect(mondayOfWeek(cal, 14)).toBe('2026-12-28')
    expect(mondayOfWeek(cal, 17)).toBe('2027-01-18')
    expect(planWeekOf('2027-01-24', cal)).toBe(17)
    expect(planWeekOf('2027-01-25', cal)).toBe(18)
  })

  it('Tagesinfo, Fortschritt, Meilenstein und Foto-Termine folgen dem Kalender', () => {
    expect(dayInfo('2026-12-23', cal)).toMatchObject({ kind: 'pause', week: 14 })
    expect(dayInfo('2026-12-23', cal).session).toBeUndefined()
    expect(dayInfo('2026-12-20', cal).kind).toBe('ruhe')
    // Der Fortschritt steht in der Pause still
    expect(planProgress('2026-12-20', cal)).toBe(planProgress('2026-12-24', cal))
    expect(planProgress('2026-12-28', cal)).toBeGreaterThan(planProgress('2026-12-24', cal))
    expect(planProgress('2027-01-24', cal)).toBe(1)
    expect(planProgress('2026-11-17', calOf(base))).toBeCloseTo(58 / (WEEKS.length * 7))
    // Letzte Woche (17) beginnt eine Woche später
    expect(nextMilestone('2027-01-10', cal)?.week).toBe(17)
    expect(nextMilestone('2027-01-10', cal)?.days).toBe(8)
    expect(photoSchedule(cal).find((c) => c.week === 14)?.date).toBe('2026-12-28')
    expect(photoSchedule(cal).find((c) => c.week === 9)?.date).toBe('2026-11-16')
  })

  it('zwei Pausen hintereinander und Aufheben', () => {
    const two = withPause(paused, '2026-12-28')
    expect(two.pauses).toEqual([XMAS, '2026-12-28'])
    expect(mondayOfWeek(calOf(two), 14)).toBe('2027-01-04')
    const one = withoutPause(two, '2026-12-30')
    expect(one.pauses).toEqual([XMAS])
    expect(withoutPause(one, XMAS).pauses).toBeUndefined()
  })

  it('eine Einheit, die in der Pause vorgezogen wird, zählt zu ihrer Planwoche', () => {
    const w = { id: 'w', profileId: 'p', date: '2026-12-23', week: 14, sessionKey: 'x', title: '', status: 'fertig' as const, updatedAt: '' }
    expect(frequencyByWeek([w], cal, 14)[13].done).toBe(1)
    expect(frequencyByWeek([w], cal, 14)[12].done).toBe(0)
  })
})

describe('Einheit verschieben', () => {
  const w9 = weekByNumber(9)!
  const [mo, di] = w9.sessions // Mo Beine, Di Cardio

  it('auf einen freien Tag: nur diese Einheit wandert', () => {
    const p = withMove(base, w9, di.key, 6)
    expect(p.moves).toEqual({ [di.key]: 6 })
    const cal = calOf(p)
    expect(weekdayOf(di, cal)).toBe(6)
    expect(dayInfo('2026-11-17', cal).kind).toBe('frei') // Dienstag ist jetzt leer
    expect(dayInfo('2026-11-21', cal)).toMatchObject({ kind: 'training', session: di })
    expect(dateOf(cal, 9, weekdayOf(di, cal))).toBe('2026-11-21')
  })

  it('auf einen belegten Tag: die beiden tauschen', () => {
    const p = withMove(base, w9, di.key, 1)
    expect(p.moves).toEqual({ [di.key]: 1, [mo.key]: 2 })
    expect(dayInfo('2026-11-16', calOf(p)).session).toBe(di)
    expect(dayInfo('2026-11-17', calOf(p)).session).toBe(mo)
    // Jede Woche hat danach weiter höchstens eine Einheit je Tag
    const days = w9.sessions.map((s) => weekdayOf(s, calOf(p)))
    expect(new Set(days).size).toBe(days.length)
  })

  it('zurück auf den Plan-Tag räumt den Eintrag weg', () => {
    const p = withMove(base, w9, di.key, 6)
    expect(withMove(p, w9, di.key, 2).moves).toBeUndefined()
    expect(withMove(withMove(base, w9, di.key, 1), w9, di.key, 2).moves).toBeUndefined() // Tausch rückgängig
    expect(withoutMoves(withMove(base, w9, di.key, 1), w9).moves).toBeUndefined()
    expect(withMove(base, w9, di.key, 2)).toBe(base)
    expect(withMove(base, w9, 'gibt-es-nicht', 3)).toBe(base)
  })

  it('die Serie zählt die verschobene Einheit an ihrem neuen Tag', () => {
    const done = (key: string) => ({ id: key, profileId: 'p', date: '', week: 9, sessionKey: key, title: '', status: 'fertig' as const, updatedAt: '' })
    const p = withMove(base, w9, di.key, 6) // Cardio erst am Samstag
    // Mittwoch 18.11.: Montag erledigt, Dienstag ist laut Kalender frei → Serie reißt nicht
    expect(sessionStreak([done(mo.key)], calOf(p), '2026-11-18')).toBe(1)
  })
})
