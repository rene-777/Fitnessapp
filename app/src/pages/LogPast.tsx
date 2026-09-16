import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { ex } from '../data/exercises'
import { WEEKS, findSession } from '../data/plan'
import { db, now } from '../db/db'
import type { Workout } from '../db/types'
import { useProfile } from '../hooks/useProfile'
import { planWeekOf, today } from '../lib/dates'
import { prescriptionText } from '../lib/planEngine'
import { buildSteps } from '../lib/steps'
import { saveBenchmark, saveSet } from '../lib/workouts'

interface Row {
  key: string
  exerciseId: string
  label: string
  setIndex: number
  title: string
  sub: string
  fields: ('reps' | 'weight' | 'rir' | 'seconds' | 'rounds' | 'minutes' | 'distance')[]
  isTest?: boolean
  benchmarkKey?: string
  benchmarkUnit?: string
  segmentLabel: string
}

export default function LogPast() {
  const params = useParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const [date, setDate] = useState(params.date ?? today())
  const [sessionKey, setSessionKey] = useState(params.sessionKey ?? '')
  const [duration, setDuration] = useState<number | ''>(60)
  const [values, setValues] = useState<Record<string, Record<string, number | ''>>>({})
  const [saving, setSaving] = useState(false)

  const found = useMemo(() => (sessionKey ? findSession(sessionKey) : undefined), [sessionKey])
  const rows = useMemo<Row[]>(() => {
    if (!found) return []
    const out: Row[] = []
    for (const s of buildSteps(found.session)) {
      if (s.kind === 'set') {
        const e = ex(s.exerciseId)
        const timed = s.p.seconds !== undefined || s.testUnit === 'seconds'
        const fields: Row['fields'] = timed ? ['seconds'] : ['reps']
        if (e.loadType === 'bioforce' || e.loadType === 'extern') fields.push('weight')
        if (!s.isTest && e.loadType !== 'none') fields.push('rir')
        out.push({ key: `${s.label}-${s.exerciseId}-${s.setIndex}`, exerciseId: s.exerciseId, label: s.label, setIndex: s.setIndex, title: `${s.label} ${e.name}`, sub: s.isTest ? 'Test' : `Satz ${s.setIndex}/${s.totalSets} · ${prescriptionText(s.p)}`, fields, isTest: s.isTest, benchmarkKey: s.benchmarkKey, benchmarkUnit: s.testUnit, segmentLabel: s.label })
      } else if (s.kind === 'amrap') {
        const single = s.seg.exercises.length === 1 && s.seg.exercises[0].reps === 1
        out.push({ key: `amrap-${s.seg.label}`, exerciseId: s.seg.exercises[0].exerciseId, label: s.seg.label, setIndex: 1, title: `AMRAP ${s.seg.minutes} min`, sub: s.seg.exercises.map((x) => `${x.reps > 1 ? x.reps + ' ' : ''}${ex(x.exerciseId).name}`).join(', '), fields: [single ? 'reps' : 'rounds'], isTest: !!s.seg.benchmarkKey, benchmarkKey: s.seg.benchmarkKey, benchmarkUnit: single ? 'reps' : 'rounds', segmentLabel: `amrap-${s.seg.label}` })
      } else if (s.kind === 'interval') {
        out.push({ key: `interval-${s.seg.label}`, exerciseId: s.seg.exerciseId, label: s.seg.label, setIndex: 1, title: `Intervalle ${ex(s.seg.exerciseId).name}`, sub: `${s.seg.rounds} × ${s.seg.workSec}/${s.seg.restSec} s`, fields: ['rounds', 'reps'], segmentLabel: `interval-${s.seg.label}` })
      } else if (s.kind === 'cardio') {
        out.push({ key: `cardio-${s.seg.label}`, exerciseId: s.seg.exerciseId, label: s.seg.label, setIndex: 1, title: `${s.seg.label} ${ex(s.seg.exerciseId).name}`, sub: `${s.seg.minutes} min geplant`, fields: ['minutes', 'distance'], isTest: !!s.seg.benchmarkKey, benchmarkKey: s.seg.benchmarkKey, benchmarkUnit: 'm', segmentLabel: `cardio-${s.seg.label}` })
      } else if (s.kind === 'challenge') {
        for (const it of s.seg.items) out.push({ key: `ch-${it.exerciseId}`, exerciseId: it.exerciseId, label: 'challenge', setIndex: 1, title: `Challenge ${ex(it.exerciseId).name}`, sub: 'Wiederholungen gesamt', fields: ['reps'], segmentLabel: 'challenge' })
      }
    }
    return out
  }, [found])

  if (!profile) return null
  const setVal = (k: string, f: string, v: number | '') => setValues((old) => ({ ...old, [k]: { ...(old[k] ?? {}), [f]: v } }))
  const get = (k: string, f: string) => values[k]?.[f] ?? ''

  const save = async () => {
    if (!found) return
    setSaving(true)
    const w: Workout = { id: uuid(), profileId: profile.id, date, week: planWeekOf(date, profile.planStartDate) || found.week.number, sessionKey: found.session.key, title: found.session.title, status: 'fertig', backfilled: true, durationMin: duration === '' ? undefined : Number(duration), startedAt: now(), finishedAt: now(), updatedAt: now() }
    await db.workouts.put(w)
    for (const r of rows) {
      const v = values[r.key]
      if (!v) continue
      const has = Object.values(v).some((x) => x !== '' && x !== undefined)
      if (!has) continue
      const reps = v.reps === '' || v.reps === undefined ? undefined : Number(v.reps)
      const seconds = v.seconds !== undefined && v.seconds !== '' ? Number(v.seconds) : v.minutes !== undefined && v.minutes !== '' ? Number(v.minutes) * 60 : undefined
      await saveSet(w, { exerciseId: r.exerciseId, segmentLabel: r.segmentLabel, setIndex: r.setIndex, reps, seconds, weightKg: v.weight === '' || v.weight === undefined ? undefined : Number(v.weight), rir: v.rir === '' || v.rir === undefined ? undefined : Number(v.rir), rounds: v.rounds === '' || v.rounds === undefined ? undefined : Number(v.rounds), distanceM: v.distance === '' || v.distance === undefined ? undefined : Number(v.distance), isTest: r.isTest })
      if (r.benchmarkKey) {
        const bench = r.benchmarkUnit === 'seconds' ? seconds : r.benchmarkUnit === 'm' ? (v.distance === '' ? undefined : Number(v.distance)) : r.benchmarkUnit === 'rounds' ? (v.rounds === '' ? undefined : Number(v.rounds)) : reps
        if (bench !== undefined && bench > 0) await saveBenchmark(w, r.benchmarkKey, bench, r.benchmarkUnit ?? 'reps')
      }
    }
    setSaving(false)
    navigate(`/session/${date}/${found.session.key}`)
  }

  const FIELD_LABEL: Record<string, string> = { reps: 'Wdh.', weight: 'kg', rir: 'RIR', seconds: 's', rounds: 'Runden', minutes: 'min', distance: 'm' }

  return (
    <div className="space-y-4">
      <h1 className="h1">Einheit nachtragen</h1>
      <div className="card space-y-3">
        <div>
          <div className="label mb-1">Datum</div>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <div className="label mb-1">Einheit</div>
          <select className="input" value={sessionKey} onChange={(e) => setSessionKey(e.target.value)}>
            <option value="">– wählen –</option>
            {WEEKS.filter((w) => w.sessions.length > 0).map((w) => (
              <optgroup key={w.number} label={`Woche ${w.number}: ${w.title}`}>
                {w.sessions.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <div className="label mb-1">Dauer (min)</div>
          <input type="number" className="input" value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>
      {found && (
        <>
          <div className="text-xs text-muted px-1">Leere Zeilen werden nicht gespeichert. Nur das eintragen, was du gemacht hast.</div>
          {rows.map((r) => (
            <div key={r.key} className="card space-y-2">
              <div><div className="font-semibold">{r.title}</div><div className="text-xs text-muted">{r.sub}</div></div>
              <div className="flex gap-2">
                {r.fields.map((f) => (
                  <div key={f} className="flex-1">
                    <div className="label mb-1">{FIELD_LABEL[f]}</div>
                    <input type="number" inputMode="decimal" className="input text-center px-1" value={get(r.key, f)} onChange={(e) => setVal(r.key, f, e.target.value === '' ? '' : Number(e.target.value))} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn-primary w-full" disabled={saving} onClick={save}>Einheit speichern</button>
        </>
      )}
    </div>
  )
}
