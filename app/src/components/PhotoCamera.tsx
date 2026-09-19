import { useCallback, useEffect, useRef, useState } from 'react'
import type { Pose } from '../db/types'
import { beepCount, beepGo, unlockAudio } from '../lib/audio'
import { POSES, poseLabel } from '../lib/photos'
import { keepAwake } from '../lib/wakeLock'

type Facing = 'user' | 'environment'
type Phase = 'live' | 'countdown' | 'preview' | 'saving' | 'saved' | 'error'

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

/** Eigene Kamera-Ansicht mit Selbstauslöser: Pose wählen, Countdown mit Pieptönen, Vorschau, speichern, nächste Pose. */
export default function PhotoCamera({ taken, initialPose, onSave, onClose, onPickFile }: Props) {
  const [pose, setPose] = useState<Pose>(initialPose)
  const [facing, setFacing] = useState<Facing>('user')
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(10)
  const [phase, setPhase] = useState<Phase>('live')
  const [left, setLeft] = useState(0)
  const [error, setError] = useState('')
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null)
  const [done, setDone] = useState<Pose[]>(taken)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const tickRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async (f: Facing) => {
    stop()
    if (!navigator.mediaDevices?.getUserMedia) { setError('Dieser Browser bietet keinen Kamerazugriff.'); setPhase('error'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: f, width: { ideal: 1440 }, height: { ideal: 1920 } } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setError('')
      setPhase('live')
    } catch (e) {
      const name = (e as DOMException).name
      setError(name === 'NotAllowedError' ? 'Kamerazugriff wurde abgelehnt. In den Website-Einstellungen von Chrome erlauben oder unten die Kamera-App nutzen.' : name === 'NotFoundError' ? 'Keine Kamera gefunden.' : 'Kamera konnte nicht gestartet werden: ' + (e as Error).message)
      setPhase('error')
    }
  }, [stop])

  const clearTick = () => { if (tickRef.current !== null) window.clearInterval(tickRef.current); tickRef.current = null }

  useEffect(() => {
    keepAwake(true)
    // Kamera erst im nächsten Tick starten, damit der Effekt selbst keinen State setzt
    const id = window.setTimeout(() => void start(facing), 0)
    return () => { window.clearTimeout(id); clearTick(); stop(); keepAwake(false) }
  }, [facing, start, stop])

  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url) }, [shot])

  const capture = () => {
    const v = videoRef.current
    // Unter 100 px ist es kein Kamerabild (z. B. beendete Spur), dann lieber nicht speichern
    if (!v || v.videoWidth < 100) { setError('Kein Kamerabild. Bitte nochmal versuchen.'); setPhase('live'); return }
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')?.drawImage(v, 0, 0)
    c.toBlob((blob) => {
      if (!blob) { setError('Foto konnte nicht erstellt werden.'); setPhase('live'); return }
      setShot({ blob, url: URL.createObjectURL(blob) })
      setPhase('preview')
    }, 'image/jpeg', 0.92)
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
      capture()
    }, 1000)
  }
  const cancelCountdown = () => { clearTick(); setPhase('live') }
  const retake = () => { setShot(null); setPhase('live') }
  const save = async () => {
    if (!shot) return
    setPhase('saving')
    try {
      await onSave(pose, shot.blob)
      setDone((d) => (d.includes(pose) ? d : [...d, pose]))
      setShot(null)
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

      {/* Bild */}
      <div className="flex-1 relative min-h-0 bg-black">
        <video ref={videoRef} playsInline muted autoPlay
          className={`absolute inset-0 w-full h-full object-contain ${facing === 'user' ? 'scale-x-[-1]' : ''} ${phase === 'preview' || phase === 'saving' || phase === 'saved' || phase === 'error' ? 'invisible' : ''}`} />
        {shot && (phase === 'preview' || phase === 'saving') && <img src={shot.url} alt="Aufnahme" className="absolute inset-0 w-full h-full object-contain" />}
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
              <button className="btn-ghost flex-1 !py-2 !text-sm" onClick={() => { setError(''); setFacing((f) => (f === 'user' ? 'environment' : 'user')) }}>{facing === 'user' ? 'Frontkamera' : 'Rückkamera'} ⇄</button>
            </div>
            <button className="btn-primary w-full" onClick={begin}>Aufnehmen ({timer} s Selbstauslöser)</button>
            <button className="text-xs text-muted w-full text-center py-1" onClick={() => onPickFile(pose)}>Stattdessen aus Galerie oder Kamera-App wählen</button>
          </>
        )}
        {phase === 'countdown' && <button className="btn-ghost w-full" onClick={cancelCountdown}>Abbrechen</button>}
        {(phase === 'preview' || phase === 'saving') && (
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={retake} disabled={phase === 'saving'}>Nochmal</button>
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
            <button className="btn-ghost flex-1" onClick={() => start(facing)}>Nochmal versuchen</button>
            <button className="btn-primary flex-1" onClick={() => onPickFile(pose)}>Kamera-App / Galerie</button>
          </div>
        )}
      </div>
    </div>
  )
}
