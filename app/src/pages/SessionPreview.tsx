import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import ExerciseCard from '../components/ExerciseCard'
import { ex } from '../data/exercises'
import { findSession } from '../data/plan'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { fmtDateLong } from '../lib/dates'
import { blockLabel, prescriptionText } from '../lib/planEngine'

export default function SessionPreview() {
  const { date = '', sessionKey = '' } = useParams()
  const profile = useProfile()
  const found = findSession(sessionKey)
  const workout = useLiveQuery(
    () => (profile ? db.workouts.where('[profileId+sessionKey]').equals([profile.id, sessionKey]).toArray() : []),
    [profile?.id, sessionKey],
  )
  if (!found) return <div className="text-muted">Einheit nicht gefunden.</div>
  const { week, session } = found
  const done = workout?.find((w) => w.status === 'fertig' && !w.deleted)

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
      {week.note && <div className="card text-sm text-muted">{week.note}</div>}

      {session.segments.map((seg, i) => {
        switch (seg.type) {
          case 'warmup':
          case 'cooldown':
            return (
              <section key={i} className="card">
                <div className="h2">{seg.type === 'warmup' ? 'Warm-up' : 'Cool-down'} · {seg.minutes} min</div>
                <ul className="list-disc pl-5 text-sm mt-1">{seg.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
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
