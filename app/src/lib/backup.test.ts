import { describe, expect, it } from 'vitest'
import { backupStatus } from './backup'

const rows = (...dates: string[]) => dates.map((d) => ({ updatedAt: `${d}T08:00:00.000Z` }))

describe('backupStatus', () => {
  it('ohne Daten keine Erinnerung', () => {
    expect(backupStatus(undefined, [], '2026-11-17T10:00:00.000Z')).toEqual({ due: false, changed: 0 })
  })
  it('noch nie exportiert, aber Daten vorhanden: erinnern', () => {
    expect(backupStatus(undefined, rows('2026-11-16'), '2026-11-17T10:00:00.000Z')).toEqual({ due: true, changed: 1 })
  })
  it('erst nach 7 Tagen und nur, wenn seitdem etwas dazukam', () => {
    const last = '2026-11-08T20:00:00.000Z'
    expect(backupStatus(last, rows('2026-11-09', '2026-11-10'), '2026-11-14T10:00:00.000Z')).toEqual({ due: false, days: 5, changed: 2 })
    expect(backupStatus(last, rows('2026-11-09', '2026-11-10'), '2026-11-15T20:00:00.000Z')).toEqual({ due: true, days: 7, changed: 2 })
    expect(backupStatus(last, rows('2026-11-01', '2026-11-07'), '2026-11-30T10:00:00.000Z')).toEqual({ due: false, days: 21, changed: 0 })
  })
})
