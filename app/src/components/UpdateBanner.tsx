import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Updates werden nur angeboten, nie automatisch geladen: Ein erzwungener Reload mitten in einer
 * Datenbank-Aktion hat am 17.09.2026 die Trainings-Tabelle blockiert, und im Training würde er Timer abbrechen.
 */
export default function UpdateBanner({ hidden }: { hidden?: boolean }) {
  const [update, setUpdate] = useState<(() => void) | null>(null)
  useEffect(() => {
    const updateSW = registerSW({ onNeedRefresh: () => setUpdate(() => () => void updateSW(true)) })
  }, [])
  if (!update || hidden) return null
  return (
    <div className="fixed top-0 inset-x-0 z-40 bg-accent text-black px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold">Neue Version verfügbar</span>
      <button className="rounded-lg bg-black/85 text-white px-3 py-1.5" onClick={update}>Jetzt aktualisieren</button>
    </div>
  )
}
