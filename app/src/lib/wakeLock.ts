let lock: WakeLockSentinel | null = null

export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && !lock) {
      lock = await navigator.wakeLock.request('screen')
      lock.addEventListener('release', () => {
        lock = null
      })
    }
  } catch {
    /* nicht verfügbar (z. B. HTTP ohne TLS) */
  }
}

export function releaseWakeLock() {
  void lock?.release()
  lock = null
}

// Nach Tab-Wechsel erneut anfordern
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wanted) void requestWakeLock()
})
let wanted = false
export function keepAwake(on: boolean) {
  wanted = on
  if (on) void requestWakeLock()
  else releaseWakeLock()
}
