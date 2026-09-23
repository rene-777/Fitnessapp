// Foto-Check: Fortschrittsfotos (vorne, links, rechts, hinten) alle vier Wochen.
// Bilder werden beim Speichern verkleinert und als JPEG-Blob in IndexedDB abgelegt; nichts verlässt das Gerät.
import { v4 as uuid } from 'uuid'
import { db, now } from '../db/db'
import type { Pose, ProgressPhoto } from '../db/types'
import { addDays, mondayOfWeek } from './dates'

export const POSES: { key: Pose; label: string; hint: string }[] = [
  { key: 'vorne', label: 'Vorne', hint: 'Blick zur Kamera, Arme locker seitlich' },
  { key: 'links', label: 'Links', hint: 'Linke Körperseite zur Kamera' },
  { key: 'rechts', label: 'Rechts', hint: 'Rechte Körperseite zur Kamera' },
  { key: 'hinten', label: 'Hinten', hint: 'Rücken zur Kamera, Arme locker seitlich' },
  // Mobility-Posen (23.09.2026): Beweglichkeit sichtbar machen, Winkel an Sprunggelenk, Knie und Hüfte
  { key: 'kniebeuge', label: 'Tiefe Kniebeuge', hint: 'Von der Seite, so tief wie möglich, Fersen am Boden' },
  { key: 'ueberkopf', label: 'Überkopf-Kniebeuge', hint: 'Von vorn, Arme gestreckt über Kopf, so tief wie möglich' },
]
export const poseLabel = (p: Pose) => POSES.find((x) => x.key === p)?.label ?? p

/** Längste Bildseite nach dem Verkleinern; JPEG-Qualität. Ergibt etwa 150–300 kB je Foto. */
export const PHOTO_MAX_SIDE = 1280
export const PHOTO_QUALITY = 0.85

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  // EXIF-Drehung berücksichtigen, sonst liegen Handyfotos quer
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch { /* Fallback unten */ }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image()
      img.onload = () => res(img)
      img.onerror = () => rej(new Error('Bild kann nicht gelesen werden.'))
      img.src = url
    })
  } finally { setTimeout(() => URL.revokeObjectURL(url), 5000) }
}

/** Verkleinert ein Foto auf höchstens PHOTO_MAX_SIDE und liefert ein JPEG. */
export async function shrinkImage(file: Blob): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await loadBitmap(file)
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bmp.width, bmp.height))
  const width = Math.max(1, Math.round(bmp.width * scale))
  const height = Math.max(1, Math.round(bmp.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bild konnte nicht verarbeitet werden.')
  ctx.drawImage(bmp, 0, 0, width, height)
  if ('close' in bmp) bmp.close()
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', PHOTO_QUALITY))
  if (!blob) throw new Error('Bild konnte nicht gespeichert werden.')
  return { blob, width, height }
}

/** Dauerhaften Speicher anfordern, damit der Browser die Fotos nicht bei Platzmangel räumt. */
export async function requestPersistentStorage(): Promise<boolean> {
  try { return (await navigator.storage?.persist?.()) ?? false } catch { return false }
}

export async function savePhoto(profileId: string, date: string, pose: Pose, file: Blob): Promise<ProgressPhoto> {
  const { blob, width, height } = await shrinkImage(file)
  const existing = await db.photos.where('[profileId+date]').equals([profileId, date]).filter((p) => p.pose === pose).first()
  const row: ProgressPhoto = { id: existing?.id ?? uuid(), profileId, date, pose, blob, width, height, bytes: blob.size, updatedAt: now() }
  await db.photos.put(row)
  void requestPersistentStorage()
  return row
}

/** Fotos werden hart gelöscht (kein Soft-Delete), damit der Platz frei wird; sie sind nicht Teil des JSON-Exports. */
export async function deletePhoto(id: string) {
  await db.photos.delete(id)
}

/** Alle Datumswerte mit Fotos, ohne die Bilddaten zu laden (nur Index-Schlüssel). */
export async function photoDates(profileId: string): Promise<string[]> {
  const keys = await db.photos.where('[profileId+date]').between([profileId, ''], [profileId, '\uffff']).uniqueKeys()
  return (keys as unknown as [string, string][]).map((k) => k[1]).sort()
}

// ---- Termine: Start und die Blockgrenzen (Montag der Wochen 1, 5, 9, 13 und 17 = nach Woche 16) ----

export interface PhotoCheck {
  label: string
  week: number
  date: string
  /** Fenster, in dem ein Foto zu diesem Termin zählt: Freitag davor bis Donnerstag danach */
  from: string
  to: string
}
export type CheckStatus = 'fertig' | 'faellig' | 'offen'
export interface PhotoCheckStatus extends PhotoCheck { status: CheckStatus; doneDate?: string }

export function photoSchedule(start: string): PhotoCheck[] {
  const mk = (label: string, week: number): PhotoCheck => {
    const date = mondayOfWeek(start, week)
    return { label, week, date, from: addDays(date, -3), to: addDays(date, 3) }
  }
  return [mk('Start', 1), mk('Nach Block 1', 5), mk('Nach Block 2', 9), mk('Nach Block 3', 13), mk('Ende', 17)]
}

/** Status je Termin: fertig (Fotos im Fenster), fällig (Fenster offen oder verstrichen, keine Fotos), offen (liegt in der Zukunft). */
export function photoCheckStatus(start: string, dates: string[], today: string): PhotoCheckStatus[] {
  return photoSchedule(start).map((c) => {
    const doneDate = dates.find((d) => d >= c.from && d <= c.to)
    if (doneDate) return { ...c, status: 'fertig', doneDate }
    return { ...c, status: today >= c.from ? 'faellig' : 'offen' }
  })
}

/** Dateigröße lesbar: unter 1 MB in kB, sonst MB mit einer Nachkommastelle. */
export const fmtSize = (bytes: number) => bytes < 1048576
  ? `${Math.round(bytes / 1024)} kB`
  : `${(bytes / 1048576).toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`

// ---- Sicherung: eigene Datei, weil die Bilder den JSON-Export sonst aufblähen ----

interface PhotoDump {
  app: 'transformation16-photos'
  version: 1
  exportedAt: string
  photos: { id: string; profileId: string; date: string; pose: Pose; width: number; height: number; updatedAt: string; mime: string; data: string }[]
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result).split(',')[1] ?? '')
    r.onerror = () => rej(r.error)
    r.readAsDataURL(blob)
  })
}
function base64ToBlob(data: string, mime: string): Blob {
  const bin = atob(data)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function exportPhotos(): Promise<string> {
  const rows = await db.photos.toArray()
  const photos: PhotoDump['photos'] = []
  for (const p of rows) {
    photos.push({ id: p.id, profileId: p.profileId, date: p.date, pose: p.pose, width: p.width, height: p.height, updatedAt: p.updatedAt, mime: p.blob.type || 'image/jpeg', data: await blobToBase64(p.blob) })
  }
  const dump: PhotoDump = { app: 'transformation16-photos', version: 1, exportedAt: new Date().toISOString(), photos }
  return JSON.stringify(dump)
}

/** Zusammenführen wie beim Haupt-Import: neuere updatedAt gewinnt, unbekannte IDs werden ergänzt. */
export async function importPhotos(text: string): Promise<{ added: number; updated: number }> {
  const dump = JSON.parse(text) as PhotoDump
  if (dump.app !== 'transformation16-photos') throw new Error('Keine gültige Foto-Sicherung.')
  let added = 0
  let updated = 0
  for (const p of dump.photos) {
    const existing = await db.photos.get(p.id)
    if (existing && existing.updatedAt >= p.updatedAt) continue
    const blob = base64ToBlob(p.data, p.mime)
    await db.photos.put({ id: p.id, profileId: p.profileId, date: p.date, pose: p.pose, blob, width: p.width, height: p.height, bytes: blob.size, updatedAt: p.updatedAt })
    if (existing) updated++; else added++
  }
  return { added, updated }
}
