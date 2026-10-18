import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db, now } from '../db/db'
import { saveProfile, useProfile } from '../hooks/useProfile'
import { fmtDate, today } from '../lib/dates'
import { CORRIDOR, fmtPerWeek, GOAL_LABEL, MIN_PER_WEEK, weightTrend, type Goal } from '../lib/bodyTrend'
import { fmtBody, parseDecimal } from '../lib/decimal'
import { photoCheckStatus, photoDates } from '../lib/photos'

/** "74,1" oder "74.1" → 74.1 (auf Zehntel gerundet); leer oder unbrauchbar → undefined. */
function parseBody(s: string): number | undefined {
  const n = parseDecimal(s, 1)
  return n !== '' && n > 0 ? n : undefined
}

export default function Body() {
  const profile = useProfile()
  const rows = useLiveQuery(() => (profile ? db.body.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const dates = useLiveQuery(() => (profile ? photoDates(profile.id) : []), [profile?.id])
  const [date, setDate] = useState(today())
  // Texteingabe statt type="number": die deutsche Android-Tastatur liefert ein Komma, das ein Zahlenfeld verwirft.
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  if (!profile) return null
  // Ziel und Aktivität liegen im Profil (vorher nur im Seitenzustand, ging beim Verlassen verloren).
  const activity = profile.activity ?? 1.55
  const goal: Goal = profile.goal ?? 'erhalt'
  const setActivity = (a: number) => saveProfile({ ...profile, activity: a })
  const setGoal = (g: Goal) => saveProfile({ ...profile, goal: g })
  const list = (rows ?? []).filter((r) => !r.deleted).sort((a, b) => (a.date < b.date ? -1 : 1))
  const last = list[list.length - 1]
  const w = last?.weightKg ?? 73.5
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : 56
  const h = profile.heightCm ?? 172
  const bmr = profile.sex === 'w' ? 10 * w + 6.25 * h - 5 * age - 161 : 10 * w + 6.25 * h - 5 * age + 5
  const tdee = bmr * activity
  const target = goal === 'defizit' ? tdee - 350 : goal === 'aufbau' ? tdee + 200 : tdee
  const protein = [Math.round(w * 1.6), Math.round(w * 2.0)]

  const weightNum = parseBody(weight)
  const waistNum = parseBody(waist)
  const weightBad = weight.trim() !== '' && weightNum === undefined
  const waistBad = waist.trim() !== '' && waistNum === undefined
  const save = async () => {
    if ((weightNum === undefined && waistNum === undefined) || weightBad || waistBad) return
    const existing = list.find((r) => r.date === date)
    await db.body.put({ id: existing?.id ?? uuid(), profileId: profile.id, date, weightKg: weightNum ?? existing?.weightKg, waistCm: waistNum ?? existing?.waistCm, updatedAt: now() })
    setWeight(''); setWaist('')
  }
  const checks = photoCheckStatus(profile.planStartDate, dates ?? [], today())
  const nextCheck = checks.find((c) => c.status !== 'fertig')
  const lastCheck = [...checks].reverse().find((c) => c.status === 'fertig')
  const photoText = nextCheck?.status === 'faellig'
    ? `Jetzt dran: ${nextCheck.label} (${fmtDate(nextCheck.date)})`
    : `${lastCheck ? `Zuletzt ${fmtDate(lastCheck.doneDate!)}` : 'Noch keine Fotos'}${nextCheck ? ` · nächster: ${nextCheck.label}, ${fmtDate(nextCheck.date)}` : ''}`
  const chart = list.filter((r) => r.weightKg).map((r) => ({ d: fmtDate(r.date, { day: '2-digit', month: '2-digit' }), kg: r.weightKg }))
  const trend = weightTrend(list, goal, today())
  const [lo, hi] = CORRIDOR[goal]
  const trendColor = trend.status === 'zu_wenig' ? 'text-muted' : trend.status === 'im_korridor' ? 'text-ok' : 'text-accent'

  return (
    <div className="space-y-4">
      <h1 className="h1">Körper</h1>
      <div className="card space-y-3">
        <div className="flex gap-2">
          <div className="flex-1"><div className="label mb-1">Datum</div><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1"><div className="label mb-1">Gewicht (kg)</div><input type="text" inputMode="decimal" className={`input ${weightBad ? '!border-bad' : ''}`} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={fmtBody(last?.weightKg)} aria-invalid={weightBad} /></div>
          <div className="flex-1"><div className="label mb-1">Taille (cm)</div><input type="text" inputMode="decimal" className={`input ${waistBad ? '!border-bad' : ''}`} value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={fmtBody(last?.waistCm)} aria-invalid={waistBad} /></div>
        </div>
        {(weightBad || waistBad) && <div className="text-xs text-bad" role="alert">Bitte eine Zahl eingeben, z. B. 74,1</div>}
        <button className="btn-primary w-full" onClick={save}>Speichern</button>
      </div>

      <Link to="/photos" className={`card block ${nextCheck?.status === 'faellig' ? '!border-accent/60' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div><div className="h2">Foto-Check</div><div className={`text-sm ${nextCheck?.status === 'faellig' ? 'text-accent' : 'text-muted'}`}>{photoText}</div></div>
          <span className="text-muted text-xl">›</span>
        </div>
      </Link>

      {list.some((r) => r.weightKg) && (
        <div className="card space-y-2">
          <div className="flex items-baseline justify-between"><div className="h2">Gewichtstrend</div><div className="text-xs text-muted">Ziel {GOAL_LABEL[goal]} · {fmtPerWeek(lo).replace(' kg/Woche', '')} bis {fmtPerWeek(hi)}</div></div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-card2 p-2"><div className="text-xl font-bold tabular-nums">{trend.mean7 !== undefined ? fmtBody(trend.mean7) : '–'}</div><div className="label">Ø 7 Tage ({trend.n7}/{MIN_PER_WEEK})</div></div>
            <div className="rounded-xl bg-card2 p-2"><div className="text-xl font-bold tabular-nums">{trend.meanPrev !== undefined ? fmtBody(trend.meanPrev) : '–'}</div><div className="label">Vorwoche ({trend.nPrev}/{MIN_PER_WEEK})</div></div>
            <div className="rounded-xl bg-card2 p-2"><div className={`text-xl font-bold tabular-nums ${trendColor}`}>{trend.perWeek !== undefined ? fmtPerWeek(trend.perWeek).replace(' kg/Woche', '') : '–'}</div><div className="label">kg / Woche</div></div>
          </div>
          <div className={`text-sm ${trendColor}`}>{trend.text}</div>
          <div className="text-xs text-muted">Morgens nach der Toilette, vor dem Frühstück wiegen. Tageswerte schwanken, es zählt nur das Wochenmittel. Trend = Gerade durch die letzten 14 Tage.</div>
        </div>
      )}

      {chart.length > 1 && (
        <div className="card">
          <div className="h2 mb-2">Gewichtsverlauf</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#2c2c2c" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: '#9b9b9b', fontSize: 11 }} />
                <YAxis domain={[(min: number) => Math.floor(min - 0.5), (max: number) => Math.ceil(max + 0.5)]} allowDecimals={false} tick={{ fill: '#9b9b9b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#171717', border: '1px solid #2c2c2c', borderRadius: 8 }} formatter={(v) => [`${fmtBody(Number(v))} kg`, 'Gewicht']} />
                <Line type="monotone" dataKey="kg" stroke="#ff7a1a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="h2">Kalorienbedarf</div>
        <div className="text-xs text-muted">Mifflin-St Jeor mit {fmtBody(w)} kg, {h} cm, {age} Jahre. Grundumsatz {Math.round(bmr)} kcal.</div>
        <div>
          <div className="label mb-1">Aktivität</div>
          <select className="input" value={activity} onChange={(e) => setActivity(Number(e.target.value))}>
            <option value={1.4}>Sitzender Job, Ruhetag (1,4)</option>
            <option value={1.55}>Sitzender Job + Training an 5 Tagen (1,55)</option>
            <option value={1.7}>Trainingstag mit langer Einheit (1,7)</option>
          </select>
        </div>
        <div>
          <div className="label mb-1">Ziel</div>
          <div className="flex gap-1">
            {(['erhalt', 'defizit', 'aufbau'] as const).map((g) => (
              <button key={g} className={`flex-1 rounded-lg py-2 border text-sm ${goal === g ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`} onClick={() => setGoal(g)}>
                {g === 'erhalt' ? 'Erhalt (Block 1–2)' : g === 'defizit' ? 'Defizit −350 (ab Block 3)' : 'Aufbau +200'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-card2 p-3"><div className="text-2xl font-bold">{Math.round(target / 10) * 10}</div><div className="label">kcal / Tag</div></div>
          <div className="rounded-xl bg-card2 p-3"><div className="text-2xl font-bold">{protein[0]}–{protein[1]}</div><div className="label">g Protein / Tag</div></div>
        </div>
      </div>

      {list.length > 0 && (
        <div className="card">
          <div className="h2 mb-2">Einträge</div>
          <div className="divide-y divide-line text-sm">
            {[...list].reverse().slice(0, 30).map((r) => (
              <div key={r.id} className="py-1.5 flex justify-between">
                <span className="text-muted">{fmtDate(r.date)}</span>
                <span>{r.weightKg ? `${fmtBody(r.weightKg)} kg` : ''} {r.waistCm ? `· ${fmtBody(r.waistCm)} cm` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
