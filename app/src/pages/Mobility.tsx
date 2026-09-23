import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { MOBILITY_CHECK_KEY, MOBILITY_ROUTINES, MOBILITY_SESSIONS } from '../data/mobility'
import { timedMinutes } from '../data/planTypes'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { fmtDate, today } from '../lib/dates'
import { mobilityCheckStatus, routineStatus, todaysRoutine } from '../lib/mobility'
import { timedItemText } from '../lib/planEngine'
import { benchmarkSeries } from '../lib/stats'
import { BENCHMARK_LABELS, isMobilityBenchmark } from '../lib/workouts'
import { fmtDec } from '../lib/decimal'

export default function Mobility() {
  const profile = useProfile()
  const date = today()
  const workouts = useLiveQuery(() => (profile ? db.workouts.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const benchmarks = useLiveQuery(() => (profile ? db.benchmarks.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const start = profile?.planStartDate ?? ''
  const status = useMemo(() => routineStatus(workouts ?? [], start, date), [workouts, start, date])
  const checks = useMemo(() => (start ? mobilityCheckStatus(start, workouts ?? [], date) : []), [start, workouts, date])
  const suggested = todaysRoutine(date, status.last)
  const series = useMemo(() => {
    const order = Object.keys(BENCHMARK_LABELS)
    return benchmarkSeries(benchmarks ?? []).filter((s) => isMobilityBenchmark(s.key)).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  }, [benchmarks])
  const check = MOBILITY_SESSIONS.find((s) => s.key === MOBILITY_CHECK_KEY)!
  if (!profile) return null

  return (
    <div className="space-y-4">
      <header>
        <h1 className="h1">Mobility</h1>
        <div className="text-muted text-sm">Zwei Routinen à 15 min für Samstag und Sonntag, dazu die Dehnungen in den Cool-downs. Diese Woche: {status.thisWeek} {status.thisWeek === 1 ? 'Routine' : 'Routinen'}.</div>
      </header>

      {MOBILITY_ROUTINES.map((s) => {
        const seg = s.segments[0]
        const items = seg.type === 'timed' ? seg.items : []
        const doneToday = status.doneToday.includes(s.key)
        const last = status.last[s.key]
        return (
          <section key={s.key} className={`card space-y-2 ${s.key === suggested.key ? '!border-accent/60' : ''}`}>
            <div>
              <div className="label">{s.key === suggested.key ? 'Vorschlag für heute' : 'Routine'} · {timedMinutes(items)} min</div>
              <div className="text-xl font-bold leading-tight">{s.title.replace('Mobility: ', '')}</div>
              <div className="text-muted text-sm">{s.focus}</div>
            </div>
            {doneToday && <div className="rounded-xl bg-ok/10 border border-ok/40 p-2 text-ok text-sm">Heute erledigt ✓</div>}
            {!doneToday && last && <div className="text-xs text-muted">Zuletzt {fmtDate(last)}</div>}
            <div className="flex gap-2">
              <Link to={`/workout/${date}/${s.key}`} className="btn-primary flex-1 text-center">{doneToday ? 'Nochmal' : 'Starten'}</Link>
              <Link to={`/session/${date}/${s.key}`} className="btn-ghost text-center">Ablauf</Link>
            </div>
            <details className="text-sm">
              <summary className="text-muted cursor-pointer">Posten anzeigen</summary>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">{items.map((it, i) => <li key={i}>{timedItemText(it)}</li>)}</ul>
            </details>
          </section>
        )
      })}

      <section className="card space-y-3">
        <div>
          <div className="label">Mobility-Check · ca. {check.minutes} min</div>
          <div className="text-xl font-bold leading-tight">Vier Messungen</div>
          <div className="text-muted text-sm">Knie zur Wand, Sit-and-Reach, Überkopf-Reach, 90/90. In Woche 1 als Basis, dann in jeder Challenge-Woche. Zollstock bereitlegen.</div>
        </div>
        <div className="divide-y divide-line text-sm">
          {checks.map((c) => (
            <div key={c.week} className="py-1.5 flex items-center justify-between gap-2">
              <span>{c.label} <span className="text-muted">· {fmtDate(c.from)} bis {fmtDate(c.to)}</span></span>
              {c.status === 'fertig' && <span className="text-ok">✓ {fmtDate(c.doneDate!)}</span>}
              {c.status === 'faellig' && <span className="text-accent font-semibold">{date <= c.to ? 'fällig' : 'verpasst'}</span>}
              {c.status === 'offen' && <span className="text-muted">offen</span>}
            </div>
          ))}
        </div>
        <Link to={`/workout/${date}/${MOBILITY_CHECK_KEY}`} className="btn-primary block text-center">Mobility-Check starten</Link>
        <div className="text-xs text-muted">Dazu gehören zwei Fotos zum Foto-Check-Termin: tiefe Kniebeuge von der Seite, Überkopf-Kniebeuge von vorn. <Link to="/photos" className="text-accent">Zum Foto-Check ›</Link></div>
      </section>

      {series.length > 0 && (
        <section className="card space-y-2">
          <div className="h2">Messwerte</div>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-muted text-right"><th className="text-left font-normal py-1">Test</th><th className="font-normal">Basis</th><th className="font-normal">Zuletzt</th></tr></thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.key} className="border-t border-line">
                  <td className="py-1.5">{BENCHMARK_LABELS[s.key] ?? s.key}</td>
                  <td className="text-right tabular-nums text-muted">{fmtDec(s.first)}</td>
                  <td className="text-right tabular-nums font-semibold">{fmtDec(s.latest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted">Verlauf mit Diagramm unter Analyse → Benchmarks. Änderungen unter 2 cm sind Messrauschen.</div>
        </section>
      )}

      <section className="card text-sm text-muted space-y-1">
        <div className="h2 text-text">Warum so</div>
        <div>Für dauerhafte Beweglichkeit reichen etwa 10 Minuten Dehnen pro Woche je Region, ob täglich oder an zwei Tagen ist egal. Statisches Dehnen gehört nach das Training, vorher kostet es Kraft. Das Krafttraining über die volle Amplitude macht den Rest. Details und Quellen in <span className="text-text">docs/Mobility.md</span>.</div>
      </section>
    </div>
  )
}
