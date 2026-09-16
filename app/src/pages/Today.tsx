import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useProfile } from '../hooks/useProfile'
import { fmtDateLong, parseISO, today } from '../lib/dates'
import { blockLabel, dayInfo } from '../lib/planEngine'
import { weekByNumber } from '../data/plan'

export default function Today() {
  const profile = useProfile()
  const date = today()
  const info = profile ? dayInfo(date, profile.planStartDate) : undefined
  const weekWorkouts = useLiveQuery(
    () => (profile && info ? db.workouts.where('[profileId+week]').equals([profile.id, info.week]).toArray() : []),
    [profile?.id, info?.week],
  )
  const lastBody = useLiveQuery(() => (profile ? db.body.where('profileId').equals(profile.id).reverse().sortBy('date') : []), [profile?.id])

  if (!profile || !info) return null
  const statusOf = (key: string) => weekWorkouts?.filter((w) => w.sessionKey === key && !w.deleted).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]

  return (
    <div className="space-y-4">
      <header>
        <div className="label">{fmtDateLong(date)}</div>
        <h1 className="h1">Hallo {profile.name}</h1>
        {info.week > 0 && info.week <= 16 && <div className="text-muted text-sm mt-1">Woche {info.week} von 16 · {blockLabel(info.week)}</div>}
      </header>

      {info.kind === 'vorher' && (
        <div className="card space-y-2">
          <div className="h2">Plan startet am {fmtDateLong(profile.planStartDate)}</div>
          <div className="text-muted text-sm">
            Noch {Math.round((parseISO(profile.planStartDate).getTime() - parseISO(date).getTime()) / 86400000)} Tage. Bis dahin: Übungen anschauen, Bio Force einstellen, Körpergewicht eintragen.
          </div>
          <div className="flex gap-2">
            <Link to="/exercises" className="btn-primary flex-1 text-center">Übungen ansehen</Link>
            <Link to="/session/2026-09-21/w1-push" className="btn-ghost flex-1 text-center">Woche 1 Vorschau</Link>
          </div>
          <div className="text-xs text-muted">Startdatum lässt sich in den Einstellungen ändern.</div>
        </div>
      )}

      {info.kind === 'training' && info.session && (() => {
        const w = statusOf(info.session.key)
        const s = info.session
        return (
          <div className="card space-y-3">
            <div>
              <div className="label">Heutige Einheit</div>
              <div className="h2">{s.title}</div>
              <div className="text-muted text-sm">{s.focus} · ca. {s.minutes} min</div>
            </div>
            {w?.status === 'fertig' && (
              <div className="rounded-xl bg-ok/10 border border-ok/40 p-3 text-ok">Erledigt ✓ {w.durationMin ? `· ${w.durationMin} min` : ''}</div>
            )}
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
        const week = weekByNumber(info.week)
        const open = week?.sessions.filter((s) => statusOf(s.key)?.status !== 'fertig') ?? []
        return (
          <div className="card space-y-3">
            <div className="h2">Samstag: Puffer</div>
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

      {info.kind === 'ruhe' && (
        <div className="card"><div className="h2">Ruhetag</div><div className="text-muted text-sm">Regeneration ist Teil des Plans. Spazieren, dehnen, schlafen.</div></div>
      )}
      {info.kind === 'frei' && (
        <div className="card"><div className="h2">Kein Training geplant</div><div className="text-muted text-sm">Die Einheiten dieses Blocks werden nach Block 1 ergänzt.</div></div>
      )}
      {info.kind === 'nachher' && (
        <div className="card"><div className="h2">Plan abgeschlossen</div><div className="text-muted text-sm">16 Wochen geschafft. Zeit für den Retest und den nächsten Plan.</div></div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/log" className="card">
          <div className="label">Nachtragen</div>
          <div className="font-semibold">Einheit eintragen</div>
        </Link>
        <Link to="/body" className="card">
          <div className="label">Körpergewicht</div>
          <div className="font-semibold">{lastBody?.[0]?.weightKg ? `${lastBody[0].weightKg} kg` : 'Eintragen'}</div>
        </Link>
      </div>

      {info.week > 0 && info.week <= 16 && (
        <Link to={`/week/${info.week}`} className="card block">
          <div className="label">Diese Woche</div>
          <div className="font-semibold">{weekByNumber(info.week)?.title}</div>
          <div className="text-xs text-muted mt-1">
            {weekWorkouts?.filter((w) => w.status === 'fertig').length ?? 0} von {weekByNumber(info.week)?.sessions.length ?? 0} Einheiten erledigt
          </div>
        </Link>
      )}
    </div>
  )
}
