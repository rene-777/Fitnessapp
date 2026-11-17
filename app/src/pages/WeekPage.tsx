import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { saveProfile, useProfile } from '../hooks/useProfile'
import { WEEKDAY_SHORT, addDays, dateOf, fmtDate, isPausedDate, mondayOfWeek, planWeekOf, today, weekdayOf } from '../lib/dates'
import { calOf, withPause, withoutMoves, withoutPause } from '../lib/planShift'
import { blockLabel } from '../lib/planEngine'
import { WEEKS, weekByNumber } from '../data/plan'

export default function WeekPage() {
  const profile = useProfile()
  const params = useParams()
  const cal = profile ? calOf(profile) : ''
  const current = profile ? Math.min(Math.max(planWeekOf(today(), cal), 1), WEEKS.length) : 1
  const n = params.n ? Number(params.n) : current
  const week = weekByNumber(n)
  const workouts = useLiveQuery(() => (profile ? db.workouts.where('[profileId+week]').equals([profile.id, n]).toArray() : []), [profile?.id, n])
  if (!profile || !week) return null
  const todayStr = today()

  const monday = mondayOfWeek(cal, n)
  const fmtShort = (d: string) => fmtDate(d, { day: '2-digit', month: '2-digit' })
  // Pausenwoche direkt vor dieser Planwoche (mehrere hintereinander: die letzte; sie lassen sich einzeln aufheben)
  const pauseBefore = isPausedDate(addDays(monday, -7), cal) ? addDays(monday, -7) : undefined
  const canPause = addDays(monday, 6) >= todayStr // laufende und kommende Wochen
  const moved = week.sessions.filter((s) => weekdayOf(s, cal) !== s.weekday)
  const pause = () => {
    if (confirm(`Woche ${n} pausieren?

Die Kalenderwoche ${fmtShort(monday)}–${fmtShort(addDays(monday, 6))} wird zur Pause. Woche ${n} beginnt dann am ${fmtShort(addDays(monday, 7))}, alle folgenden Wochen und das Plan-Ende rücken eine Woche nach hinten. Die Pause lässt sich wieder aufheben.`)) void saveProfile(withPause(profile, monday))
  }

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
      {pauseBefore && (
        <div className="card flex items-center justify-between gap-3 !border-accent/50">
          <div className="text-sm"><span className="label text-accent">Pause davor</span><div>{fmtShort(pauseBefore)}–{fmtShort(addDays(pauseBefore, 6))}: der Plan ruht</div></div>
          <button className="btn-ghost px-3 py-1.5 text-sm shrink-0" onClick={() => { if (confirm('Pause aufheben? Diese und alle folgenden Wochen rücken wieder eine Woche nach vorn.')) void saveProfile(withoutPause(profile, pauseBefore)) }}>Aufheben</button>
        </div>
      )}
      {week.note && <div className="card text-sm text-muted">{week.note}</div>}

      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
          const date = dateOf(cal, n, wd)
          const session = week.sessions.find((s) => weekdayOf(s, cal) === wd)
          const isMoved = session && session.weekday !== wd
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
                    <div className="text-xs text-muted">{isMoved ? `verschoben von ${WEEKDAY_SHORT[session.weekday]} · ` : ''}{session.focus} · {session.minutes} min{w?.date && w.date !== date ? ` · nachgeholt am ${fmtDate(w.date)}` : ''}</div>
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

      {week.sessions.length > 0 && <div className="text-xs text-muted px-1">Einheit auf einen anderen Tag legen: Einheit antippen, dann „Tag in dieser Woche“.</div>}
      {(moved.length > 0 || canPause) && (
        <div className="flex gap-2">
          {moved.length > 0 && <button className="btn-ghost flex-1 text-sm" onClick={() => void saveProfile(withoutMoves(profile, week))}>Plan-Tage wiederherstellen</button>}
          {canPause && <button className="btn-ghost flex-1 text-sm" onClick={pause}>Woche pausieren</button>}
        </div>
      )}
    </div>
  )
}
