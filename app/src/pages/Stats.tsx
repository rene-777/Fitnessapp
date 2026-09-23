import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ex } from '../data/exercises'
import { WEEKS } from '../data/plan'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { fmtLb, kgToLb } from '../lib/bioforce'
import { fmtDate, fmtSec, planWeekOf, today } from '../lib/dates'
import { blockLabel } from '../lib/planEngine'
import { GROUP_NAMES, REP_GROUPS, benchmarkSeries, cardioPoints, frequencyByWeek, loadRecords, mobilityByWeek, readinessPoints, repsByWeek, volumeByGroup, type BenchmarkSeries } from '../lib/stats'
import { BENCHMARK_LABELS, LOWER_IS_BETTER, isMobilityBenchmark } from '../lib/workouts'

const num = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 })
const shortDate = (d: string) => fmtDate(d, { day: '2-digit', month: '2-digit' })

/** Ein Verlauf, eine Achse. Zwei Messgrößen bekommen zwei Diagramme, nie eine zweite y-Achse. */
function TrendChart({ data, unit, height = 'h-36', whole }: { data: { date: string; value: number }[]; unit: string; height?: string; whole?: boolean }) {
  const rows = data.map((p) => ({ d: shortDate(p.date), value: p.value }))
  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#2c2c2c" vertical={false} />
          <XAxis dataKey="d" tick={{ fill: '#9b9b9b', fontSize: 11 }} />
          <YAxis domain={['auto', 'auto']} allowDecimals={!whole} tick={{ fill: '#9b9b9b', fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${num(Number(v))} ${unit}`, '']} separator="" contentStyle={{ background: '#171717', border: '1px solid #2c2c2c', borderRadius: 8 }} labelStyle={{ color: '#9b9b9b' }} itemStyle={{ color: '#f4f4f4' }} />
          <Line type="linear" dataKey="value" stroke="#ff7a1a" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Differenz mit Farbe: grün, wenn es eine Verbesserung ist (bei Abstandsmaßen ist kleiner besser). */
function Delta({ from, to, unit, lowerIsBetter }: { from: number; to: number; unit?: string; lowerIsBetter?: boolean }) {
  const d = Math.round((to - from) * 10) / 10
  if (d === 0) return <span className="text-muted">±0</span>
  const good = lowerIsBetter ? d < 0 : d > 0
  return <span><span className={good ? 'text-ok' : 'text-bad'}>{d > 0 ? '▲' : '▼'}</span> {d > 0 ? '+' : '−'}{num(Math.abs(d))}{unit ? ` ${unit}` : ''}</span>
}

/** Testwert lesbar: Sekunden als m:ss, sonst Zahl. */
function benchValue(v: number, unit: string) {
  return unit === 'seconds' ? fmtSec(v) : num(v)
}

/** Ein Benchmark: aktueller Wert, Differenz zum Start, Verlauf ab dem zweiten Wert. */
function BenchmarkRow({ s }: { s: BenchmarkSeries }) {
  const unit = s.unit === 'seconds' ? 'min' : s.unit === 'meters' ? 'm' : s.unit === 'cm' ? 'cm' : ''
  const chartUnit = s.unit === 'seconds' ? 's' : unit
  const lower = LOWER_IS_BETTER.has(s.key)
  const bestDiffers = lower ? s.best < s.latest : s.best > s.latest
  return (
    <div className="border-t border-line first:border-t-0 pt-3 first:pt-0 space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm text-muted">{BENCHMARK_LABELS[s.key] ?? s.key}</div>
        <div className="text-sm">{s.points.length > 1 && <Delta from={s.first} to={s.latest} unit={chartUnit} lowerIsBetter={lower} />}</div>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-bold tabular-nums">{benchValue(s.latest, s.unit)}{unit && <span className="text-base font-normal text-muted"> {unit}</span>}</div>
        <div className="text-xs text-muted">{shortDate(s.points[s.points.length - 1].date)}{bestDiffers ? ` · Bestwert ${benchValue(s.best, s.unit)}` : ''}{s.points.length > 1 ? ` · Start ${benchValue(s.first, s.unit)}` : ''}</div>
      </div>
      {s.points.length > 1 && <TrendChart data={s.points} unit={chartUnit} height="h-28" whole={s.unit !== 'cm'} />}
    </div>
  )
}

export default function Stats() {
  const profile = useProfile()
  const sets = useLiveQuery(() => (profile ? db.sets.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const workouts = useLiveQuery(() => (profile ? db.workouts.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const benchmarks = useLiveQuery(() => (profile ? db.benchmarks.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const start = profile?.planStartDate ?? ''
  const currentWeek = Math.min(WEEKS.length, Math.max(1, start ? planWeekOf(today(), start) : 1))
  const [week, setWeek] = useState<number>()
  const w = week ?? currentWeek

  const volume = useMemo(() => (sets ? volumeByGroup(sets, start, w) : undefined), [sets, start, w])
  const volumePrev = useMemo(() => (sets && w > 1 ? volumeByGroup(sets, start, w - 1) : undefined), [sets, start, w])
  const reps = useMemo(() => (sets ? repsByWeek(sets, start) : undefined), [sets, start])
  const series = useMemo(() => {
    const order = Object.keys(BENCHMARK_LABELS)
    return (benchmarks ? benchmarkSeries(benchmarks) : []).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  }, [benchmarks])
  const records = useMemo(() => (sets ? loadRecords(sets) : []), [sets])
  const freq = useMemo(() => (workouts ? frequencyByWeek(workouts, start, currentWeek) : []), [workouts, start, currentWeek])
  const mobility = useMemo(() => (workouts ? mobilityByWeek(workouts, start, currentWeek) : []), [workouts, start, currentWeek])
  const cardio = useMemo(() => (sets ? cardioPoints(sets) : []), [sets])
  const readiness = useMemo(() => (workouts ? readinessPoints(workouts) : []), [workouts])

  if (!profile || !sets || !workouts || !benchmarks) return null
  const empty = sets.filter((s) => !s.deleted).length === 0 && workouts.filter((x) => !x.deleted).length === 0

  const volMax = Math.max(12, ...Object.values(volume ?? {}), ...Object.values(volumePrev ?? {}))
  const weeksWithReps = [...(reps?.keys() ?? [])].filter((n) => n >= 1).sort((a, b) => a - b)
  const repWeeks = Array.from({ length: currentWeek }, (_, i) => i + 1)
  const doneTotal = freq.reduce((a, f) => a + f.done, 0)
  const plannedTotal = freq.reduce((a, f) => a + f.planned, 0)
  const hrPoints = cardio.filter((c) => c.avgHr).map((c) => ({ date: c.date, value: c.avgHr! }))
  const pacePoints = cardio.filter((c) => c.paceMinPerKm).map((c) => ({ date: c.date, value: c.paceMinPerKm! }))
  const kneePoints = readiness.filter((r) => r.knee !== undefined).map((r) => ({ date: r.date, value: r.knee! }))
  const sleepPoints = readiness.filter((r) => r.sleepH !== undefined).map((r) => ({ date: r.date, value: r.sleepH! }))

  return (
    <div className="space-y-4">
      <h1 className="h1">Auswertung</h1>
      {empty && <div className="card text-sm text-muted">Noch keine Trainingsdaten. Sobald du Sätze speicherst, erscheinen hier Volumen, Wiederholungen, Bestwerte und Verläufe.</div>}

      {/* Trainingsfrequenz */}
      <section className="card space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="h2">Trainingsfrequenz</div>
          <div className="text-sm text-muted">{doneTotal}/{plannedTotal} Einheiten</div>
        </div>
        <div className="flex items-end gap-1 h-24">
          {freq.map((f) => (
            <button key={f.week} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" onClick={() => setWeek(f.week)} title={`Woche ${f.week}: ${f.done}/${f.planned} Einheiten, ${f.minutes} min`}>
              <div className="text-[10px] text-muted mb-0.5">{f.done}/{f.planned}</div>
              <div className={`w-full max-w-8 rounded-t ${f.week === w ? 'bg-accent' : 'bg-accent/50'}`} style={{ height: `${Math.max(3, (f.done / Math.max(1, f.planned)) * 64)}px` }} />
              <div className={`text-[10px] mt-0.5 ${f.week === w ? 'text-text' : 'text-muted'}`}>W{f.week}</div>
            </button>
          ))}
        </div>
        <div className="text-xs text-muted">Erledigte von geplanten Einheiten je Woche. Tippe auf eine Woche, um unten ihr Volumen zu sehen.</div>
      </section>

      {/* Volumen */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button className="btn-ghost px-3 py-1.5" disabled={w <= 1} onClick={() => setWeek(w - 1)} aria-label="Vorige Woche">‹</button>
          <div className="text-center min-w-0">
            <div className="h2">Sätze pro Muskelgruppe</div>
            <div className="text-xs text-muted">Woche {w} · {blockLabel(w)}</div>
          </div>
          <button className="btn-ghost px-3 py-1.5" disabled={w >= WEEKS.length} onClick={() => setWeek(w + 1)} aria-label="Nächste Woche">›</button>
        </div>
        <div className="space-y-1.5">
          {GROUP_NAMES.map((g) => {
            const v = volume?.[g] ?? 0
            const prev = volumePrev?.[g]
            return (
              <div key={g} className="flex items-center gap-2 text-sm">
                <div className="w-28 shrink-0 truncate text-muted">{g}</div>
                <div className="flex-1 h-4 relative">
                  {prev !== undefined && prev > 0 && <div className="absolute top-0 bottom-0 w-0.5 bg-muted z-10" style={{ left: `calc(${(prev / volMax) * 100}% - 1px)` }} />}
                  <div className="h-full rounded-r bg-accent" style={{ width: `${(v / volMax) * 100}%` }} />
                </div>
                <div className="w-9 text-right tabular-nums">{num(v)}</div>
              </div>
            )
          })}
        </div>
        <div className="text-xs text-muted">Gezählt werden Kraftsätze inklusive Max-Tests: Hauptmuskel 1 Satz, Hilfsmuskel 0,5. AMRAP, Intervalle und Challenge zählen unten bei den Wiederholungen.{volumePrev ? ' Der graue Strich zeigt die Vorwoche.' : ''}</div>
      </section>

      {/* Wiederholungen */}
      <section className="card space-y-3">
        <div className="h2">Wiederholungen gesamt</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted text-right">
              <th className="text-left font-normal py-1">Übung</th>
              <th className="font-normal w-[38%] text-left pl-2">Verlauf je Woche</th>
              <th className="font-normal">W{w}</th>
              <th className="font-normal">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {REP_GROUPS.map((g) => {
              const perWeek = repWeeks.map((n) => reps?.get(n)?.[g.key] ?? 0)
              const max = Math.max(1, ...perWeek)
              const total = weeksWithReps.reduce((a, n) => a + (reps?.get(n)?.[g.key] ?? 0), 0) + (reps?.get(0)?.[g.key] ?? 0)
              return (
                <tr key={g.key} className="border-t border-line text-right tabular-nums">
                  <td className="text-left py-2">{g.label}</td>
                  <td className="pl-2">
                    <div className="flex items-end gap-0.5 h-6">
                      {perWeek.map((v, i) => <div key={i} title={`Woche ${i + 1}: ${v}`} className={`flex-1 max-w-3 rounded-t-sm ${i + 1 === w ? 'bg-accent' : 'bg-accent/50'}`} style={{ height: `${v === 0 ? 1 : Math.max(2, (v / max) * 24)}px` }} />)}
                    </div>
                  </td>
                  <td>{num(reps?.get(w)?.[g.key] ?? 0)}</td>
                  <td className="font-semibold">{num(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="text-xs text-muted">Alle gespeicherten Wiederholungen: Sätze, Tests, AMRAP-Runden und Challenge.</div>
      </section>

      {/* Benchmarks */}
      <section className="card space-y-3">
        <div className="h2">Benchmarks</div>
        {series.length === 0 && <div className="text-sm text-muted">Die Tests aus Woche 1 erscheinen hier, ab dem zweiten Test mit Verlauf.</div>}
        {series.filter((s) => !isMobilityBenchmark(s.key)).map((s) => <BenchmarkRow key={s.key} s={s} />)}
      </section>

      {/* Mobility */}
      <section className="card space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="h2">Mobility</div>
          <div className="text-sm text-muted">{mobility.reduce((a, m) => a + m.sessions, 0)} Routinen</div>
        </div>
        <div className="flex items-end gap-1 h-16">
          {mobility.map((m) => (
            <div key={m.week} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" title={`Woche ${m.week}: ${m.sessions} Routinen, ${m.minutes} min`}>
              <div className="text-[10px] text-muted mb-0.5">{m.sessions}</div>
              <div className="w-full max-w-8 rounded-t bg-accent/50" style={{ height: `${Math.max(3, Math.min(1, m.sessions / 2) * 40)}px` }} />
              <div className="text-[10px] mt-0.5 text-muted">W{m.week}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted">Mobility-Routinen je Woche (Ziel 2). Der Mobility-Check zählt nicht mit.</div>
        {series.some((s) => isMobilityBenchmark(s.key)) && (
          <>
            <div className="label pt-1">Mobility-Check</div>
            {series.filter((s) => isMobilityBenchmark(s.key)).map((s) => <BenchmarkRow key={s.key} s={s} />)}
            <div className="text-xs text-muted">Änderungen unter 2 cm sind Messrauschen. Bei Überkopf-Reach und 90/90 ist kleiner besser.</div>
          </>
        )}
      </section>

      {/* Bio-Force-Bestwerte */}
      {records.length > 0 && (
        <section className="card space-y-2">
          <div className="h2">Schwerste Sätze an der Bio Force</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted text-right">
                <th className="text-left font-normal py-1">Übung</th>
                <th className="font-normal">Start</th>
                <th className="font-normal">Bestwert</th>
                <th className="font-normal">Wdh.</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.exerciseId} className="border-t border-line text-right tabular-nums">
                  <td className="text-left py-1.5"><Link to={`/exercises/${r.exerciseId}`}>{ex(r.exerciseId).name}</Link></td>
                  <td className="text-muted">{fmtLb(kgToLb(r.firstWeightKg))}</td>
                  <td className="font-semibold">{fmtLb(kgToLb(r.weightKg))} lb</td>
                  <td>{r.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted">Skalenwert in lb pro Seite. Den Verlauf jeder Übung findest du über den Übungsnamen.</div>
        </section>
      )}

      {/* Cardio */}
      {cardio.length > 0 && (
        <section className="card space-y-3">
          <div className="h2">Cardio</div>
          {hrPoints.length > 1 && <div><div className="label mb-1">Ø Puls (Schläge/min)</div><TrendChart data={hrPoints} unit="S/min" whole /></div>}
          {pacePoints.length > 1 && <div><div className="label mb-1">Tempo (min/km, niedriger ist schneller)</div><TrendChart data={pacePoints} unit="min/km" /></div>}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted text-right">
                <th className="text-left font-normal py-1">Datum</th>
                <th className="text-left font-normal">Einheit</th>
                <th className="font-normal">min</th>
                <th className="font-normal">m</th>
                <th className="font-normal">Puls</th>
              </tr>
            </thead>
            <tbody>
              {[...cardio].reverse().slice(0, 12).map((c, i) => (
                <tr key={i} className="border-t border-line text-right tabular-nums">
                  <td className="text-left py-1.5 text-muted">{shortDate(c.date)}</td>
                  <td className="text-left truncate">{ex(c.exerciseId).name}</td>
                  <td>{c.minutes ? num(c.minutes) : '–'}</td>
                  <td>{c.distanceM ? num(c.distanceM) : '–'}</td>
                  <td>{c.avgHr ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Kurz-Check */}
      {(kneePoints.length > 1 || sleepPoints.length > 1) && (
        <section className="card space-y-3">
          <div className="h2">Kurz-Check</div>
          {kneePoints.length > 1 && <div><div className="label mb-1">Knie (0 = ruhig, 10 = stark)</div><TrendChart data={kneePoints} unit="/10" height="h-28" whole /></div>}
          {sleepPoints.length > 1 && <div><div className="label mb-1">Schlaf (Stunden)</div><TrendChart data={sleepPoints} unit="h" height="h-28" /></div>}
        </section>
      )}
    </div>
  )
}
