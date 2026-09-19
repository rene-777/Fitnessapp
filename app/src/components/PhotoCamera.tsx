import { useCallback, useEffect, useRef, useState } from 'react'
import type { Pose } from '../db/types'
import { beepCount, beepGo, unlockAudio } from '../lib/audio'
import { POSES, poseLabel } from '../lib/photos'
import { keepAwake } from '../lib/wakeLock'

type Facing = 'user' | 'environment'
type Phase = 'live' | 'countdown' | 'preview' | 'saving' | 'saved' | 'error'
type Rot = 0 | 90 | 180 | 270

interface Props {
  /** Posen, zu denen es an diesem Datum schon ein Foto gibt */
  taken: Pose[]
  initialPose: Pose
  onSave: (pose: Pose, blob: Blob) => Promise<void>
  onClose: () => void
  /** Ausweg, wenn die Kamera nicht geht: Galerie oder Kamera-App über das Dateifeld */
  onPickFile: (pose: Pose) => void
}

const TIMERS = [3, 10] as const
const ROT_KEY = (f: Facing) => `t16.photoCamRot.${f}`
const MODE_KEY = (f: Facing) => `t16.photoCamMode.${f}`
const CROP_KEY = 't16.photoCamCrop'

/** Verschiedene Anforderungen an die Kamera. Befund auf dem Xiaomi des Users (19.09.2026): nur der Standard ohne
 *  Größenwunsch liefert ein echtes Hochformat mit vollem Blickfeld (480 × 640); jede Größenangabe ergibt ein
 *  Querformat mit weniger Bildhöhe. Deshalb Standard als Voreinstellung, dazu zwei Varianten, die aus dem
 *  Standard-Stream mehr Auflösung holen: nachträglich per applyConstraints, oder das Foto über ImageCapture.
 *  `after` wird auf die laufende Spur angewendet, `photo` nutzt ImageCapture.takePhoto() für die Aufnahme. */
interface CamMode { key: string; label: string; video: (f: Facing) => MediaTrackConstraints; after?: MediaTrackConstraints; photo?: boolean }
const MODES: CamMode[] = [
  { key: 'auto', label: 'Standard', video: (f) => ({ facingMode: f }) },
  { key: 'autoHi', label: 'Standard + Auflösung nachfordern', video: (f) => ({ facingMode: f }), after: { width: { ideal: 1440 }, height: { ideal: 1920 } } },
  { key: 'photo', label: 'Standard + Foto volle Auflösung', video: (f) => ({ facingMode: f }), photo: true },
  { key: 'maxw', label: 'Hoch, Breite ≤ 1080', video: (f) => ({ facingMode: f, width: { max: 1080 }, height: { ideal: 1920 } }) },
  { key: 'p1440', label: 'Hoch 1440×1920', video: (f) => ({ facingMode: f, width: { ideal: 1440 }, height: { ideal: 1920 } }) },
  { key: 'l1920', label: 'Quer 1920×1440', video: (f) => ({ facingMode: f, width: { ideal: 1920 }, height: { ideal: 1440 } }) },
  { key: 'p1080', label: 'Hoch 1080×1920', video: (f) => ({ facingMode: f, width: { ideal: 1080 }, height: { ideal: 1920 } }) },
  { key: 'ratio', label: 'Seitenverhältnis 3:4', video: (f) => ({ facingMode: f, aspectRatio: { ideal: 0.75 }, height: { ideal: 1920 } }) },
]
const modeOf = (k: string) => MODES.find((m) => m.key === k) ?? MODES[0]

/** ImageCapture ist in Chrome vorhanden, aber nicht in allen TypeScript-Bibliotheken deklariert. */
interface ImageCaptureLike { takePhoto(): Promise<Blob> }
type ImageCaptureCtor = new (track: MediaStreamTrack) => ImageCaptureLike
const getImageCapture = (): ImageCaptureCtor | undefined => (window as unknown as { ImageCapture?: ImageCaptureCtor }).ImageCapture
const loadMode = (f: Facing) => { try { const k = localStorage.getItem(MODE_KEY(f)); return k && MODES.some((m) => m.key === k) ? k : MODES[0].key } catch { return MODES[0].key } }
const saveMode = (f: Facing, k: string) => { try { localStorage.setItem(MODE_KEY(f), k) } catch { /* egal */ } }
const loadCrop = () => { try { return localStorage.getItem(CROP_KEY) !== '0' } catch { return true } }
const saveCrop = (c: boolean) => { try { localStorage.setItem(CROP_KEY, c ? '1' : '0') } catch { /* egal */ } }
const loadRot = (f: Facing): Rot => {
  try { const n = Number(localStorage.getItem(ROT_KEY(f))); return n === 90 || n === 180 || n === 270 ? n : 0 } catch { return 0 }
}
const saveRot = (f: Facing, r: Rot) => { try { localStorage.setItem(ROT_KEY(f), String(r)) } catch { /* egal */ } }

/** Ausgabegröße nach Drehung und optionalem Hochformat-Ausschnitt (Querformat → mittiges 3:4, volle Höhe bleibt). */
function outSize(sw: number, sh: number, r: Rot, crop: boolean): [number, number] {
  const swap = r === 90 || r === 270
  const w = swap ? sh : sw
  const h = swap ? sw : sh
  if (crop && w > h) return [Math.round((h * 3) / 4), h]
  return [w, h]
}

/** Zeichnet ein Bild gedreht (und ggf. mittig beschnitten) in ein Canvas. */
function drawRotated(target: HTMLCanvasElement, src: CanvasImageSource, sw: number, sh: number, r: Rot, crop: boolean) {
  const [w, h] = outSize(sw, sh, r, crop)
  if (target.width !== w || target.height !== h) { target.width = w; target.height = h }
  const ctx = target.getContext('2d')
  if (!ctx) return
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate((r * Math.PI) / 180)
  ctx.drawImage(src, -sw / 2, -sh / 2)
  ctx.restore()
}

/** Eigene Kamera-Ansicht mit Selbstauslöser: Pose wählen, Countdown mit Pieptönen, Vorschau, speichern, nächste Pose.
 *  Die Vorschau ist nie gespiegelt und zeigt genau das, was gespeichert wird (inklusive gemerkter Drehung je Kamera). */
export default function PhotoCamera({ taken, initialPose, onSave, onClose, onPickFile }: Props) {
  const [pose, setPose] = useState<Pose>(initialPose)
  const [facing, setFacing] = useState<Facing>('user')
  const [rot, setRot] = useState<Rot>(() => loadRot('user'))
  const [mode, setMode] = useState<string>(() => loadMode('user'))
  const [crop, setCrop] = useState<boolean>(loadCrop)
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(10)
  const [phase, setPhase] = useState<Phase>('live')
  const [left, setLeft] = useState(0)
  const [error, setError] = useState('')
  const [dims, setDims] = useState<[number, number] | null>(null)
  const [shot, setShot] = useState<{ blob: Blob; url: string; w: number; h: number } | null>(null)
  const [info, setInfo] = useState('')
  const [done, setDone] = useState<Pose[]>(taken)
  const videoRef = useRef<HTMLVideoElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)
  const rawRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const tickRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const dimsRef = useRef<[number, number]>([0, 0])
  const rotRef = useRef<Rot>(rot)
  const cropRef = useRef<boolean>(crop)
  useEffect(() => { rotRef.current = rot; cropRef.current = crop }, [rot, crop])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async (f: Facing, m: string) => {
    stop()
    if (!navigator.mediaDevices?.getUserMedia) { setError('Dieser Browser bietet keinen Kamerazugriff.'); setPhase('error'); return }
    try {
      const md = modeOf(m)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: md.video(f) })
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]
      let note = ''
      if (md.after && track) {
        try { await track.applyConstraints(md.after) } catch (e) { note = 'Nachfordern abgelehnt: ' + (e as Error).message }
      }
      if (md.photo && !getImageCapture()) note = 'ImageCapture nicht verfügbar, Aufnahme aus dem Videobild.'
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setInfo(note)
      setError('')
      setPhase('live')
    } catch (e) {
      const name = (e as DOMException).name
      setError(name === 'NotAllowedError' ? 'Kamerazugriff wurde abgelehnt. In den Website-Einstellungen von Chrome erlauben oder unten die Kamera-App nutzen.' : name === 'NotFoundError' ? 'Keine Kamera gefunden.' : 'Kamera konnte nicht gestartet werden: ' + (e as Error).message)
      setPhase('error')
    }
  }, [stop])

  const clearTick = () => { if (tickRef.current !== null) window.clearInterval(tickRef.current); tickRef.current = null }

  // Live-Bild: jedes Frame ungespiegelt und mit der gemerkten Drehung in das sichtbare Canvas zeichnen
  useEffect(() => {
    const draw = () => {
      const v = videoRef.current
      const c = liveRef.current
      if (v && c && v.videoWidth >= 100) {
        drawRotated(c, v, v.videoWidth, v.videoHeight, rotRef.current, cropRef.current)
        if (dimsRef.current[0] !== v.videoWidth || dimsRef.current[1] !== v.videoHeight) {
          dimsRef.current = [v.videoWidth, v.videoHeight]
          setDims([v.videoWidth, v.videoHeight])
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    keepAwake(true)
    // Kamera erst im nächsten Tick starten, damit der Effekt selbst keinen State setzt
    const id = window.setTimeout(() => void start(facing, mode), 0)
    return () => { window.clearTimeout(id); clearTick(); stop(); keepAwake(false) }
  }, [facing, mode, start, stop])

  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url) }, [shot])

  const render = (r: Rot, c: boolean) => {
    const raw = rawRef.current
    if (!raw) return
    const out = document.createElement('canvas')
    drawRotated(out, raw, raw.width, raw.height, r, c)
    out.toBlob((blob) => {
      if (!blob) { setError('Foto konnte nicht erstellt werden.'); setPhase('live'); return }
      setShot({ blob, url: URL.createObjectURL(blob), w: out.width, h: out.height })
      setPhase('preview')
    }, 'image/jpeg', 0.92)
  }

  /** Rohbild aus dem Videobild holen. */
  const grabFromVideo = (): HTMLCanvasElement | null => {
    const v = videoRef.current
    // Unter 100 px ist es kein Kamerabild (z. B. beendete Spur), dann lieber nicht speichern
    if (!v || v.videoWidth < 100) return null
    const raw = document.createElement('canvas')
    raw.width = v.videoWidth
    raw.height = v.videoHeight
    raw.getContext('2d')?.drawImage(v, 0, 0)
    return raw
  }

  /** Rohbild in voller Auflösung über ImageCapture (EXIF-Drehung wird berücksichtigt); null, wenn das nicht geht. */
  const grabFromImageCapture = async (): Promise<HTMLCanvasElement | null> => {
    const Ctor = getImageCapture()
    const track = streamRef.current?.getVideoTracks()[0]
    if (!Ctor || !track) return null
    try {
      const blob = await new Ctor(track).takePhoto()
      const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
      const raw = document.createElement('canvas')
      raw.width = bmp.width
      raw.height = bmp.height
      raw.getContext('2d')?.drawImage(bmp, 0, 0)
      bmp.close()
      return raw
    } catch (e) {
      setInfo('ImageCapture fehlgeschlagen (' + (e as Error).message + '), Aufnahme aus dem Videobild.')
      return null
    }
  }

  const capture = async () => {
    let raw: HTMLCanvasElement | null = null
    if (modeOf(mode).photo) raw = await grabFromImageCapture()
    raw ??= grabFromVideo()
    if (!raw) { setError('Kein Kamerabild. Bitte nochmal versuchen.'); setPhase('live'); return }
    rawRef.current = raw
    render(rotRef.current, cropRef.current)
  }

  // Drehen: wirkt sofort auf Live-Bild und Vorschau und wird für diese Kamera gemerkt
  const rotate = () => {
    const r = (((rot + 90) % 360) as Rot)
    setRot(r)
    saveRot(facing, r)
    if (rawRef.current) render(r, crop)
  }
  const toggleCrop = () => {
    const c = !crop
    setCrop(c)
    saveCrop(c)
    if (rawRef.current) render(rot, c)
  }
  // Nächsten Kamera-Modus probieren (Stream startet neu)
  const nextMode = () => {
    const i = MODES.findIndex((m) => m.key === mode)
    const k = MODES[(i + 1) % MODES.length].key
    saveMode(facing, k)
    setDims(null)
    dimsRef.current = [0, 0]
    setInfo('')
    setMode(k)
  }

  // Countdown: jede Sekunde ein Piep, bei 0 das Startsignal und der Auslöser
  const begin = () => {
    unlockAudio()
    setError('')
    let n = timer
    setLeft(n)
    setPhase('countdown')
    beepCount()
    clearTick()
    tickRef.current = window.setInterval(() => {
      n -= 1
      setLeft(n)
      if (n > 0) { beepCount(); return }
      clearTick()
      beepGo()
      void capture()
    }, 1000)
  }
  const cancelCountdown = () => { clearTick(); setPhase('live') }
  const retake = () => { setShot(null); rawRef.current = null; setPhase('live') }
  const switchFacing = () => {
    const nf: Facing = facing === 'user' ? 'environment' : 'user'
    setError('')
    setDims(null)
    dimsRef.current = [0, 0]
    setInfo('')
    setRot(loadRot(nf))
    setMode(loadMode(nf))
    setFacing(nf)
  }
  const save = async () => {
    if (!shot) return
    setPhase('saving')
    try {
      await onSave(pose, shot.blob)
      setDone((d) => (d.includes(pose) ? d : [...d, pose]))
      setShot(null)
      rawRef.current = null
      setPhase('saved')
    } catch (e) {
      setError('Speichern fehlgeschlagen: ' + (e as Error).message)
      setPhase('preview')
    }
  }
  const nextPose = POSES.map((p) => p.key).find((k) => !done.includes(k) && k !== pose) ?? POSES.map((p) => p.key).find((k) => !done.includes(k))
  const goNext = () => { if (nextPose) { setPose(nextPose); setPhase('live') } }
  const hint = POSES.find((p) => p.key === pose)?.hint ?? ''
  const busy = phase === 'countdown' || phase === 'saving'
  const outDims = dims ? outSize(dims[0], dims[1], rot, crop) : null
  const modeLabel = modeOf(mode).label
  const showLive = phase === 'live' || phase === 'countdown'

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Kopf: Pose wählen */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Foto aufnehmen</div>
          <button className="btn-ghost !px-3 !py-1.5 !text-sm" onClick={onClose} disabled={busy}>Schließen</button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {POSES.map((p) => (
            <button key={p.key} disabled={busy || phase === 'preview'} onClick={() => setPose(p.key)}
              className={`rounded-lg py-1.5 text-sm border ${pose === p.key ? 'bg-accent text-black border-accent font-semibold' : 'bg-card2 border-line'}`}>
              {p.label}{done.includes(p.key) ? ' ✓' : ''}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted text-center">{hint}{done.includes(pose) && phase === 'live' ? ' · ersetzt das vorhandene Foto' : ''}</div>
      </div>

      {/* Bild: das Video selbst bleibt unsichtbar, gezeigt wird das Canvas (ungespiegelt, gedreht) */}
      <div className="flex-1 relative min-h-0 bg-black">
        <video ref={videoRef} playsInline muted autoPlay className="absolute w-px h-px opacity-0 pointer-events-none"
          onLoadedMetadata={(e) => { const v = e.currentTarget; dimsRef.current = [v.videoWidth, v.videoHeight]; setDims([v.videoWidth, v.videoHeight]) }}
          onResize={(e) => { const v = e.currentTarget; dimsRef.current = [v.videoWidth, v.videoHeight]; setDims([v.videoWidth, v.videoHeight]) }} />
        <canvas ref={liveRef} className={`absolute inset-0 w-full h-full object-contain ${showLive ? '' : 'invisible'}`} />
        {shot && (phase === 'preview' || phase === 'saving') && (
          <>
            <img src={shot.url} alt="Aufnahme" className="absolute inset-0 w-full h-full object-contain" />
            <div className="absolute bottom-1 left-0 right-0 text-center text-xs text-muted drop-shadow-[0_0_6px_rgba(0,0,0,1)]">Aufnahme {shot.w} × {shot.h}</div>
          </>
        )}
        {phase === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-[9rem] leading-none font-bold text-accent drop-shadow-[0_0_24px_rgba(0,0,0,0.9)]">{left}</div>
          </div>
        )}
        {phase === 'saved' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="text-ok text-2xl font-bold">✓ {poseLabel(pose)} gespeichert</div>
            <div className="text-muted text-sm">{nextPose ? `Als Nächstes: ${poseLabel(nextPose)}.` : 'Alle vier Fotos sind da.'}</div>
          </div>
        )}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="text-bad text-sm">{error}</div>
          </div>
        )}
      </div>

      {/* Fuß: Bedienung */}
      <div className="p-3 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && phase !== 'error' && <div className="text-xs text-bad text-center">{error}</div>}
        {phase === 'live' && (
          <>
            <div className="flex gap-2 items-center">
              <div className="flex gap-1">
                {TIMERS.map((t) => (
                  <button key={t} onClick={() => setTimer(t)} className={`rounded-lg px-3 py-2 text-sm border ${timer === t ? 'bg-accent text-black border-accent font-semibold' : 'bg-card2 border-line'}`}>{t} s</button>
                ))}
              </div>
              <button className="btn-ghost flex-1 !py-2 !text-sm" onClick={switchFacing}>{facing === 'user' ? 'Frontkamera' : 'Rückkamera'} ⇄</button>
              <button className="btn-ghost !py-2 !px-3 !text-sm" onClick={rotate} disabled={!dims} aria-label="Bild drehen">↻</button>
            </div>
            <button className="btn-primary w-full" onClick={begin}>Aufnehmen ({timer} s Selbstauslöser)</button>
            <div className="flex gap-2 text-xs">
              <button className="btn-ghost flex-1 !py-1.5 !px-2 !text-xs !font-normal" onClick={nextMode}>Modus: {modeLabel} ›</button>
              <button className={`flex-1 rounded-xl py-1.5 px-2 border ${crop ? 'bg-accent/15 border-accent/40 text-accent2' : 'bg-card2 border-line text-muted'}`} onClick={toggleCrop}>Ausschnitt 3:4 {crop ? 'an' : 'aus'}</button>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{dims && outDims ? `Kamera ${dims[0]} × ${dims[1]} → Bild ${outDims[0]} × ${outDims[1]}${outDims[1] > outDims[0] ? ' (Hochformat)' : ' (Querformat)'}${modeOf(mode).photo ? ', Foto per ImageCapture' : ''}` : 'Kamera startet …'}</span>
              <button onClick={() => onPickFile(pose)}>Galerie / Kamera-App</button>
            </div>
            {info && <div className="text-xs text-warn">{info}</div>}
          </>
        )}
        {phase === 'countdown' && <button className="btn-ghost w-full" onClick={cancelCountdown}>Abbrechen</button>}
        {(phase === 'preview' || phase === 'saving') && (
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={retake} disabled={phase === 'saving'}>Nochmal</button>
            <button className="btn-ghost !px-3" onClick={rotate} disabled={phase === 'saving'} aria-label="Bild drehen">↻</button>
            <button className="btn-primary flex-1" onClick={save} disabled={phase === 'saving'}>{phase === 'saving' ? 'Speichern …' : `Speichern als ${poseLabel(pose)}`}</button>
          </div>
        )}
        {phase === 'saved' && (
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={onClose}>Fertig</button>
            {nextPose && <button className="btn-primary flex-1" onClick={goNext}>Weiter: {poseLabel(nextPose)}</button>}
          </div>
        )}
        {phase === 'error' && (
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => start(facing, mode)}>Nochmal versuchen</button>
            <button className="btn-primary flex-1" onClick={() => onPickFile(pose)}>Kamera-App / Galerie</button>
          </div>
        )}
      </div>
    </div>
  )
}
