import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Pose, ProgressPhoto } from '../db/types'
import { useProfile } from '../hooks/useProfile'
import PhotoCamera from '../components/PhotoCamera'
import { fmtDate, today } from '../lib/dates'
import { downloadText } from '../lib/exportImport'
import { POSES, deletePhoto, exportPhotos, fmtSize, importPhotos, photoCheckStatus, poseLabel, savePhoto } from '../lib/photos'

/** Objekt-URL für einen Blob, wird beim Wechsel oder Abbau wieder freigegeben. */
function useObjectUrl(blob?: Blob): string | undefined {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : undefined), [blob])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  return url
}

function PhotoImg({ photo, className, onClick }: { photo: ProgressPhoto; className?: string; onClick?: () => void }) {
  const url = useObjectUrl(photo.blob)
  if (!url) return <div className={className} />
  return <img src={url} alt={`${poseLabel(photo.pose)} ${fmtDate(photo.date)}`} className={className} onClick={onClick} />
}

const TILE = 'w-full aspect-[3/4] object-cover rounded-xl bg-card2'

export default function Photos() {
  const profile = useProfile()
  const photos = useLiveQuery(() => (profile ? db.photos.where('profileId').equals(profile.id).toArray() : []), [profile?.id])
  const [date, setDate] = useState(today())
  const [cmpA, setCmpA] = useState('')
  const [cmpB, setCmpB] = useState('')
  const [zoom, setZoom] = useState<ProgressPhoto | null>(null)
  const [busy, setBusy] = useState<Pose | null>(null)
  const [cam, setCam] = useState<Pose | null>(null)
  /** Aufnahme aus Kamera-App oder Galerie, die noch bestätigt werden muss */
  const [shot, setShot] = useState<{ pose: Pose; file: File; url: string; source: 'kamera' | 'galerie' } | null>(null)
  const [shotDims, setShotDims] = useState<[number, number] | null>(null)
  /** Nach dem Speichern: welche Pose gerade gespeichert wurde (für „Weiter“) */
  const [justSaved, setJustSaved] = useState<Pose | null>(null)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const poseRef = useRef<Pose>('vorne')
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url) }, [shot])

  const rows = useMemo(() => (photos ?? []).slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)), [photos])
  const dates = useMemo(() => [...new Set(rows.map((p) => p.date))], [rows])
  const byDate = useMemo(() => {
    const m = new Map<string, ProgressPhoto[]>()
    for (const p of rows) m.set(p.date, [...(m.get(p.date) ?? []), p])
    return m
  }, [rows])
  const a = cmpA && byDate.has(cmpA) ? cmpA : dates[0] ?? ''
  const b = cmpB && byDate.has(cmpB) ? cmpB : dates[dates.length - 1] ?? ''
  const schedule = useMemo(() => (profile ? photoCheckStatus(profile.planStartDate, dates, today()) : []), [profile, dates])
  if (!profile) return null

  const current = byDate.get(date) ?? []
  const photoFor = (list: ProgressPhoto[], pose: Pose) => list.find((p) => p.pose === pose)
  const totalBytes = rows.reduce((s, p) => s + p.bytes, 0)
  const next = schedule.find((c) => c.status !== 'fertig')
  const takenPoses = current.map((p) => p.pose)
  const firstMissing = POSES.map((p) => p.key).find((k) => !takenPoses.includes(k)) ?? 'vorne'

  const nextMissingAfter = (pose: Pose) => POSES.map((p) => p.key).find((k) => k !== pose && !takenPoses.includes(k))

  /** Galerie: Dateiauswahl ohne capture-Attribut */
  const pick = (pose: Pose) => {
    poseRef.current = pose
    fileRef.current?.click()
  }
  /** Kamera-App des Handys: Dateifeld mit capture-Attribut öffnet direkt die Kamera, das Foto kommt in voller Qualität zurück */
  const shoot = (pose: Pose) => {
    poseRef.current = pose
    cameraRef.current?.click()
  }
  const onFile = (f: File, source: 'kamera' | 'galerie') => {
    setJustSaved(null)
    setShotDims(null)
    setShot({ pose: poseRef.current, file: f, url: URL.createObjectURL(f), source })
  }
  const confirmShot = async () => {
    if (!shot) return
    setBusy(shot.pose)
    setMsg('')
    try {
      await savePhoto(profile.id, date, shot.pose, shot.file)
      setJustSaved(shot.pose)
      setShot(null)
    } catch (e) {
      setMsg('Foto konnte nicht gespeichert werden: ' + (e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  const remove = async (p: ProgressPhoto) => {
    if (!confirm(`${poseLabel(p.pose)} vom ${fmtDate(p.date)} löschen?`)) return
    await deletePhoto(p.id)
  }
  const doExport = async () => {
    setMsg('Sicherung wird erstellt …')
    downloadText(`transformation16-fotos-${today()}.json`, await exportPhotos())
    setMsg('Foto-Sicherung erstellt.')
  }
  const doImport = async (f: File) => {
    try {
      const res = await importPhotos(await f.text())
      setMsg(`Import: ${res.added} neu, ${res.updated} aktualisiert.`)
    } catch (e) {
      setMsg('Import fehlgeschlagen: ' + (e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="h1">Foto-Check</h1>
      {msg && <div className="card text-sm text-ok" role="status">{msg}</div>}

      <section className="card space-y-2">
        <div className="h2">Termine</div>
        <div className="text-sm text-muted">Alle vier Wochen vier Fotos, immer unter gleichen Bedingungen: morgens vor dem Training, gleiches Licht und gleicher Abstand, gleiche Kleidung, Handy hochkant auf Brusthöhe, Selbstauslöser. Neutral stehen, nicht anspannen.</div>
        <div className="divide-y divide-line text-sm">
          {schedule.map((c) => (
            <div key={c.week} className="py-1.5 flex items-center justify-between gap-2">
              <span>{c.label} <span className="text-muted">· {fmtDate(c.date)}</span></span>
              {c.status === 'fertig' && <span className="text-ok">✓ {fmtDate(c.doneDate!)}</span>}
              {c.status === 'faellig' && <button className="text-accent font-semibold" onClick={() => setDate(today())}>fällig</button>}
              {c.status === 'offen' && <span className="text-muted">offen</span>}
            </div>
          ))}
        </div>
        {next && next.status === 'faellig' && <div className="text-sm text-accent">Jetzt dran: {next.label}. Fotos bis {fmtDate(next.to)} zählen dazu.</div>}
      </section>

      <section className="card space-y-3">
        <div className="h2">Fotos aufnehmen</div>
        <div><div className="label mb-1">Datum</div><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <button className="btn-primary w-full" onClick={() => shoot(firstMissing)}>Foto aufnehmen ({poseLabel(firstMissing)})</button>
        <div className="text-xs text-muted">Öffnet die Kamera-App des Handys (volle Bildqualität; Selbstauslöser und Kamerawechsel dort einstellen). Das Foto kommt zurück, wird hier bestätigt und zur Pose gespeichert, danach geht es mit der nächsten Pose weiter. Vorhandene Bilder lassen sich je Pose aus der Galerie wählen. Bilder werden auf 1280 px verkleinert und bleiben auf diesem Gerät.</div>
        <button className="btn-ghost w-full !text-sm" onClick={() => setCam(firstMissing)}>Kamera in der App mit Selbstauslöser (geringere Qualität)</button>
        <div className="grid grid-cols-2 gap-3">
          {POSES.map((pose) => {
            const p = photoFor(current, pose.key)
            const loading = busy === pose.key
            return (
              <div key={pose.key} className="space-y-1">
                <div className="flex items-baseline justify-between"><span className="font-semibold text-sm">{pose.label}</span>{p && <span className="text-xs text-muted">{fmtSize(p.bytes)}</span>}</div>
                {p
                  ? <PhotoImg photo={p} className={`${TILE} cursor-zoom-in`} onClick={() => setZoom(p)} />
                  : (
                    <button className={`${TILE} border border-dashed border-line flex flex-col items-center justify-center gap-1 text-muted text-sm`} onClick={() => shoot(pose.key)} disabled={loading}>
                      <span className="text-3xl leading-none">{loading ? '…' : '+'}</span>
                      <span>{loading ? 'Speichern …' : 'Aufnehmen'}</span>
                      <span className="text-xs px-2 text-center">{pose.hint}</span>
                    </button>
                  )}
                {p
                  ? (
                    <div className="flex gap-1">
                      <button className="btn-ghost flex-1 !px-1 !py-1.5 !text-xs" onClick={() => shoot(pose.key)} disabled={loading}>Kamera</button>
                      <button className="btn-ghost flex-1 !px-1 !py-1.5 !text-xs" onClick={() => pick(pose.key)} disabled={loading}>{loading ? '…' : 'Galerie'}</button>
                      <button className="btn-ghost !px-2 !py-1.5 !text-xs !text-bad" onClick={() => remove(p)} aria-label="Löschen">✕</button>
                    </div>
                  )
                  : <button className="w-full text-xs text-muted py-0.5" onClick={() => pick(pose.key)} disabled={loading}>aus Galerie wählen</button>}
              </div>
            )
          })}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f, 'galerie'); e.target.value = '' }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f, 'kamera'); e.target.value = '' }} />
      </section>

      {dates.length > 0 && (
        <section className="card space-y-3">
          <div className="h2">Vergleich</div>
          {dates.length < 2 && <div className="text-sm text-muted">Ab dem zweiten Termin lassen sich hier zwei Tage nebeneinander stellen.</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><div className="label mb-1">Vorher</div><select className="input !py-2 !text-base" value={a} onChange={(e) => setCmpA(e.target.value)}>{dates.map((d) => <option key={d} value={d}>{fmtDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' })}</option>)}</select></div>
            <div><div className="label mb-1">Nachher</div><select className="input !py-2 !text-base" value={b} onChange={(e) => setCmpB(e.target.value)}>{dates.map((d) => <option key={d} value={d}>{fmtDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' })}</option>)}</select></div>
          </div>
          {POSES.map((pose) => {
            const pa = photoFor(byDate.get(a) ?? [], pose.key)
            const pb = photoFor(byDate.get(b) ?? [], pose.key)
            if (!pa && !pb) return null
            return (
              <div key={pose.key} className="space-y-1">
                <div className="font-semibold text-sm">{pose.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  {pa ? <PhotoImg photo={pa} className={`${TILE} cursor-zoom-in`} onClick={() => setZoom(pa)} /> : <div className={`${TILE} border border-dashed border-line`} />}
                  {pb ? <PhotoImg photo={pb} className={`${TILE} cursor-zoom-in`} onClick={() => setZoom(pb)} /> : <div className={`${TILE} border border-dashed border-line`} />}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <section className="card space-y-3">
        <div className="h2">Speicher und Sicherung</div>
        <div className="text-sm text-muted">{rows.length} {rows.length === 1 ? 'Foto' : 'Fotos'} · {fmtSize(totalBytes)} auf diesem Gerät. Die Fotos sind nicht in der JSON-Sicherung unter Einstellungen enthalten, sondern in einer eigenen Datei.</div>
        <button className="btn-primary w-full" onClick={doExport} disabled={rows.length === 0}>Fotos exportieren</button>
        <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = '' }} />
        <button className="btn-ghost w-full" onClick={() => importRef.current?.click()}>Fotos importieren</button>
      </section>

      {cam && (
        <PhotoCamera
          taken={takenPoses}
          initialPose={cam}
          onSave={(pose, blob) => savePhoto(profile.id, date, pose, blob).then(() => undefined)}
          onClose={() => setCam(null)}
          onPickFile={(pose) => { setCam(null); pick(pose) }}
        />
      )}

      {shot && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-3 flex items-center justify-between">
            <div className="font-semibold">{poseLabel(shot.pose)} · {shot.source === 'kamera' ? 'Kamera-App' : 'Galerie'}</div>
            <button className="btn-ghost !px-3 !py-1.5 !text-sm" onClick={() => setShot(null)} disabled={busy !== null}>Abbrechen</button>
          </div>
          <div className="flex-1 relative min-h-0">
            <img src={shot.url} alt="Aufnahme" className="absolute inset-0 w-full h-full object-contain" onLoad={(e) => setShotDims([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight])} />
          </div>
          <div className="p-3 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="text-xs text-muted text-center">{shotDims ? `Aufnahme ${shotDims[0]} × ${shotDims[1]}${shotDims[1] > shotDims[0] ? ' (Hochformat)' : ' (Querformat)'}` : ''} · {fmtSize(shot.file.size)}{photoFor(current, shot.pose) ? ' · ersetzt das vorhandene Foto' : ''}</div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => (shot.source === 'kamera' ? shoot(shot.pose) : pick(shot.pose))} disabled={busy !== null}>Nochmal</button>
              <button className="btn-primary flex-1" onClick={confirmShot} disabled={busy !== null}>{busy ? 'Speichern …' : `Speichern als ${poseLabel(shot.pose)}`}</button>
            </div>
          </div>
        </div>
      )}

      {justSaved && !shot && (
        <div className="fixed inset-x-0 bottom-16 z-40 px-4">
          <div className="card !border-ok/50 space-y-2 shadow-lg">
            <div className="text-ok font-semibold">✓ {poseLabel(justSaved)} gespeichert</div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 !py-2" onClick={() => setJustSaved(null)}>Fertig</button>
              {nextMissingAfter(justSaved) && <button className="btn-primary flex-1 !py-2" onClick={() => shoot(nextMissingAfter(justSaved)!)}>Weiter: {poseLabel(nextMissingAfter(justSaved)!)}</button>}
            </div>
          </div>
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 gap-3" onClick={() => setZoom(null)}>
          <div className="text-sm text-muted">{poseLabel(zoom.pose)} · {fmtDate(zoom.date, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          <PhotoImg photo={zoom} className="max-h-[80vh] max-w-full object-contain rounded-lg" />
          <button className="btn-ghost w-full max-w-md" onClick={() => setZoom(null)}>Schließen</button>
        </div>
      )}
    </div>
  )
}
