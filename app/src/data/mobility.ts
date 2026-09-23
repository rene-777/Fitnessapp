import type { Segment, Session, TimedItem } from './planTypes'

// Mobility außerhalb des Wochenplans (Beschluss 23.09.2026, siehe docs/Mobility.md):
// zwei Routinen à 15 min für Samstag/Sonntag (oder nach Zone 2 am Donnerstag) und der Mobility-Check
// in Woche 1, 4, 8, 12 und 16. Alles freiwillig, zählt nicht als Plan-Einheit.

const t = (exerciseId: string, seconds: number, o: Partial<TimedItem> = {}): TimedItem => ({ exerciseId, seconds, ...o })
const pause = (seconds: number): TimedItem => ({ title: 'Pause', seconds })

export const MOBILITY_PREFIX = 'mob-'
export const MOBILITY_CHECK_KEY = 'mob-check'
export const MOBILITY_CHECK_WEEKS = [1, 4, 8, 12, 16]
export const isMobilityKey = (key: string) => key.startsWith(MOBILITY_PREFIX)

/** Routine A: Hüfte und Sprunggelenk, etwa 15 min. Die Hauptbaustellen des Users, Zielbild tiefe Kniebeuge. */
const HIP: Session = {
  key: 'mob-hip', weekday: 7, title: 'Mobility: Hüfte + Sprunggelenk', kind: 'mobility', minutes: 15,
  focus: 'Hüftrotation, Hüftbeuger, Sprunggelenk, tiefe Kniebeuge',
  segments: [
    {
      type: 'timed', role: 'mobility', title: 'Hüfte + Sprunggelenk', items: [
        t('hip-cars', 45, { perSide: true, reps: '4 Kreise je Richtung' }),
        t('knee-wall-mob', 45, { perSide: true, reps: '12×' }),
        t('calf-wall', 40, { perSide: true, note: 'je 20 s gestreckt und gebeugt' }),
        t('ninety-ninety-switch', 60, { reps: '10 Wechsel' }),
        t('ninety-ninety-hold', 40, { perSide: true }),
        t('couch-stretch', 60, { perSide: true }),
        t('adductor-rock', 45, { perSide: true }),
        t('figure-four', 45, { perSide: true }),
        t('deep-squat-hold', 30, { note: 'mit Kettlebell als Gegengewicht' }),
        pause(15),
        t('deep-squat-hold', 30),
        pause(15),
        t('deep-squat-hold', 30),
        t('hamstring-stretch', 40, { perSide: true }),
      ],
    },
  ],
}

/** Routine B: Schulter und Brustwirbelsäule, etwa 15 min, mit Hüftanteil. Rechte Schulter nur schmerzfrei. */
const SHOULDER: Session = {
  key: 'mob-shoulder', weekday: 7, title: 'Mobility: Schulter + Brustwirbelsäule', kind: 'mobility', minutes: 15,
  focus: 'Brustwirbelsäule, Schulter über Kopf, hintere Kapsel, Hüftanteil',
  segments: [
    {
      type: 'timed', role: 'mobility', title: 'Schulter + Brustwirbelsäule', items: [
        t('cat-cow', 45, { reps: '10×' }),
        t('open-book', 45, { perSide: true, reps: '8× je Seite' }),
        t('thread-needle', 45, { perSide: true, reps: '8× je Seite' }),
        t('shoulder-cars', 45, { perSide: true, reps: '4 Kreise' }),
        t('wall-slides', 60, { reps: '12×' }),
        t('dead-hang', 30, { note: 'Zehen am Boden zum Dosieren' }),
        pause(15),
        t('dead-hang', 30),
        t('chest-doorway', 45, { perSide: true }),
        t('sleeper-stretch', 30, { perSide: true, note: 'sanft, ein Drittel der Kraft' }),
        t('puppy-pose', 45),
        t('cobra', 30),
        t('couch-stretch', 45, { perSide: true, note: 'Hüftanteil' }),
        t('deep-squat-hold', 45, { note: 'Hüftanteil, mit Kettlebell' }),
      ],
    },
  ],
}

const measure = (label: string, exerciseId: string, benchmarkKey: string, description: string, o: Partial<Extract<Segment, { type: 'measure' }>> = {}): Segment =>
  ({ type: 'measure', label, exerciseId, benchmarkKey, unit: 'cm', description, ...o })

/** Mobility-Check: kurzes Warm-up, dann vier Messungen. Ergebnisse als Benchmarks, Verlauf in der Auswertung. */
const CHECK: Session = {
  key: MOBILITY_CHECK_KEY, weekday: 7, title: 'Mobility-Check', kind: 'mobility', minutes: 10,
  focus: 'Vier Messungen: Sprunggelenk, hintere Kette, Schulter, Hüftrotation',
  segments: [
    {
      type: 'timed', role: 'warmup', title: 'Kurz warm machen', items: [
        t('hip-cars', 30, { perSide: true, reps: '3 Kreise je Richtung' }),
        t('knee-wall-mob', 20, { perSide: true, reps: '8×' }),
        t('shoulder-circles', 20),
        t('cat-cow', 20, { reps: '5×' }),
      ],
    },
    measure('1', 'test-knee-wall', 'kneeWall', 'Abstand große Zehe bis Wand in cm, bei dem das Knie die Wand gerade noch berührt und die Ferse unten bleibt. Immer dieselbe Stelle.', { perSide: true, hint: 'Größer ist besser. Änderungen unter 2 cm sind Messrauschen.' }),
    measure('2', 'test-sit-reach', 'sitReach', 'Fingerspitzen über die Zehen hinaus = plus, davor = minus. Bester von drei Versuchen, nicht wippen.', { allowNegative: true, hint: 'Größer ist besser. Minuswerte sind erlaubt.' }),
    measure('3', 'test-overhead-reach', 'overheadReach', 'Rückenlage, Arm gestreckt über den Kopf, unterer Rücken bleibt am Boden. Abstand Handgelenk zum Boden in cm.', { perSide: true, hint: 'Kleiner ist besser, 0 = liegt auf.' }),
    measure('4', 'test-9090', 'hip9090', '90/90-Sitz, Oberkörper aufrecht ohne Abstützen. Abstand hinteres Knie zum Boden in cm. Gemessen wird die Seite des hinteren Beins.', { perSide: true, hint: 'Kleiner ist besser, 0 = liegt auf.' }),
    { type: 'note', title: 'Fotos', text: 'Zum Foto-Check gehören zwei Mobility-Posen: tiefe Kniebeuge von der Seite und Überkopf-Kniebeuge von vorn. Die Fotos entstehen zu den Foto-Check-Terminen (Mehr → Foto-Check).' },
  ],
}

export const MOBILITY_ROUTINES: Session[] = [HIP, SHOULDER]
export const MOBILITY_SESSIONS: Session[] = [HIP, SHOULDER, CHECK]

/** Vorschlag für den Tag: Samstag Hüfte, Sonntag Schulter, sonst die Routine, die länger zurückliegt. */
export function suggestedRoutine(weekday: number, lastDates: Record<string, string | undefined>): Session {
  if (weekday === 6) return HIP
  if (weekday === 7) return SHOULDER
  const [a, b] = MOBILITY_ROUTINES
  const da = lastDates[a.key] ?? ''
  const db = lastDates[b.key] ?? ''
  return da <= db ? a : b
}
