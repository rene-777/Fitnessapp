import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { MuscleChips } from '../components/ExerciseCard'
import NumberInput from '../components/NumberInput'
import { Stopwatch } from '../components/Timer'
import { CATEGORY_LABEL, EXERCISES, EXERCISE_MAP, type Category } from '../data/exercises'
import { db } from '../db/db'
import type { SetLog } from '../db/types'
import { useProfile } from '../hooks/useProfile'
import { unlockAudio } from '../lib/audio'
import { BF_MAX_LB, BF_MIN_LB, BF_STEP_LB, fmtKg, fmtLb, kgToLb, lbToKg } from '../lib/bioforce'
import { fmtSec, planWeekOf, today } from '../lib/dates'
import { EXERCISE_BENCHMARK, FREE_SEGMENT_LABEL, deleteSet, getOrCreateFreeWorkout, saveBenchmark, saveSet } from '../lib/workouts'

const ORDER: Category[] = ['push', 'pull', 'beine', 'core', 'cardio', 'warmup', 'mobility']

interface RowInput {
  reps: number | ''
  seconds: number | ''
  minutes: number | ''
  distance: number | ''
  weight: number | '' // lb bei Bio Force, sonst kg
  rir: number | ''
}
const EMPTY: RowInput = { reps: '', seconds: '', minutes: '', distance: '', weight: '', rir: '' }

/** Stoppuhr für Halteübungen: mit 3-2-1-Vorlauf, die gestoppte Zeit landet gerundet im Sekundenfeld. */
function HoldStopwatch({ onSeconds }: { onSeconds: (s: number) => void }) {
  const ref = useRef(onSeconds)
  ref.current = onSeconds
  const onChange = useCallback((s: number) => ref.current(Math.round(s)), [])
  return <Stopwatch leadIn onChange={onChange} />
}

/** Ein gespeicherter Satz als Kurztext, z. B. „8 Wdh. · @ 12,5 lb · RIR 2“. */
function setText(s: SetLog) {
  const e = EXERCISE_MAP[s.exerciseId]
  const parts: string[] = []
  if (s.reps !== undefined) parts.push(`${s.reps} Wdh.`)
  if (s.seconds !== undefined && s.reps === undefined) parts.push(e?.unit === 'meters' ? `${fmtSec(s.seconds)} min` : `${s.seconds} s`)
  if (s.distanceM !== undefined) parts.push(`${s.distanceM} m`)
  if (s.weightKg !== undefined) parts.push(e?.loadType === 'bioforce' ? `@ ${fmtLb(kgToLb(s.weightKg))} lb` : `@ ${fmtKg(s.weightKg)} kg`)
  if (s.rir !== undefined) parts.push(`RIR ${s.rir}`)
  return `${parts.join(' · ')}${s.isTest ? ' (Test)' : ''}`
}

/** Freies Training: beliebig viele Übungen nacheinander, außerhalb einer Plan-Einheit. Die Sätze hängen an einem „Freien Training“ des Tages. */
export default function FreeTraining() {
  const params = useParams()
  const profile = useProfile()
  const [date, setDate] = useState(today())
  const [exerciseId, setExerciseId] = useState(params.id && EXERCISE_MAP[params.id] ? params.id : '')
  const [rows, setRows] = useState<RowInput[]>([{ ...EMPTY }])
  const [isTest, setIsTest] = useState(false)
  const [error, setError] = useState<string>()
  const [noLoad, setNoLoad] = useState(false) // Bio Force ohne Skalenwert: erst Hinweis, zweiter Tipp speichert
  const [done, setDone] = useState<string>() // Meldung nach dem Speichern
  const [watch, setWatch] = useState<number | null>(null) // Zeile, deren Stoppuhr offen ist
  const [saving, setSaving] = useState(false)

  const e = exerciseId ? EXERCISE_MAP[exerciseId] : undefined
  const isBf = e?.loadType === 'bioforce'
  const showWeight = e?.loadType === 'bioforce' || e?.loadType === 'extern'
  const showRir = !!e && e.loadType !== 'none' && !isTest
  const bench = e ? EXERCISE_BENCHMARK[e.id] : undefined

  // Alle freien Einträge dieses Tages, über alle Übungen
  const dayRows = useLiveQuery(() => (profile ? db.sets.where('date').equals(date).toArray() : []), [profile?.id, date])
  const daySets = useMemo(
    () => (dayRows ?? []).filter((s) => profile && s.profileId === profile.id && !s.deleted && s.segmentLabel === FREE_SEGMENT_LABEL).sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1)),
    [dayRows, profile],
  )
  const savedForExercise = useMemo(() => daySets.filter((s) => s.exerciseId === exerciseId).sort((a, b) => a.setIndex - b.setIndex), [daySets, exerciseId])
  const byExercise = useMemo(() => {
    const m = new Map<string, SetLog[]>()
    for (const s of daySets) m.set(s.exerciseId, [...(m.get(s.exerciseId) ?? []), s])
    return [...m.entries()].map(([id, sets]) => ({ id, sets: sets.sort((a, b) => a.setIndex - b.setIndex) }))
  }, [daySets])

  if (!profile) return null

  const setRow = (i: number, patch: Partial<RowInput>) => { setRows((old) => old.map((r, j) => (j === i ? { ...r, ...patch } : r))); setError(undefined); setNoLoad(false) }
  const addRow = () => setRows((old) => [...old, { ...old[old.length - 1] }])
  const removeRow = (i: number) => { setRows((old) => (old.length > 1 ? old.filter((_, j) => j !== i) : old)); setWatch(null) }
  const pick = (id: string) => { setExerciseId(id); setRows([{ ...EMPTY }]); setIsTest(false); setError(undefined); setNoLoad(false); setWatch(null); if (id) setDone(undefined) }

  // Ein Satz zählt als ausgefüllt, wenn der Hauptwert (Wdh., Sekunden oder Minuten/Meter) drin ist
  const isFilled = (r: RowInput) => (e?.unit === 'reps' ? r.reps !== '' && r.reps !== 0 : e?.unit === 'seconds' ? r.seconds !== '' && r.seconds !== 0 : (r.minutes !== '' && r.minutes !== 0) || (r.distance !== '' && r.distance !== 0))

  const save = async () => {
    if (!e) return
    const filled = rows.filter(isFilled)
    if (filled.length === 0) { setError(e.unit === 'reps' ? 'Bitte mindestens einen Satz mit Wiederholungen eintragen.' : e.unit === 'seconds' ? 'Bitte die Sekunden eintragen.' : 'Bitte Minuten oder Meter eintragen.'); return }
    if (isBf && filled.some((r) => r.weight === '') && !noLoad) { setNoLoad(true); return }
    setSaving(true)
    const w = await getOrCreateFreeWorkout(profile.id, date, planWeekOf(date, profile.planStartDate) || 0)
    let index = savedForExercise.length
    let best = 0
    for (const r of filled) {
      index++
      const reps = e.unit === 'reps' && r.reps !== '' ? Number(r.reps) : undefined
      const seconds = e.unit === 'seconds' && r.seconds !== '' ? Number(r.seconds) : e.unit === 'meters' && r.minutes !== '' ? Number(r.minutes) * 60 : undefined
      await saveSet(w, {
        exerciseId: e.id, segmentLabel: FREE_SEGMENT_LABEL, setIndex: index,
        reps, seconds,
        distanceM: e.unit === 'meters' && r.distance !== '' ? Number(r.distance) : undefined,
        weightKg: showWeight && r.weight !== '' ? (isBf ? lbToKg(Number(r.weight)) : Number(r.weight)) : undefined,
        rir: showRir && r.rir !== '' ? Number(r.rir) : undefined,
        isTest: isTest && !!bench,
      })
      best = Math.max(best, (bench?.unit === 'seconds' ? seconds : reps) ?? 0)
    }
    if (isTest && bench && best > 0) await saveBenchmark(w, bench.key, best, bench.unit)
    setSaving(false)
    // Übungswahl freigeben: die nächste Übung kommt gleich hinterher
    pick('')
    setDone(`${e.name}: ${filled.length} ${filled.length === 1 ? 'Satz' : 'Sätze'} gespeichert.${isTest && bench ? ' Als Max-Test übernommen.' : ''}`)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-4">
      <h1 className="h1">Freies Training</h1>
      {done && (
        <div className="rounded-xl bg-ok/10 border border-ok/40 p-3 text-sm">
          <div className="text-ok">{done}</div>
          <div className="text-muted mt-1">Nächste Übung wählen oder unten die Einträge des Tages ansehen.</div>
        </div>
      )}
      <div className="card space-y-3">
        <div>
          <div className="label mb-1">Datum</div>
          <input type="date" className="input" value={date} onChange={(ev) => setDate(ev.target.value)} />
        </div>
        <div>
          <div className="label mb-1">{done ? 'Nächste Übung' : 'Übung'}</div>
          <select className="input" value={exerciseId} onChange={(ev) => pick(ev.target.value)}>
            <option value="">– wählen –</option>
            {ORDER.map((cat) => (
              <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                {EXERCISES.filter((x) => x.category === cat).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        {e && <MuscleChips e={e} />}
      </div>

      {e && (
        <>
          {bench && (
            <label className="card flex items-center justify-between gap-3 cursor-pointer">
              <div><div className="font-semibold">Als Max-Test speichern</div><div className="text-xs text-muted">Der beste Satz wird als Benchmark übernommen und erscheint in der Analyse.</div></div>
              <input type="checkbox" className="h-5 w-5 accent-[#ff7a1a]" checked={isTest} onChange={(ev) => setIsTest(ev.target.checked)} />
            </label>
          )}
          {rows.map((r, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="label">Satz {savedForExercise.length + i + 1}</div>
                {rows.length > 1 && <button type="button" className="btn-ghost px-3 py-1 text-sm" onClick={() => removeRow(i)}>Entfernen</button>}
              </div>
              {e.unit === 'reps' && <NumberInput label="Wiederholungen" value={r.reps} onChange={(v) => setRow(i, { reps: v })} />}
              {e.unit === 'seconds' && (
                <>
                  {watch === i
                    ? <HoldStopwatch onSeconds={(s) => setRow(i, { seconds: s })} />
                    : <button type="button" className="btn-ghost w-full" onClick={() => { unlockAudio(); setWatch(i) }}>Stoppuhr starten</button>}
                  <NumberInput label="Sekunden" value={r.seconds} onChange={(v) => setRow(i, { seconds: v })} step={5} />
                </>
              )}
              {e.unit === 'meters' && (
                <div className="flex gap-2">
                  <NumberInput label="Minuten" value={r.minutes} onChange={(v) => setRow(i, { minutes: v })} compact />
                  <NumberInput label="Meter" value={r.distance} onChange={(v) => setRow(i, { distance: v })} step={100} compact />
                </div>
              )}
              {showWeight && (isBf
                ? <NumberInput label="Skala (lb) pro Seite" value={r.weight} onChange={(v) => setRow(i, { weight: v })} step={BF_STEP_LB} min={BF_MIN_LB} max={BF_MAX_LB} hint={r.weight === '' ? 'Wert am Schwingarm, 5–125 in 2,5er-Rasten' : `≈ ${fmtKg(lbToKg(Number(r.weight)))} kg pro Seite`} error={noLoad && r.weight === '' && isFilled(r) ? 'Kein Skalenwert eingetragen. Nochmal tippen, um ohne Last zu speichern.' : undefined} />
                : <NumberInput label="kg" value={r.weight} onChange={(v) => setRow(i, { weight: v })} step={1} />)}
              {showRir && (
                <div>
                  <div className="label mb-1">RIR · wie viele wären noch gegangen?</div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((v) => (
                      <button key={v} type="button" className={`flex-1 rounded-lg py-2 border ${r.rir === v ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => setRow(i, { rir: r.rir === v ? '' : v })}>{v === 4 ? '4+' : v}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="btn-ghost w-full" onClick={addRow}>+ Satz</button>
          {error && <div className="text-sm text-bad text-center" role="alert">{error}</div>}
          <button className="btn-primary w-full" disabled={saving} onClick={save}>{noLoad ? 'Ohne Last speichern' : 'Speichern, dann nächste Übung'}</button>
          <Link to={`/exercises/${e.id}`} className="btn-ghost block text-center text-sm">Verlauf der Übung ansehen</Link>
        </>
      )}

      {byExercise.length > 0 && (
        <section className="card space-y-3">
          <div className="h2">Freies Training am {date.split('-').reverse().join('.')}</div>
          {byExercise.map(({ id, sets }) => (
            <div key={id} className="border-t border-line pt-2 first:border-t-0 first:pt-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/exercises/${id}`} className="font-semibold">{EXERCISE_MAP[id]?.name ?? id}</Link>
                <button type="button" className="text-xs text-accent" onClick={() => { pick(id); window.scrollTo({ top: 0 }) }}>+ Satz</button>
              </div>
              {sets.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <div>Satz {s.setIndex}: {setText(s)}</div>
                  <button type="button" className="btn-ghost px-3 py-1 text-xs text-bad" onClick={() => void deleteSet(s.id)}>Löschen</button>
                </div>
              ))}
            </div>
          ))}
          <div className="text-xs text-muted">Zählt in Verlauf, Bestwerten und Auswertung, nicht als Plan-Einheit.</div>
        </section>
      )}
    </div>
  )
}
