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

/** Zahl für ein Textfeld oder eine Anzeige mit Komma, z. B. 12.5 → "12,5"; '' bleibt leer.
 *  `minDigits` erzwingt Nachkommastellen (74 → "74,0"). */
export function fmtDec(n: number | '' | undefined, digits = 2, minDigits = 0): string {
  if (n === '' || n === undefined) return ''
  return n.toLocaleString('de-DE', { minimumFractionDigits: minDigits, maximumFractionDigits: Math.max(digits, minDigits) })
}

/** Körpermaße (Gewicht, Taille): immer genau eine Nachkommastelle, z. B. 74 → "74,0". */
export function fmtBody(n: number | '' | undefined): string {
  return fmtDec(n, 1, 1)
}
