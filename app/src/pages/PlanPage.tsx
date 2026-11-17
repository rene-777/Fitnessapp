import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { BLOCKS, CHALLENGE_TARGETS, PLAN_NAME, WEEKS, weekByNumber } from '../data/plan'
import { useProfile } from '../hooks/useProfile'
import { addDays, fmtDate, isPausedDate, mondayOfWeek, planWeekOf, today } from '../lib/dates'
import { calOf } from '../lib/planShift'
import { db } from '../db/db'
import { latestBenchmark } from '../lib/planEngine'

export default function PlanPage() {
  const profile = useProfile()
  const benchmarks = useLiveQuery(() => (profile ? db.benchmarks.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  if (!profile) return null
  const cal = calOf(profile)
  const current = planWeekOf(today(), cal)
  const fmtShort = (d: string) => fmtDate(d, { day: '2-digit', month: '2-digit' })
  const planEnd = addDays(mondayOfWeek(cal, WEEKS.length), 6)
  return (
    <div className="space-y-4">
      <header>
        <h1 className="h1">{PLAN_NAME}</h1>
        <div className="text-muted text-sm">{WEEKS.length} Wochen ab {fmtDate(profile.planStartDate, { day: '2-digit', month: '2-digit', year: 'numeric' })} bis {fmtDate(planEnd, { day: '2-digit', month: '2-digit', year: 'numeric' })} · 5 Tage pro Woche, Samstag Puffer{profile.pauses?.length ? ` · ${profile.pauses.length} ${profile.pauses.length === 1 ? 'Pausenwoche' : 'Pausenwochen'}` : ''}</div>
      </header>
      {BLOCKS.map((b) => (
        <section key={b.number} className="card space-y-2">
          <div>
            <div className="label">Block {b.number}</div>
            <div className="h2">{b.name}</div>
            <div className="text-sm text-muted">{b.focus}</div>
            <div className="text-xs text-accent2 mt-1">{b.repRange}</div>
          </div>
          <div className="divide-y divide-line">
            {b.weeks.map((n) => {
              const w = weekByNumber(n)!
              const isCurrent = n === current
              const monday = mondayOfWeek(cal, n)
              const pauseBefore = isPausedDate(addDays(monday, -7), cal)
              return (
               <div key={n}>
                {pauseBefore && <div className="py-2 text-xs text-accent2">Pause bis {fmtShort(addDays(monday, -1))} · der Plan ruht (aufheben in Woche {n})</div>}
                <Link to={`/week/${n}`} className={`flex items-center justify-between py-2 ${isCurrent ? 'text-accent' : ''}`}>
                  <div>
                    <div className="font-semibold">Woche {n}: {w.title}</div>
                    <div className="text-xs text-muted">ab {fmtShort(monday)} · {w.sessions.length > 0 ? `${w.sessions.length} Einheiten` : 'folgt'}</div>
                  </div>
                  <span className="text-muted">›</span>
                </Link>
               </div>
              )
            })}
          </div>
        </section>
      ))}
      <section className="card space-y-2">
        <div className="h2">Challenge Woche 4: Wochenziele</div>
        <div className="text-sm text-muted">Berechnet aus deinen Tests in Woche 1. Solange keine Tests vorliegen, gelten Schätzwerte.</div>
        <table className="w-full text-sm">
          <tbody>
            {CHALLENGE_TARGETS.map((t) => {
              const b = benchmarks ? latestBenchmark(benchmarks, t.benchmarkKey) : undefined
              const target = Math.round((b !== undefined ? b * t.factor : t.fallback) / 10) * 10
              return (
                <tr key={t.exerciseId} className="border-t border-line">
                  <td className="py-1.5">{t.label}</td>
                  <td className="py-1.5 text-muted text-xs">{t.factor} × {b !== undefined ? b : 'Schätzung'}</td>
                  <td className="py-1.5 text-right font-semibold">{target}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
