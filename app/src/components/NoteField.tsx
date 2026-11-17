import { useState } from 'react'

/**
 * Optionale Bemerkung (Satz, Übung, Einheit). Eingeklappt nur ein Knopf, damit das Feld im Training nicht stört;
 * mit Text bleibt es offen. Die Bemerkungen stehen im JSON-Export und im Verlauf der Übung.
 */
export default function NoteField({ value, onChange, label = 'Bemerkung', placeholder = 'z. B. Schulter gezogen, Last reduziert, lief leicht …', open: startOpen = false }: { value: string; onChange: (v: string) => void; label?: string; placeholder?: string; open?: boolean }) {
  const [open, setOpen] = useState(startOpen)
  if (!open && !value) return <button type="button" className="btn-ghost w-full text-sm" onClick={() => setOpen(true)}>+ {label}</button>
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <textarea className="input !text-base" rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

/** Bemerkung für die Datenbank: ohne Rand-Leerzeichen, leer = keine. */
export const cleanNote = (text: string) => text.trim() || undefined
