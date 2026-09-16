let ctx: AudioContext | null = null
let audioOn = true
let voiceOn = false

export function configureAudio(audio: boolean, voice: boolean) {
  audioOn = audio
  voiceOn = voice
}

export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    /* kein Audio verfügbar */
  }
}

export function beep(freq = 880, ms = 150, vol = 0.25) {
  if (!audioOn) return
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = vol
    o.connect(g)
    g.connect(ctx.destination)
    const t = ctx.currentTime
    o.start(t)
    g.gain.setValueAtTime(vol, t + ms / 1000 - 0.02)
    g.gain.linearRampToValueAtTime(0, t + ms / 1000)
    o.stop(t + ms / 1000)
  } catch {
    /* ignorieren */
  }
}

export const beepCount = () => beep(880, 120)
export const beepGo = () => {
  beep(1320, 250, 0.35)
}
export const beepEnd = () => {
  beep(660, 200)
  setTimeout(() => beep(660, 200), 250)
  setTimeout(() => beep(990, 400), 500)
}

export function speak(text: string) {
  if (!voiceOn || !('speechSynthesis' in window)) return
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    u.rate = 1.05
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  } catch {
    /* ignorieren */
  }
}
