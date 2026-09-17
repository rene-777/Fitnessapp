import { useEffect, useRef, useState } from 'react'
import { beepCount, beepEnd, beepGo } from '../lib/audio'
import { fmtSec } from '../lib/dates'

interface Props {
  seconds: number
  onDone: () => void
  label?: string
  autoStart?: boolean
  size?: 'lg' | 'md'
  allowExtend?: boolean
  onTick?: (remaining: number) => void
}

/** Countdown, robust gegen Hintergrund-Drosselung (rechnet mit Zeitstempeln). */
export default function Timer({ seconds, onDone, label, autoStart = true, size = 'lg', allowExtend = true, onTick }: Props) {
  const [endAt, setEndAt] = useState<number | null>(autoStart ? Date.now() + seconds * 1000 : null)
  const [remaining, setRemaining] = useState(seconds)
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null)
  const lastBeep = useRef<number>(-1)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (endAt === null) return
    const id = setInterval(() => {
      const r = Math.max(0, (endAt - Date.now()) / 1000)
      setRemaining(r)
      onTick?.(r)
      const whole = Math.ceil(r)
      if (whole <= 3 && whole >= 1 && lastBeep.current !== whole) {
        lastBeep.current = whole
        beepCount()
      }
      if (r <= 0 && !doneRef.current) {
        doneRef.current = true
        beepEnd()
        clearInterval(id)
        onDoneRef.current()
      }
    }, 200)
    return () => clearInterval(id)
  }, [endAt, onTick])

  const start = () => {
    doneRef.current = false
    lastBeep.current = -1
    setEndAt(Date.now() + (pausedRemaining ?? seconds) * 1000)
    setPausedRemaining(null)
  }
  const pause = () => {
    setPausedRemaining(remaining)
    setEndAt(null)
  }
  const extend = (s: number) => {
    if (endAt !== null) setEndAt(endAt + s * 1000)
    else setPausedRemaining((pausedRemaining ?? seconds) + s)
  }
  const running = endAt !== null
  const shown = running ? remaining : (pausedRemaining ?? seconds)
  const pct = Math.min(100, Math.max(0, (shown / seconds) * 100))

  return (
    <div className="card text-center">
      {label && <div className="label mb-1">{label}</div>}
      <div className={size === 'lg' ? 'text-6xl font-bold tabular-nums my-2' : 'text-4xl font-bold tabular-nums my-1'}>{fmtSec(Math.ceil(shown))}</div>
      <div className="h-1.5 w-full rounded bg-card2 overflow-hidden mb-3">
        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 justify-center">
        {!running && <button className="btn-primary flex-1" onClick={start}>{pausedRemaining !== null ? 'Weiter' : 'Start'}</button>}
        {running && <button className="btn-ghost flex-1" onClick={pause}>Pause</button>}
        {allowExtend && <button className="btn-ghost" onClick={() => extend(30)}>+30 s</button>}
        <button className="btn-ghost" onClick={() => { doneRef.current = true; setEndAt(null); onDoneRef.current() }}>Überspringen</button>
      </div>
    </div>
  )
}

/** Vorlauf 3-2-1 vor zeitgebundenen Übungen: Zeit, um nach dem Tipp auf „Start“ in Position zu gehen. */
export function GetReady({ seconds = 3, onGo }: { seconds?: number; onGo: () => void }) {
  const [endAt] = useState(() => Date.now() + seconds * 1000)
  const [left, setLeft] = useState(seconds)
  const onGoRef = useRef(onGo)
  onGoRef.current = onGo
  useEffect(() => {
    let last = -1
    const id = setInterval(() => {
      const r = (endAt - Date.now()) / 1000
      if (r <= 0) {
        clearInterval(id)
        beepGo()
        onGoRef.current()
        return
      }
      const whole = Math.ceil(r)
      if (whole !== last) { last = whole; beepCount(); setLeft(whole) }
    }, 100)
    return () => clearInterval(id)
  }, [endAt])
  return (
    <div className="card text-center">
      <div className="label mb-1">Mach dich bereit</div>
      <div className="text-7xl font-bold tabular-nums my-2 text-accent">{left}</div>
    </div>
  )
}

/** Stoppuhr; mit leadIn läuft vor dem ersten Start der 3-2-1-Vorlauf. */
export function Stopwatch({ onChange, leadIn, autoStart }: { onChange?: (elapsedSec: number) => void; leadIn?: boolean; autoStart?: boolean }) {
  const [startAt, setStartAt] = useState<number | null>(() => (autoStart ? Date.now() : null))
  const [ready, setReady] = useState(false)
  const [acc, setAcc] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (startAt === null) return
    const id = setInterval(() => {
      const e = acc + (Date.now() - startAt) / 1000
      setElapsed(e)
      onChange?.(e)
    }, 250)
    return () => clearInterval(id)
  }, [startAt, acc, onChange])
  const running = startAt !== null
  if (ready) return <GetReady onGo={() => { setReady(false); setStartAt(Date.now()) }} />
  return (
    <div className="card text-center">
      <div className="text-5xl font-bold tabular-nums my-2">{fmtSec(elapsed)}</div>
      <div className="flex gap-2 justify-center">
        {!running && <button className="btn-primary flex-1" onClick={() => (leadIn && acc === 0 ? setReady(true) : setStartAt(Date.now()))}>{acc > 0 ? 'Weiter' : 'Start'}</button>}
        {running && <button className="btn-ghost flex-1" onClick={() => { setAcc(elapsed); setStartAt(null) }}>Stopp</button>}
        <button className="btn-ghost" onClick={() => { setAcc(0); setElapsed(0); setStartAt(null); onChange?.(0) }}>Reset</button>
      </div>
    </div>
  )
}
