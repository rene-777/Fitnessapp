import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import ExerciseCard from '../components/ExerciseCard'
import { EXERCISE_MAP, ex } from '../data/exercises'
import { findSession } from '../data/plan'
import { db } from '../db/db'
import type { Workout } from '../db/types'
import { saveProfile, useProfile } from '../hooks/useProfile'
import { WEEKDAY_SHORT, dateOf, fmtDateLong, weekdayOf } from '../lib/dates'
import { calOf, withMove } from '../lib/planShift'
import { timedMinutes } from '../data/planTypes'
import { blockLabel, prescriptionText, timedItemText } from '../lib/planEngine'
import { deleteWorkout } from '../lib/workouts'

export default function SessionPreview() {
  const { date: routeDate = '', sessionKey = '' } = useParams()
  const profile = useProfile()
  const found = findSession(sessionKey)
  const workout = useLiveQuery(
    () => (profile ? db.workouts.where('[profileId+sessionKey]').equals([profile.id, sessionKey]).toArray() : []),
    [profile?.id, sessionKey],
  )
  // Alle gespeicherten Trainings dieser Einheit (jüngstes zuerst) mit Satzzahl; leere lassen sich erkennen und löschen
  const alive = useMemo(() => (workout ?? []).filter((w) => !w.deleted).sort((a, b) => (a.date < b.date ? 1 : -1)), [workout])
  const ids = alive.map((w) => w.id).join(',')
  const setRows = useLiveQuery(() => (ids ? db.sets.where('workoutId').anyOf(ids.split(',')).toArray() : []), [ids])
  if (!found) return <div className="text-muted">Einheit nicht gefunden.</div>
  const { week, session } = found
  // Plan-Einheiten: das Datum kommt aus dem Kalender (Pausen, Verschiebung), nicht aus dem Link; Routinen behalten das Datum des Links
  const cal = profile && week.number > 0 ? calOf(profile) : undefined
  const day = cal ? weekdayOf(session, cal) : session.weekday
  const date = cal ? dateOf(cal, week.number, day) : routeDate
  const sessionOn = (wd: number) => (cal ? week.sessions.find((s) => weekdayOf(s, cal) === wd) : undefined)
  const count = (id: string) => (setRows ?? []).filter((s) => s.workoutId === id && !s.deleted).length
  const notesOf = (id: string) => (setRows ?? []).filter((s) => s.workoutId === id && !s.deleted && s.note).sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1))
  const isMobility = session.kind === 'mobility'
  const isEmpty = (w: Workout) => !isMobility && count(w.id) === 0
  const done = alive.find((w) => w.status === 'fertig' && !isEmpty(w))
  const running = alive.find((w) => w.status === 'laufend' && !isEmpty(w))
  const remove = async (w: Workout) => {
    const what = isEmpty(w) ? 'Leeres Training' : 'Training'
    if (!confirm(`${what} vom ${fmtDateLong(w.date)}${isEmpty(w) ? '' : ' mit allen eingetragenen Sätzen und Testwerten'} löschen?`)) return
    await deleteWorkout(w.id)
  }
  const statusText = (w: Workout) => {
    if (isEmpty(w)) return `leer · ${w.status === 'fertig' ? 'beendet ohne Sätze' : 'nur geöffnet'}`
    const n = count(w.id)
    const sets = isMobility ? '' : ` · ${n} ${n === 1 ? 'Satz' : 'Sätze'}`
    return w.status === 'fertig' ? `fertig${sets}${w.durationMin ? ` · ${w.durationMin} min` : ''}` : `laufend${sets}`
  }

  return (
    <div className="space-y-4">
      <header>
        <div className="label">{fmtDateLong(date)} · Woche {week.number} · {blockLabel(week.number)}</div>
        <h1 className="h1">{session.title}</h1>
        <div className="text-muted text-sm">{session.focus} · ca. {session.minutes} min</div>
      </header>
      <div className="flex gap-2">
        <Link to={`/workout/${date}/${sessionKey}`} className="btn-primary flex-1 text-center">{done ? 'Erneut öffnen' : 'Training starten'}</Link>
        <Link to={`/log/${date}/${sessionKey}`} className="btn-ghost text-center">Nachtragen</Link>
      </div>
      {done && <div className="rounded-xl bg-ok/10 border border-ok/40 p-3 text-ok text-sm">Erledigt am {fmtDateLong(done.date)}{done.durationMin ? ` · ${done.durationMin} min` : ''}</div>}
      {running && !done && <div className="rounded-xl bg-warn/10 border border-warn/40 p-3 text-sm">Begonnen am {fmtDateLong(running.date)}, noch nicht beendet.</div>}
      {alive.length > 0 && (
        <div className="card space-y-1">
          <div className="h2">Gespeicherte Trainings</div>
          {alive.some(isEmpty) && <div className="text-xs text-muted">Leere Trainings entstehen durch bloßes Öffnen oder ein versehentliches „Beenden“. Sie zählen nicht und werden beim nächsten Start wiederverwendet.</div>}
          <div className="divide-y divide-line text-sm">
            {alive.map((w) => (
              <div key={w.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <div><div>{fmtDateLong(w.date)}</div><div className={`text-xs ${isEmpty(w) ? 'text-muted' : w.status === 'fertig' ? 'text-ok' : 'text-warn'}`}>{statusText(w)}</div></div>
                  <button className="btn-ghost text-sm text-bad px-3 py-1.5" onClick={() => remove(w)}>Löschen</button>
                </div>
                {w.notes && <div className="text-xs text-accent2 mt-1">{w.notes}</div>}
                {notesOf(w.id).map((s) => (
                  <div key={s.id} className="text-xs text-muted mt-0.5"><span className="text-text">{EXERCISE_MAP[s.exerciseId]?.name ?? s.exerciseId}{s.segmentLabel.includes('-') || s.segmentLabel === 'challenge' ? '' : ` · Satz ${s.setIndex}`}:</span> {s.note}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {cal && profile && (
        <div className="card space-y-2">
          <div className="label">Tag in dieser Woche{day !== session.weekday ? ` · laut Plan ${WEEKDAY_SHORT[session.weekday]}` : ''}</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
              const other = wd !== day ? sessionOn(wd) : undefined
              return (
                <button key={wd} type="button" title={other ? `tauscht mit ${other.title}` : undefined}
                  className={`flex-1 rounded-lg py-2 text-sm border ${wd === day ? 'bg-accent text-black border-accent font-bold' : other ? 'bg-card2 border-line text-text' : 'border-line border-dashed text-muted'}`}
                  onClick={() => void saveProfile(withMove(profile, week, session.key, wd))}>{WEEKDAY_SHORT[wd]}</button>
              )
            })}
          </div>
          <div className="text-xs text-muted">Antippen verschiebt die Einheit auf diesen Tag. Liegt dort schon eine Einheit (durchgezogener Rand), tauschen beide den Tag.</div>
        </div>
      )}
      {session.note && <div className="card text-sm border-accent/60">{session.note}</div>}
      {week.note && <div className="card text-sm text-muted">{week.note}</div>}

      {session.segments.map((seg, i) => {
        switch (seg.type) {
          case 'timed':
            return (
              <section key={i} className="card">
                <div className="h2">{seg.title} · {timedMinutes(seg.items)} min</div>
                <div className="text-xs text-muted">Zeitgeführt: jeder Posten läuft mit Timer und geht mit Signal von selbst weiter.</div>
                <ul className="list-disc pl-5 text-sm mt-1">{seg.items.map((it, j) => <li key={j}>{it.exerciseId ? <Link to={`/exercises/${it.exerciseId}`}>{timedItemText(it)}</Link> : timedItemText(it)}</li>)}</ul>
              </section>
            )
          case 'measure':
            return (
              <section key={i} className="space-y-2">
                <div className="label px-1">Messung {seg.label}{seg.perSide ? ' · je Seite' : ''}</div>
                <ExerciseCard e={ex(seg.exerciseId)} subtitle={seg.description} />
              </section>
            )
          case 'note':
            return <section key={i} className="card"><div className="font-semibold">{seg.title}</div><div className="text-sm text-muted">{seg.text}</div></section>
          case 'block':
            return (
              <section key={i} className="space-y-2">
                <div className="label px-1">{seg.kind === 'superset' ? `Supersatz ${seg.label}` : `Block ${seg.label}`} · Pause {seg.restSec} s{seg.kind === 'superset' ? `, zwischen den Übungen ${seg.restBetweenSec ?? 30} s` : ''}</div>
                {seg.exercises.map((p, j) => (
                  <ExerciseCard key={j} e={ex(p.exerciseId)} subtitle={`${prescriptionText(p)}${p.loadHint ? ` · ${p.loadHint}` : ''}`} />
                ))}
              </section>
            )
          case 'test':
            return (
              <section key={i} className="space-y-2">
                <div className="label px-1">Test {seg.label}</div>
                <ExerciseCard e={ex(seg.exerciseId)} subtitle={seg.description} />
                {seg.followUp && <ExerciseCard e={ex(seg.followUp.exerciseId)} subtitle={`danach ${prescriptionText(seg.followUp)}${seg.followUp.loadHint ? ` · ${seg.followUp.loadHint}` : ''}`} />}
              </section>
            )
          case 'amrap':
            return (
              <section key={i} className="card space-y-2">
                <div className="h2">{seg.label}: AMRAP {seg.minutes} min</div>
                <div className="text-sm text-muted">{seg.description}</div>
                <ul className="text-sm">{seg.exercises.map((e, j) => <li key={j}>{e.reps > 1 ? `${e.reps} × ` : ''}<Link className="underline" to={`/exercises/${e.exerciseId}`}>{ex(e.exerciseId).name}</Link></li>)}</ul>
              </section>
            )
          case 'interval':
            return (
              <section key={i} className="card space-y-1">
                <div className="h2">{seg.label}: {seg.rounds} × {seg.workSec} s / {seg.restSec} s</div>
                <div className="text-sm">{seg.description}</div>
                {seg.alternative && <div className="text-xs text-muted">Alternative: {seg.alternative}</div>}
              </section>
            )
          case 'cardio':
            return (
              <section key={i} className="card space-y-1">
                <div className="h2">{seg.label}: {ex(seg.exerciseId).name} · {seg.minutes} min</div>
                <div className="text-sm">{seg.description}</div>
                {seg.hrZone && <div className="text-xs text-accent2">Herzfrequenz {seg.hrZone}</div>}
                {seg.alternative && <div className="text-xs text-muted">Alternative: {seg.alternative}</div>}
              </section>
            )
          case 'challenge':
            return (
              <section key={i} className="card space-y-1">
                <div className="h2">Challenge-Block</div>
                <div className="text-sm">{seg.description}</div>
                <div className="text-xs text-muted">Tagesziele werden aus den Wochenzielen berechnet (siehe Plan).</div>
              </section>
            )
        }
      })}
    </div>
  )
}
