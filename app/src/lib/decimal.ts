// Dezimalzahlen aus Textfeldern: Die deutsche Android-Tastatur liefert ein Komma, das ein
// <input type="number"> verwirft. Deshalb Textfelder mit inputMode="decimal" und dieser Umrechnung.

/** "12,5" oder "12.5" → 12.5, gerundet auf `digits` Nachkommastellen; leer oder unbrauchbar → ''. */
export function parseDecimal(text: string, digits = 2): number | '' {
  const t = text.trim().replace(',', '.')
  if (t === '') return ''
  const n = Number(t)
  if (!Number.isFinite(n)) return ''
  const f = 10 ** digits
  return Math.round(n * f) / f
}

/** Zahl für ein Textfeld oder eine Anzeige mit Komma, z. B. 12.5 → "12,5"; '' bleibt leer. */
export function fmtDec(n: number | '' | undefined, digits = 2): string {
  if (n === '' || n === undefined) return ''
  return n.toLocaleString('de-DE', { maximumFractionDigits: digits })
}
