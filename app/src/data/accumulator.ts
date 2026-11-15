// Accumulator (Goliaz-App): Burpee-Stufentest als Ausdauer-Benchmark, ersetzt seit 15.11.2026 den Bleep-Test.
// Ein GO, ein Burpee; der Abstand der GO-Kommandos sinkt von 10,0 s auf 2,0 s (rund 120 Burpees in 8:14 min).
// Die Stimme sagt fortlaufend eine Zahl an (16–65); die letzte Zahl vor dem Abbruch ist der geschätzte VO2max-Wert.
// Tabelle aus der Tonspur einer Bildschirmaufnahme vom 15.11.2026 (GO-Zeitpunkte gemessen, Zahlen per Whisper gelesen):
// Burpees, die absolviert sind, wenn die Zahl angesagt wird. Bis 55 einzeln gemessen, ab 56 aus dem Takt ergänzt (±1–2).

export const ACCUMULATOR_EXERCISE_ID = 'accumulator'
export const ACCUMULATOR_KEY = 'accumulatorVo2'
export const ACCUMULATOR_BURPEES_KEY = 'accumulatorBurpees'
/** Segment-Label des Burpee-Satzes, der aus dem Testwert abgeleitet wird (zählt bei „Wiederholungen gesamt“, nicht als Kraftsatz). */
export const ACCUMULATOR_SUM_LABEL = 'amrap-accumulator-sum'

export const ACCUMULATOR_MIN = 16
export const ACCUMULATOR_MAX = 65

/** Index 0 = Zahl 16, Index 49 = Zahl 65. */
const BURPEES_AT_LEVEL = [
  1, 3, 6, 9, 12, 15, 18, 21, 24, 26, // 16–25
  29, 32, 35, 37, 40, 43, 45, 48, 51, 53, // 26–35
  56, 58, 60, 63, 65, 68, 70, 72, 75, 77, // 36–45
  79, 82, 84, 86, 88, 90, 93, 95, 97, 99, // 46–55
  101, 103, 105, 107, 109, 111, 113, 115, 117, 120, // 56–65
]

/** Burpees bis zur angesagten Zahl; außerhalb von 16–65 undefined (Eingabefehler). */
export function accumulatorBurpees(level: number): number | undefined {
  if (!Number.isInteger(level) || level < ACCUMULATOR_MIN || level > ACCUMULATOR_MAX) return undefined
  return BURPEES_AT_LEVEL[level - ACCUMULATOR_MIN]
}
