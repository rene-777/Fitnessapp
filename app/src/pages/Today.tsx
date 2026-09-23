import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { EXERCISE_MAP } from '../data/exercises'
import { WEEKS, weekByNumber } from '../data/plan'
import { fmtLb, kgToLb } from '../lib/bioforce'
import { fmtBody } from '../lib/decimal'
import { latestKnee, latestRecord, lastPerformance, nextMilestone, planProgress, sessionStreak, totals } from '../lib/dashboard'
import { WEEKDAY_SHORT, dateOf, fmtDate, fmtDateLong, fmtSec, parseISO, today } from '../lib/dates'
import { blockLabel, dayInfo, sessionExerciseIds } from '../lib/planEngine'
import { MOBILITY_CHECK_KEY } from '../data/mobility'
import { dueMobilityCheck, routineStatus, todaysRoutine } from '../lib/mobility'

const RING_R = 42
const RING_C = 2 * Math.PI * RING_R

/** Fortschrittsring: füllt sich nach dem Einblenden von 0 auf den Zielwert. */
function Ring({ progress, big, small }: { progress: number; big: string; small: string }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(progress))
    return () => cancelAnimationFrame(id)
  }, [progress])
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" className="shrink-0" role="img" aria-label={`${big} ${small}, ${Math.round(progress * 100)} % des Plans`}>
      <circle cx="52" cy="52" r={RING_R} fill="none" stroke="var(--color-card2)" strokeWidth="9" />
      <circle
        cx="52" cy="52" r={RING_R} fill="none" stroke="var(--color-accent)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${Math.max(0.01, shown * RING_C)} ${RING_C}`} transform="rotate(-90 52 52)"
        style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
      <text x="52" y="52" textAnchor="middle" fill="var(--color-text)" fontSize="24" fontWeight="700">{big}</text>
      <text x="52" y="69" textAnchor="middle" fill="var(--color-muted)" fontSize="11">{small}</text>
    </svg>
  )
}

const fmtHours = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`)

export default function Today() {
  const profile = useProfile()
  const date = today()
  const info = profile ? dayInfo(date, profile.planStartDate) : undefined
  const workouts = useLiveQuery(() => (profile ? db.workouts.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const sets = useLiveQuery(() => (profile ? db.sets.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const benchmarks = useLiveQuery(() => (profile ? db.benchmarks.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const body = useLiveQuery(() => (profile ? db.body.where('profileId').equals(profile.id).sortBy('date') : []), [profile?.id])

  const start = profile?.planStartDate ?? ''
  const sum = useMemo(() => totals(workouts ?? []), [workouts])
  const streak = useMemo(() => (start ? sessionStreak(workouts ?? [], start, date) : 0), [workouts, start, date])
  const record = useMemo(() => latestRecord(sets ?? [], benchmarks ?? []), [sets, benchmarks])
  const lastTime = useMemo(() => (info?.session && sets ? lastPerformance(info.session, sets) : undefined), [info?.session, sets])
  const knee = useMemo(() => latestKnee(workouts ?? []), [workouts])
  const mob = useMemo(() => routineStatus(workouts ?? [], start, date), [workouts, start, date])
  const dueCheck = useMemo(() => (start ? dueMobilityCheck(start, workouts ?? [], date) : undefined), [start, workouts, date])
  const routine = todaysRoutine(date, mob.last)

  if (!profile || !info) return null
  const inPlan = info.week > 0 && info.week <= WEEKS.length
  const daysToStart = Math.round((parseISO(start).getTime() - parseISO(date).getTime()) / 86400000)
  const milestone = nextMilestone(date, start)
  const statusOf = (key: string) => workouts?.filter((w) => w.sessionKey === key && !w.deleted).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]
  const weights = (body ?? []).filter((r) => !r.deleted && r.weightKg)
  const weight = weights[weights.length - 1]?.weightKg
  const weightDelta = weights.length > 1 ? Math.round((weight! - weights[0].weightKg!) * 10) / 10 : undefined
  const stripWeek = inPlan ? info.week : 1
  const stripSessions = weekByNumber(stripWeek)?.sessions ?? []

  return (
    <div className="space-y-4">
      {/* Kopf mit Fortschrittsring */}
      <header className="flex items-center gap-4">
        {info.kind === 'vorher'
          ? <Ring progress={0} big={String(daysToStart)} small={daysToStart === 1 ? 'Tag' : 'Tage'} />
          : <Ring progress={planProgress(date, start)} big={info.kind === 'nachher' ? '16' : `W${info.week}`} small="von 16" />}
        <div className="min-w-0">
          <div className="label">{fmtDateLong(date)}</div>
          <h1 className="h1 leading-tight">Hallo {profile.name}</h1>
          <div className="text-muted text-sm">{info.kind === 'vorher' ? `Start am ${fmtDate(start, { weekday: 'long', day: '2-digit', month: '2-digit' })}` : inPlan ? blockLabel(info.week) : 'Plan abgeschlossen'}</div>
          {sum.sessions > 0 && <div className="text-accent2 text-sm">{sum.sessions} {sum.sessions === 1 ? 'Einheit' : 'Einheiten'}{sum.minutes > 0 ? ` · ${fmtHours(sum.minutes)}` : ''}</div>}
        </div>
      </header>

      {/* Heute */}
      {info.kind === 'vorher' && (
        <div className="card !border-accent/60 space-y-3">
          <div>
            <div className="label">Bis zum Start</div>
            <div className="h2">Woche 1 kennenlernen</div>
            <div className="text-muted text-sm">Übungen anschauen, Bio Force einstellen, Körpergewicht eintragen, Startfotos machen.</div>
          </div>
          <div className="flex gap-2">
            <Link to="/session/2026-09-21/w1-push" className="btn-primary flex-1 text-center">Woche 1 Vorschau</Link>
            <Link to="/exercises" className="btn-ghost text-center">Übungen</Link>
            <Link to="/photos" className="btn-ghost text-center">Fotos</Link>
          </div>
        </div>
      )}

      {info.kind === 'training' && info.session && (() => {
        const w = statusOf(info.session.key)
        const s = info.session
        const names = sessionExerciseIds(s).map((id) => EXERCISE_MAP[id]).filter((e) => e && e.category !== 'warmup' && e.category !== 'cardio' && e.category !== 'mobility').slice(0, 3).map((e) => e.name.replace(/ \(.*\)$/, ''))
        return (
          <div className="card !border-accent/60 space-y-3">
            <div>
              <div className="label">Heute · ca. {s.minutes} min</div>
              <div className="text-xl font-bold leading-tight">{s.title}</div>
              <div className="text-muted text-sm">{names.length > 0 ? names.join(' · ') : s.focus}</div>
            </div>
            {lastTime && w?.status !== 'fertig' && (
              <div className="rounded-lg bg-card2 px-3 py-2 text-sm">
                <span className="text-muted">Letztes Mal · </span>{EXERCISE_MAP[lastTime.exerciseId].name}: <span className="font-semibold">{fmtLb(kgToLb(lastTime.weightKg))} lb × {lastTime.reps.join('/')}</span>
              </div>
            )}
            {w?.status === 'fertig' && <div className="rounded-xl bg-ok/10 border border-ok/40 p-3 text-ok">Erledigt ✓ {w.durationMin ? `· ${w.durationMin} min` : ''}</div>}
            <div className="flex gap-2">
              <Link to={`/workout/${date}/${s.key}`} className="btn-primary flex-1 text-center">
                {w?.status === 'laufend' ? 'Fortsetzen' : w?.status === 'fertig' ? 'Nochmal öffnen' : 'Training starten'}
              </Link>
              <Link to={`/session/${date}/${s.key}`} className="btn-ghost text-center">Vorschau</Link>
            </div>
          </div>
        )
      })()}

      {info.kind === 'puffer' && (() => {
        const open = stripSessions.filter((s) => statusOf(s.key)?.status !== 'fertig')
        return (
          <div className="card !border-accent/60 space-y-3">
            <div><div className="label">Heute</div><div className="text-xl font-bold leading-tight">Samstag: Puffer</div></div>
            {open.length === 0 ? (
              <div className="text-muted text-sm">Alle Einheiten der Woche sind erledigt. Optional: 30–45 min Zone 2 locker laufen, oder frei.</div>
            ) : (
              <>
                <div className="text-muted text-sm">Offene Einheiten dieser Woche zum Nachholen:</div>
                {open.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2 border-t border-line pt-2">
                    <div><div className="font-semibold">{s.title}</div><div className="text-xs text-muted">{s.minutes} min</div></div>
                    <Link to={`/workout/${date}/${s.key}`} className="btn-primary px-3 py-2 text-sm">Nachholen</Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })()}

      {info.kind === 'ruhe' && <div className="card"><div className="label">Heute</div><div className="text-xl font-bold leading-tight">Ruhetag</div><div className="text-muted text-sm">Regeneration ist Teil des Plans. Spazieren, Mobility, schlafen.</div></div>}

      {/* Mobility: Check, wenn fällig; Routine an freien Tagen als Karte, an Trainingstagen als Zeile */}
      {dueCheck && (
        <Link to={`/workout/${date}/${MOBILITY_CHECK_KEY}`} className="card block !border-accent/60 space-y-1">
          <div className="label text-accent">Mobility-Check fällig · {dueCheck.label}</div>
          <div className="font-semibold">Vier Messungen, ca. 10 min</div>
          <div className="text-xs text-muted">Bis {fmtDate(dueCheck.to)} · Zollstock bereitlegen · Tippen zum Starten</div>
        </Link>
      )}
      {(info.kind === 'puffer' || info.kind === 'ruhe') && (
        <div className="card space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="label">Mobility · {routine.minutes} min</div>
            <div className="text-xs text-muted">{mob.thisWeek}/2 diese Woche</div>
          </div>
          <div className="font-semibold leading-tight">{routine.title.replace('Mobility: ', '')}</div>
          <div className="text-xs text-muted">{routine.focus}</div>
          {mob.doneToday.includes(routine.key)
            ? <div className="rounded-xl bg-ok/10 border border-ok/40 p-2 text-ok text-sm">Heute erledigt ✓</div>
            : (
              <div className="flex gap-2">
                <Link to={`/workout/${date}/${routine.key}`} className="btn-primary flex-1 text-center">Starten</Link>
                <Link to="/mobility" className="btn-ghost text-center">Andere</Link>
              </div>
            )}
        </div>
      )}
      {info.kind === 'frei' && <div className="card"><div className="label">Heute</div><div className="text-xl font-bold leading-tight">Kein Training geplant</div><div className="text-muted text-sm">Die Einheiten dieses Blocks werden nach Block 1 ergänzt.</div></div>}
      {info.kind === 'nachher' && <div className="card"><div className="text-xl font-bold leading-tight">Plan abgeschlossen</div><div className="text-muted text-sm">16 Wochen geschafft. Zeit für den Retest und den nächsten Plan.</div></div>}

      {/* Wochenstreifen */}
      <Link to={`/week/${stripWeek}`} className="card block space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="label">{inPlan ? 'Diese Woche' : 'Woche 1'} · {weekByNumber(stripWeek)?.title}</div>
          <div className="text-xs text-muted">{stripSessions.filter((s) => statusOf(s.key)?.status === 'fertig').length}/{stripSessions.length}</div>
        </div>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
            const s = stripSessions.find((x) => x.weekday === wd)
            const d = dateOf(start, stripWeek, wd)
            const done = s && statusOf(s.key)?.status === 'fertig'
            const isToday = d === date
            const missed = s && !done && d < date
            const cls = done ? 'bg-accent text-black font-bold' : isToday ? 'border-2 border-accent text-text' : s ? `border ${missed ? 'border-dashed border-muted text-muted' : 'border-line text-text'}` : 'text-muted'
            return <div key={wd} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs ${cls}`}>{done ? '✓' : WEEKDAY_SHORT[wd]}</div>
          })}
        </div>
      </Link>

      {/* Meilenstein */}
      {milestone && (
        <Link to={`/week/${milestone.week}`} className="card flex items-center justify-between gap-3">
          <div><div className="label">{milestone.days > 0 ? 'Nächster Meilenstein' : 'Aktuell'}</div><div className="font-semibold">{milestone.label}</div></div>
          {milestone.days > 0 && <div className="text-right leading-none"><span className="text-3xl font-bold text-accent tabular-nums">{milestone.days}</span><div className="text-xs text-muted mt-1">{milestone.days === 1 ? 'Tag' : 'Tage'}</div></div>}
        </Link>
      )}

      {/* Kennzahlen */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/stats" className="card !p-3">
          <div className="text-2xl font-bold tabular-nums">{streak}</div>
          <div className="text-xs text-muted">{streak === 1 ? 'Einheit' : 'Einheiten'} in Folge</div>
        </Link>
        <Link to="/body" className="card !p-3">
          <div className="text-2xl font-bold tabular-nums">{weight ? fmtBody(weight) : '–'}</div>
          <div className="text-xs text-muted">kg{weightDelta !== undefined && weightDelta !== 0 ? ` · ${weightDelta > 0 ? '+' : '−'}${fmtBody(Math.abs(weightDelta))}` : weight ? '' : ' eintragen'}</div>
        </Link>
        <Link to="/stats" className="card !p-3">
          <div className="text-2xl font-bold tabular-nums">{knee ?? '–'}{knee !== undefined && <span className="text-sm font-normal text-muted">/10</span>}</div>
          <div className="text-xs text-muted">Knie zuletzt</div>
        </Link>
      </div>

      {/* Neuer Bestwert */}
      {record && (
        <Link to="/stats" className="card block">
          <div className="label">Neuer Bestwert · {fmtDate(record.date, { day: '2-digit', month: '2-digit' })}</div>
          <div className="font-semibold">
            {record.title}{' '}
            <span className="text-accent">
              {record.kind === 'load' ? `${fmtLb(kgToLb(record.weightKg!))} lb × ${record.reps}` : (record.unit === 'seconds' ? `${fmtSec(record.previous!)} → ${fmtSec(record.value!)} min` : `${record.previous!.toLocaleString('de-DE')} → ${record.value!.toLocaleString('de-DE')}`)}
            </span>
          </div>
        </Link>
      )}

      <div className="flex justify-center gap-4 text-sm text-muted py-1">
        <Link to="/log">Einheit nachtragen ›</Link>
        {info.kind === 'training' && <Link to="/mobility">Mobility ›</Link>}
      </div>
    </div>
  )
}
