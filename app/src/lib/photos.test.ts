import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { photoCheckStatus, photoSchedule } from './photos'

const START = '2026-09-21'

describe('Foto-Termine', () => {
  it('Fenster reichen lückenlos vom Freitag davor bis zum Tag vor dem nächsten Fenster', () => {
    const s = photoSchedule(START)
    expect(s.map((c) => c.date)).toEqual(['2026-09-21', '2026-10-19', '2026-11-16', '2026-12-21', '2027-01-18'])
    expect(s[2].from).toBe('2026-11-13')
    expect(s[2].to).toBe('2026-12-17')
    expect(s[3].from).toBe('2026-12-18')
    expect(s[4].to).toBe('2027-02-11')
  })

  it('verspätete Fotos zählen zum zurückliegenden Termin, nicht zum nächsten', () => {
    const st = photoCheckStatus(START, ['2026-09-21', '2026-10-20', '2026-11-23'], '2026-11-23')
    expect(st.map((c) => c.status)).toEqual(['fertig', 'fertig', 'fertig', 'offen', 'offen'])
    expect(st[2].doneDate).toBe('2026-11-23')
  })

  it('ohne Fotos bleibt ein begonnener Termin fällig, ein künftiger offen', () => {
    const st = photoCheckStatus(START, ['2026-09-21', '2026-10-20'], '2026-11-22')
    expect(st.map((c) => c.status)).toEqual(['fertig', 'fertig', 'faellig', 'offen', 'offen'])
  })
})
