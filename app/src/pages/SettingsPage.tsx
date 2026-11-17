import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { DEFAULT_START } from '../data/plan'
import { db, now } from '../db/db'
import type { Profile } from '../db/types'
import { saveProfile, updateSettings, useProfile, useSettings } from '../hooks/useProfile'
import { exportToFile, importDump } from '../lib/exportImport'
import { ensurePersistentStorage, type StorageInfo } from '../lib/backup'
import { fmtDateLong } from '../lib/dates'

export default function SettingsPage() {
  const profile = useProfile()
  const settings = useSettings()
  const profiles = useLiveQuery(() => db.profiles.toArray())
  const [form, setForm] = useState<Profile | null>(null)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (profile) setForm(profile) }, [profile])
  const [storage, setStorage] = useState<StorageInfo>()
  useEffect(() => { void ensurePersistentStorage().then(setStorage).catch(() => setStorage({ supported: false, persisted: false })) }, [])
  if (!profile || !settings || !form) return null

  const set = (k: keyof Profile, v: unknown) => setForm({ ...form, [k]: v } as Profile)
  const save = async () => { await saveProfile(form); setMsg('Gespeichert.') }

  const doExport = async () => { await exportToFile(); setMsg('Sicherung exportiert.') }
  const doImport = async (f: File) => {
    try {
      const res = await importDump(await f.text())
      setMsg(`Import: ${res.added} neu, ${res.updated} aktualisiert.`)
    } catch (e) {
      setMsg('Import fehlgeschlagen: ' + (e as Error).message)
    }
  }
  const addProfile = async () => {
    const name = prompt('Name des neuen Profils?')
    if (!name) return
    const p: Profile = { id: uuid(), name, planStartDate: DEFAULT_START, createdAt: now(), updatedAt: now() }
    await db.profiles.put(p)
    await updateSettings({ activeProfileId: p.id })
  }
  const wipe = async () => {
    if (!confirm('Wirklich ALLE Daten auf diesem Gerät löschen? Vorher exportieren!')) return
    if (!confirm('Letzte Warnung: Trainings, Sätze, Körperwerte und Fotos werden unwiderruflich gelöscht.')) return
    await db.delete()
    location.reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="h1">Einstellungen</h1>
      {msg && <div className="card text-sm text-ok">{msg}</div>}

      <section className="card space-y-3">
        <div className="h2">Profil</div>
        <div><div className="label mb-1">Name</div><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="flex gap-2">
          <div className="flex-1"><div className="label mb-1">Geburtsjahr</div><input type="number" className="input" value={form.birthYear ?? ''} onChange={(e) => set('birthYear', e.target.value === '' ? undefined : Number(e.target.value))} /></div>
          <div className="flex-1"><div className="label mb-1">Größe (cm)</div><input type="number" className="input" value={form.heightCm ?? ''} onChange={(e) => set('heightCm', e.target.value === '' ? undefined : Number(e.target.value))} /></div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1"><div className="label mb-1">Planstart (Montag)</div><input type="date" className="input" value={form.planStartDate} onChange={(e) => set('planStartDate', e.target.value)} /></div>
          <div className="flex-1"><div className="label mb-1">HF max</div><input type="number" className="input" value={form.hrMax ?? ''} onChange={(e) => set('hrMax', e.target.value === '' ? undefined : Number(e.target.value))} /></div>
        </div>
        <button className="btn-primary w-full" onClick={save}>Profil speichern</button>
      </section>

      <section className="card space-y-3">
        <div className="h2">Training</div>
        <label className="flex items-center justify-between"><span>Signaltöne</span><input type="checkbox" className="accent-[#ff7a1a] w-5 h-5" checked={settings.audio} onChange={(e) => updateSettings({ audio: e.target.checked })} /></label>
        <label className="flex items-center justify-between"><span>Sprachansagen (Los, Pause)</span><input type="checkbox" className="accent-[#ff7a1a] w-5 h-5" checked={settings.voice} onChange={(e) => updateSettings({ voice: e.target.checked })} /></label>
      </section>

      <section className="card space-y-3">
        <div className="h2">Profile</div>
        {profiles?.map((p) => (
          <label key={p.id} className="flex items-center justify-between">
            <span>{p.name}</span>
            <input type="radio" name="profile" className="accent-[#ff7a1a] w-5 h-5" checked={p.id === settings.activeProfileId} onChange={() => updateSettings({ activeProfileId: p.id })} />
          </label>
        ))}
        <button className="btn-ghost w-full" onClick={addProfile}>Profil hinzufügen</button>
      </section>

      <section className="card space-y-3">
        <div className="h2">Sicherung</div>
        <div className="text-sm text-muted">Alle Daten als JSON-Datei. Zum Übertragen aufs andere Gerät dort importieren, neuere Einträge gewinnen. Fotos vom Foto-Check haben eine eigene Sicherung auf ihrer Seite.</div>
        <div className="text-sm">Letzter Export: <span className="font-semibold">{settings.lastExportAt ? `${fmtDateLong(settings.lastExportAt.slice(0, 10))}` : 'noch keiner vermerkt'}</span></div>
        {storage && (
          <div className={`text-sm ${storage.persisted ? 'text-ok' : 'text-warn'}`}>
            {storage.persisted
              ? `Dauerhafter Speicher zugesichert: der Browser löscht die Daten nicht von sich aus${storage.usedMb !== undefined ? ` (belegt ca. ${storage.usedMb} MB)` : ''}.`
              : storage.supported
                ? 'Dauerhafter Speicher nicht zugesichert: bei knappem Speicherplatz darf der Browser die Daten löschen. Als installierte App wird er in der Regel zugesichert; bis dahin regelmäßig exportieren.'
                : 'Dieser Browser kann keinen dauerhaften Speicher zusichern. Regelmäßig exportieren.'}
          </div>
        )}
        <button className="btn-primary w-full" onClick={doExport}>Exportieren</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = '' }} />
        <button className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>Importieren</button>
      </section>

      <section className="card space-y-3">
        <div className="h2 text-bad">Gefahrenzone</div>
        <button className="btn-danger w-full" onClick={wipe}>Alle Daten löschen</button>
      </section>
    </div>
  )
}
