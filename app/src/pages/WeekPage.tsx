import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { WEEKDAY_SHORT, dateOf, fmtDate, planWeekOf, today } from '../lib/dates'
import { blockLabel } from '../lib/planEngine'
import { WEEKS, weekByNumber } from '../data/plan'

export default function WeekPage() {
  const profile = useProfile()
  const params = useParams()
  const current = profile ? Math.min(Math.max(planWeekOf(today(), profile.planStartDate), 1), WEEKS.length) : 1
  const n = params.n ? Number(params.n) : current
  const week = weekByNumber(n)
  const workouts = useLiveQuery(() => (profile ? db.workouts.where('[profileId+week]').equals([profile.id, n]).toArray() : []), [profile?.id, n])
  if (!profile || !week) return null
  const todayStr = today()

  const statusOf = (key: string) => workouts?.filter((w) => w.sessionKey === key && !w.deleted).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <Link to={`/week/${Math.max(1, n - 1)}`} className="btn-ghost px-3 py-2">‹</Link>
        <div className="text-center">
          <div className="label">{blockLabel(n)}</div>
          <h1 className="h2">Woche {n}: {week.title}</h1>
        </div>
        <Link to={`/week/${Math.min(WEEKS.length, n + 1)}`} className="btn-ghost px-3 py-2">›</Link>
      </header>
      {week.note && <div className="card text-sm text-muted">{week.note}</div>}

      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
          const date = dateOf(profile.planStartDate, n, wd)
          const session = week.sessions.find((s) => s.weekday === wd)
          const w = session ? statusOf(session.key) : undefined
          const isToday = date === todayStr
          const past = date < todayStr
          let chip = ''
          let chipCls = 'chip'
          if (session) {
            if (w?.status === 'fertig') { chip = 'erledigt'; chipCls = 'chip-accent' }
            else if (w?.status === 'laufend') { chip = 'begonnen'; chipCls = 'chip-accent' }
            else if (past) { chip = 'offen'; chipCls = 'chip text-warn border-warn/40' }
            else chip = 'geplant'
          }
          const inner = (
            <div className={`card flex items-center gap-3 ${isToday ? 'border-accent' : ''}`}>
              <div className="w-12 text-center">
                <div className="font-bold">{WEEKDAY_SHORT[wd]}</div>
                <div className="text-xs text-muted">{fmtDate(date, { day: '2-digit', month: '2-digit' })}</div>
              </div>
              <div className="flex-1 min-w-0">
                {session ? (
                  <>
                    <div className="font-semibold truncate">{session.title}</div>
                    <div className="text-xs text-muted">{session.focus} · {session.minutes} min{w?.date && w.date !== date ? ` · nachgeholt am ${fmtDate(w.date)}` : ''}</div>
                  </>
                ) : (
                  <div className="text-muted">{wd === 6 ? 'Puffer / optional Zone 2' : wd === 7 ? 'Ruhetag' : 'frei'}</div>
                )}
              </div>
              {chip && <span className={chipCls}>{chip}</span>}
            </div>
          )
          return session ? <Link key={wd} to={`/session/${date}/${session.key}`}>{inner}</Link> : <div key={wd}>{inner}</div>
        })}
      </div>
    </div>
  )
}
