import type { Block, ChallengeTarget, Prescription, Segment, Session, TimedItem, TimedRole, Week } from './planTypes'
import { MOBILITY_SESSIONS } from './mobility'

export const PLAN_NAME = 'Transformation 16'
export const DEFAULT_START = '2026-09-21'

export const BLOCKS: Block[] = [
  { number: 1, name: 'Fundament', weeks: [1, 2, 3, 4], focus: 'Technik an der Bio Force, Einstufung, Hypertrophie-Basis, Knie-Aufbau', repRange: '8–12 Wdh., 1–2 RIR' },
  { number: 2, name: 'Hypertrophie', weeks: [5, 6, 7, 8], focus: 'Muskelaufbau mit Schwerpunkt obere Brust, Schultern, Beine', repRange: '6–10 Wdh., 0–2 RIR' },
  { number: 3, name: 'Kraft & Power', weeks: [9, 10, 11, 12], focus: 'Maximalkraft, Explosivität, Ausdauer hochfahren', repRange: '4–6 Wdh., 2–3 RIR + Power' },
  { number: 4, name: 'Transformation', weeks: [13, 14, 15, 16], focus: 'Kraft halten, Hypertrophie-Intensivierung, Fettabbau, HIIT ≥ 75 min/Woche', repRange: '6–10 Wdh., 0–1 RIR' },
]

// Wochenziele der Kraftausdauer-Challenge (Woche 4): Faktor × Benchmark
export const CHALLENGE_TARGETS: ChallengeTarget[] = [
  { exerciseId: 'pushup', label: 'Push-Ups', benchmarkKey: 'pushupsMax', factor: 8, fallback: 520 },
  { exerciseId: 'pullup', label: 'Pull-Ups', benchmarkKey: 'pullupsMax', factor: 12, fallback: 144 },
  { exerciseId: 'kniebeuge-bw', label: 'Kniebeugen', benchmarkKey: 'squats1min', factor: 10, fallback: 500 },
  { exerciseId: 'burpee', label: 'Burpees', benchmarkKey: 'burpees5min', factor: 4, fallback: 272 },
]

// ---------- Bausteine ----------
const p = (exerciseId: string, sets: number, o: Partial<Prescription> = {}): Prescription => ({ exerciseId, sets, ...o })
const reps = (exerciseId: string, sets: number, repsMin: number, repsMax: number, o: Partial<Prescription> = {}): Prescription =>
  ({ exerciseId, sets, repsMin, repsMax, ...o })

// Zeitgeführte Abläufe: jeder Posten läuft mit Timer, danach geht es mit Signal von selbst weiter (Wunsch des Users, 23.09.2026).
// Warm-up etwa 8 min, Cool-down etwa 5 min: statisches Dehnen 30–45 s je Seite, nur nach dem Training (vorher kostet es Kraft).
const timed = (role: TimedRole, title: string, items: TimedItem[]): Segment => ({ type: 'timed', role, title, items })
const t = (exerciseId: string, seconds: number, o: Partial<TimedItem> = {}): TimedItem => ({ exerciseId, seconds, ...o })
const txt = (title: string, seconds: number, note?: string): TimedItem => ({ title, seconds, note })
const straight = (label: string, exercises: Prescription[], restSec: number, note?: string): Segment =>
  ({ type: 'block', label, kind: 'straight', exercises, restSec, note })
const superset = (label: string, exercises: Prescription[], restBetweenSec = 30, restSec = 90, note?: string): Segment =>
  ({ type: 'block', label, kind: 'superset', exercises, restSec, restBetweenSec, note })

// Umbau-Hinweise: Jede Einheit ist so sortiert, dass der Sitz höchstens einmal umgebaut wird.
// Innerhalb eines Supersatzes haben alle Bio-Force-Übungen denselben Sitz-Status (Exercise.seat).
const SEAT_OFF: Segment = { type: 'note', title: 'Umbau: Sitz abbauen', text: 'Alle folgenden Bio-Force-Übungen dieser Einheit laufen ohne Sitz.' }
const SEAT_ON: Segment = { type: 'note', title: 'Umbau: Sitz anbringen', text: 'Sitz und Beinmodul anbringen. Alle folgenden Bio-Force-Übungen dieser Einheit laufen mit Sitz.' }

const WARM_PUSH = timed('warmup', 'Warm-up', [
  t('seil', 120, { reps: 'locker' }),
  t('shoulder-circles', 30),
  t('cat-cow', 40, { reps: '10×' }),
  t('open-book', 30, { perSide: true, reps: '6× je Seite' }),
  t('wall-slides', 40, { reps: '10×' }),
  t('scapula-pushup', 30, { reps: '10×' }),
  t('schraegdruecken', 120, { reps: '2 × 10 leicht', note: 'Aufwärmsätze, etwa halbe Arbeitslast' }),
])
const WARM_LEGS = timed('warmup', 'Warm-up', [
  txt('Marschieren oder Seil leicht', 150),
  t('hip-cars', 30, { perSide: true, reps: '3 Kreise je Richtung' }),
  t('knee-wall-mob', 30, { perSide: true, reps: '10×' }),
  t('leg-swings', 30, { perSide: true, reps: '10× vor/zurück, 10× seitlich' }),
  t('ninety-ninety-switch', 45, { reps: '8 Wechsel' }),
  t('kniebeuge-bw', 30, { reps: '10 halbe Kniebeugen' }),
  t('wall-sit', 30, { note: 'Sehnenvorbereitung' }),
  txt('Pause', 20),
  t('wall-sit', 30, { note: 'Sehnenvorbereitung' }),
])
const WARM_PULL = timed('warmup', 'Warm-up', [
  t('seil', 120, { reps: 'locker' }),
  t('shoulder-circles', 30),
  t('open-book', 30, { perSide: true, reps: '6× je Seite' }),
  t('thread-needle', 30, { perSide: true, reps: '6× je Seite' }),
  t('scapula-pullup', 60, { reps: '2 × 8' }),
  t('dead-hang', 20),
  t('latzug', 90, { reps: '2 × 10 leicht', note: 'Aufwärmsätze, etwa halbe Arbeitslast' }),
])
const WARM_FULL = timed('warmup', 'Warm-up', [
  t('seil', 120, { reps: 'locker' }),
  t('hip-cars', 30, { perSide: true, reps: '3 Kreise je Richtung' }),
  t('shoulder-cars', 30, { perSide: true, reps: '3 Kreise' }),
  t('open-book', 30, { perSide: true, reps: '6× je Seite' }),
  t('deep-squat-hold', 30, { note: 'ohne Gewicht, leicht wiegen' }),
  t('pushup', 30, { reps: '10× leicht' }),
  t('kniebeuge-bw', 30, { reps: '10×' }),
])
const WARM_CARDIO = timed('warmup', 'Warm-up', [
  txt('Gehen und leichtes Laufen im Wechsel', 240),
  t('ankle-circles', 20, { perSide: true }),
  t('leg-swings', 30, { perSide: true, reps: '10× vor/zurück, 10× seitlich' }),
  t('calf-dyn', 60),
  t('knee-wall-mob', 30, { perSide: true, reps: '10×' }),
])
// Cool-downs: keine Schulterdehnung über Kreuz mehr (belastet das Schultereckgelenk, rechte Schulter des Users)
const COOL_PUSH = timed('cooldown', 'Cool-down', [
  t('chest-doorway', 40, { perSide: true }),
  t('triceps-stretch', 30, { perSide: true }),
  t('dead-hang', 30, { note: 'Zehen am Boden zum Dosieren' }),
  t('sleeper-stretch', 30, { perSide: true, note: 'sanft' }),
  t('puppy-pose', 40),
])
const COOL_LEGS = timed('cooldown', 'Cool-down', [
  t('couch-stretch', 45, { perSide: true }),
  t('hamstring-stretch', 40, { perSide: true }),
  t('adductor-rock', 30, { perSide: true }),
  t('calf-wall', 40, { perSide: true, note: 'je 20 s gestreckt und gebeugt' }),
])
const COOL_PULL = timed('cooldown', 'Cool-down', [
  t('dead-hang', 25),
  txt('Pause', 15),
  t('dead-hang', 25),
  t('puppy-pose', 40),
  t('biceps-wall', 30, { perSide: true }),
  t('forearm-stretch', 30),
  t('open-book', 30, { perSide: true, reps: '5× je Seite, langsam' }),
])
const COOL_FULL = timed('cooldown', 'Cool-down', [
  t('couch-stretch', 40, { perSide: true }),
  t('chest-doorway', 40, { perSide: true }),
  t('dead-hang', 30, { note: 'Zehen am Boden zum Dosieren' }),
  t('hamstring-stretch', 30, { perSide: true }),
])
const COOL_CARDIO = timed('cooldown', 'Cool-down', [
  txt('Gehen, bis der Puls unter 100 ist', 90),
  t('calf-wall', 30, { perSide: true, note: 'je 15 s gestreckt und gebeugt' }),
  t('quad-stretch', 30, { perSide: true }),
  t('couch-stretch', 40, { perSide: true }),
])

// ---------- Woche 1: Einstufung ----------
const w1: Week = {
  number: 1,
  title: 'Einstufung und Technik',
  note: 'Volumen reduziert. Bei Bio-Force-Übungen wird das 10RM gesucht: Satz 1 leicht, Satz 2 schwerer, Satz 3 die vermutete 10RM-Last. Last notieren.',
  sessions: [
    {
      key: 'w1-push', weekday: 1, title: 'Push + Core', kind: 'kraft', minutes: 60, focus: 'Einstufung Brust, Schultern, Trizeps',
      segments: [
        WARM_PUSH,
        { type: 'test', label: 'A', exerciseId: 'pushup', benchmarkKey: 'pushupsMax', unit: 'reps', description: 'Max-Test: so viele saubere Push-Ups am Stück wie möglich (Goliaz-Standard).', restSec: 180 },
        straight('B', [p('schraegdruecken', 3, { repsMin: 10, repsMax: 10, ramp: true, loadHint: '10RM finden: leicht → schwerer → 10RM' })], 150),
        straight('C', [reps('fliegende-oben', 3, 12, 12, { rir: '1–2', loadHint: 'leicht starten' })], 75),
        { type: 'test', label: 'D', exerciseId: 'dips', benchmarkKey: 'dipsMax', unit: 'reps', description: 'Max-Test Dips, strikt.', restSec: 120, followUp: reps('dips', 2, 8, 8, { loadHint: 'Arbeitssätze nach dem Test; wenn 8 nicht sauber gehen: ca. 60 % vom Max' }) },
        straight('E', [reps('trizeps-ueberkopf', 2, 12, 12, { rir: '1–2' })], 60),
        SEAT_OFF,
        straight('F', [reps('face-pull', 3, 15, 15, { rir: '1–2' })], 45),
        straight('G', [reps('seitheben', 3, 12, 12, { perSide: true, rir: '1–2' })], 45),
        { type: 'test', label: 'Core', exerciseId: 'plank', benchmarkKey: 'plankMax', unit: 'seconds', description: 'Elbow Plank so lange wie möglich mit sauberer Haltung.', restSec: 60 },
        straight('Core', [reps('pallof', 2, 10, 10, { perSide: true })], 45),
        COOL_PUSH,
      ],
    },
    {
      key: 'w1-beine', weekday: 2, title: 'Beine + Hüfte', kind: 'kraft', minutes: 55, focus: 'Einstufung Beine, kniefreundlich',
      segments: [
        WARM_LEGS,
        straight('A', [p('kabel-kniebeuge', 3, { repsMin: 10, repsMax: 10, ramp: true, tempo: '3-1-1', loadHint: '10RM finden' })], 150),
        straight('B', [p('rdl', 3, { repsMin: 10, repsMax: 10, ramp: true, loadHint: '10RM finden' })], 150),
        superset('C', [reps('split-squat', 3, 8, 8, { perSide: true, loadHint: 'Leicht starten, notfalls ohne Last' }), reps('hueftabduktion', 2, 15, 15, { perSide: true })], 30, 75),
        superset('D', [reps('wadenheben', 2, 15, 15), reps('superman', 2, 12, 12)], 20, 45),
        SEAT_ON,
        superset('E', [reps('beinbeuger', 3, 10, 10, { perSide: true, tempo: '3-1-3', rir: '2' }), reps('beinstrecker', 3, 12, 12, { tempo: '3-1-3', loadHint: 'leicht' })], 30, 75),
        straight('Core', [reps('dead-bug', 2, 10, 10, { perSide: true })], 45),
        COOL_LEGS,
      ],
    },
    {
      key: 'w1-pull', weekday: 3, title: 'Pull + hintere Schulter', kind: 'kraft', minutes: 60, focus: 'Einstufung Rücken, Bizeps',
      segments: [
        WARM_PULL,
        { type: 'test', label: 'A', exerciseId: 'pullup', benchmarkKey: 'pullupsMax', unit: 'reps', description: 'Max-Test: strikte Pull-Ups am Stück.', restSec: 180, followUp: reps('pullup', 2, 6, 8, { loadHint: 'ca. 60 % vom Max' }) },
        straight('B', [p('rudern-stehend', 3, { repsMin: 10, repsMax: 10, ramp: true, loadHint: '10RM finden' })], 150),
        straight('C', [reps('latzug', 3, 10, 12, { rir: '1–2' })], 75),
        superset('D', [reps('rudern-einarmig', 3, 10, 10, { perSide: true }), reps('australian-pullup', 3, 10, 12)]),
        SEAT_OFF,
        straight('E', [reps('reverse-fly', 3, 15, 15, { rir: '1–2' })], 45),
        superset('F', [reps('bizeps-curl', 2, 12, 12), reps('hammer-curl', 2, 12, 12)], 20, 45),
        superset('Core', [reps('hanging-knee-raise', 3, 10, 10), p('side-plank', 2, { seconds: 30, perSide: true })], 20, 45),
        COOL_PULL,
      ],
    },
    {
      key: 'w1-cardio', weekday: 4, title: 'Cardio: Burpee-Test + Zone 2', kind: 'cardio', minutes: 45, focus: 'Einstufung Ausdauer',
      segments: [
        WARM_CARDIO,
        { type: 'amrap', label: 'A', minutes: 5, exercises: [{ exerciseId: 'burpee', reps: 1 }], countLabel: 'Wiederholungen', benchmarkKey: 'burpees5min', description: '5-min-Burpee-Test: gleichmäßig anfangen, letzte Minute alles geben. Nur vollständige Wiederholungen zählen.' },
        { type: 'note', title: 'Pause', text: '4 min gehen.' },
        { type: 'cardio', label: 'B', minutes: 20, exerciseId: 'walk-run', description: 'Zone 2 als Walk-Run: 3 min laufen / 1 min gehen, 5 Runden.', hrZone: '116–128', alternative: 'Indoor: Seilspringen 40 s locker / 20 s gehen, 20 Runden. Bei Knieschmerz Marschieren mit Armzug.' },
        COOL_CARDIO,
      ],
    },
    {
      key: 'w1-full', weekday: 5, title: 'Ganzkörper Hypertrophie', kind: 'kraft', minutes: 60, focus: 'Schwachstellen: obere Brust, Schultern',
      segments: [
        WARM_FULL,
        superset('A', [reps('pushup-defizit', 3, 10, 15, { rir: '1–2' }), reps('latzug-eng', 3, 10, 12)]),
        superset('B', [reps('schraegdruecken', 3, 10, 10, { loadHint: '10RM vom Montag minus 5 lb (zwei Rasten)' }), reps('rudern-einarmig', 3, 10, 10, { perSide: true })]),
        superset('C', [reps('schulterdruecken', 3, 10, 10, { rir: '1–2' }), reps('step-up', 3, 10, 10, { perSide: true, loadHint: 'Kettlebell 8 kg' })]),
        SEAT_OFF,
        superset('D', [reps('pull-through', 3, 12, 12, { rir: '1–2' }), reps('seitheben', 2, 15, 15, { perSide: true })], 30, 60),
        { type: 'amrap', label: 'Finisher', minutes: 6, exercises: [{ exerciseId: 'burpee', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }], countLabel: 'Runden', benchmarkKey: 'amrap6', description: 'So viele Runden wie möglich in 6 Minuten.' },
        COOL_FULL,
      ],
    },
  ],
}

// ---------- Woche 2 und 3 ----------
function buildWeek(n: 2 | 3): Week {
  const extra = n === 3 ? 1 : 0
  const fin = n === 3 ? 8 : 6
  return {
    number: n,
    title: n === 2 ? 'Volles Volumen' : 'Höchstes Volumen im Block',
    note: n === 2
      ? 'Startlasten = 10RM aus Woche 1 minus 5 lb pro Seite (zwei Rasten). Doppelte Progression: obere Wiederholungszahl in allen Sätzen bei ≤ 1 RIR erreicht → nächstes Mal +5 lb, bei kleinen Übungen (Seitheben, Face Pulls, Reverse Flys) nur eine Raste = +2,5 lb.'
      : 'A- und B-Übungen mit einem Satz mehr. Finisher 8 Minuten. Zone 2 erstmals durchgehend laufen, wenn die Knie ruhig waren.',
    sessions: [
      {
        key: `w${n}-push`, weekday: 1, title: 'Push + Core', kind: 'kraft', minutes: 60, focus: 'Obere Brust, Schultern, Trizeps',
        segments: [
          WARM_PUSH,
          straight('A', [reps('schraegdruecken', 4 + extra, 8, 10, { rir: '1–2' })], 120),
          straight('B', [reps('pushup', 3 + extra, 12, 15, { rir: '1–2', loadHint: 'Gehen 15 mit 3+ RIR: schwerere Variante statt mehr Wiederholungen. Stufen: Defizit auf Parallettes mit 1 s Pause unten → Füße auf der Box → beides oder Tempo 3-1-1' })], 90),
          straight('C', [reps('fliegende-oben', 3, 12, 12, { rir: '1–2' })], 75),
          straight('D', [reps('dips', 3, 8, 10, { rir: '1–2', loadHint: 'Gehen 10 mit 3+ RIR: langsame Negative (3 s) oder Tempo 3-1-1, nicht mehr Wiederholungen' })], 90),
          straight('E', [reps('trizeps-ueberkopf', 2, 12, 12, { rir: '1–2' })], 60),
          SEAT_OFF,
          straight('F', [reps('face-pull', 3, 15, 15, { rir: '1–2' })], 45),
          straight('G', [reps('seitheben', 3, 12, 12, { perSide: true, rir: '1–2' })], 45),
          superset('Core', [reps('pallof', 2, 10, 10, { perSide: true }), p('plank', 2, { seconds: 45 })], 20, 45),
          { type: 'amrap', label: 'Finisher', minutes: fin, exercises: [{ exerciseId: 'burpee', reps: 6 }, { exerciseId: 'dips', reps: 8 }, { exerciseId: 'mountain-climber', reps: 20 }], countLabel: 'Runden', description: 'Dips ersatzweise 12 Push-Ups.' },
          COOL_PUSH,
        ],
      },
      {
        key: `w${n}-beine`, weekday: 2, title: 'Beine + Hüfte', kind: 'kraft', minutes: 55, focus: 'Kniefreundlicher Aufbau',
        segments: [
          WARM_LEGS,
          straight('A', [reps('kabel-kniebeuge', 4 + extra, 8, 10, { rir: '1–2', tempo: '3-1-1' })], 120),
          straight('B', [reps('rdl', 4 + extra, 8, 10, { rir: '1–2' })], 120),
          superset('C', [reps('split-squat', 3, 10, 10, { perSide: true }), reps('hueftabduktion', 2, 15, 15, { perSide: true })], 30, 75),
          superset('D', [reps('wadenheben', 2, 15, 15), reps('superman', 2, 12, 12)], 20, 45),
          SEAT_ON,
          superset('E', [reps('beinbeuger', 3, 10, 10, { perSide: true, tempo: '3-1-3', rir: '1–2' }), reps('beinstrecker', 3, 12, 12, { tempo: '3-1-3', loadHint: 'leicht' })], 30, 75),
          straight('Core', [reps('dead-bug', 2, 10, 10, { perSide: true })], 45),
          COOL_LEGS,
        ],
      },
      {
        key: `w${n}-pull`, weekday: 3, title: 'Pull + hintere Schulter', kind: 'kraft', minutes: 60, focus: 'Rücken, hintere Schulter, Bizeps',
        segments: [
          WARM_PULL,
          straight('A', [reps('pullup', 4, 6, 9, { rir: '1–2', loadHint: 'ca. 60–70 % vom Max' })], 120),
          straight('B', [reps('rudern-stehend', 4 + extra, 8, 10, { rir: '1–2' })], 120),
          straight('C', [reps('latzug', 3, 10, 12, { rir: '1–2' })], 75),
          superset('D', [reps('rudern-einarmig', 3, 10, 10, { perSide: true }), reps('australian-pullup', 3, 10, 12)]),
          SEAT_OFF,
          straight('E', [reps('reverse-fly', 3, 15, 15, { rir: '1–2' })], 45),
          superset('F', [reps('bizeps-curl', 2, 12, 12), reps('hammer-curl', 2, 12, 12)], 20, 45),
          superset('Core', [reps('hanging-knee-raise', 3, 10, 10), p('side-plank', 2, { seconds: 30, perSide: true })], 20, 45),
          { type: 'amrap', label: 'Finisher', minutes: fin, exercises: [{ exerciseId: 'pullup', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }], countLabel: 'Runden', description: 'Pull-Ups ersatzweise Australian Pull-Ups.' },
          COOL_PULL,
        ],
      },
      n === 2
        ? {
            key: 'w2-cardio', weekday: 4, title: 'Cardio: Cooper-Test + Zone 2', kind: 'cardio', minutes: 45, focus: 'Ausdauer-Einstufung',
            segments: [
              WARM_CARDIO,
              { type: 'cardio', label: 'A', minutes: 12, exerciseId: 'cooper', description: '12-min-Cooper-Test: so weit wie möglich laufen. Distanz und Durchschnittsherzfrequenz notieren.', benchmarkKey: 'cooper12', alternative: 'Indoor: 12 min Burpees und Seil im Wechsel (1 min / 1 min), Gesamtzahl Burpees als Wert eintragen.' },
              { type: 'note', title: 'Pause', text: '8 min gehen.' },
              { type: 'cardio', label: 'B', minutes: 12, exerciseId: 'walk-run', description: 'Walk-Run Zone 2: 3 min laufen / 1 min gehen.', hrZone: '116–128', alternative: 'Indoor: Seil 40 s / 20 s.' },
              COOL_CARDIO,
            ],
          }
        : {
            key: 'w3-cardio', weekday: 4, title: 'Cardio: Intervalle + Zone 2', kind: 'cardio', minutes: 50, focus: 'Burpee-Intervalle, erstmals durchgehend laufen',
            segments: [
              WARM_CARDIO,
              { type: 'interval', label: 'A', rounds: 8, workSec: 30, restSec: 60, exerciseId: 'burpee', description: '8 × 30 s Burpees zügig / 60 s gehen.', alternative: 'Bei Knieschmerz: Seil oder Mountain Climbers.' },
              { type: 'cardio', label: 'B', minutes: 20, exerciseId: 'laufen-z2', description: 'Zone 2, durchgehend laufen. Wenn die Knie unruhig sind: Walk-Run beibehalten.', hrZone: '116–128', alternative: 'Indoor: 20 min Seil 45 s / 15 s.', altWorkSec: 45, altRestSec: 15 },
              COOL_CARDIO,
            ],
          },
      {
        key: `w${n}-full`, weekday: 5, title: 'Ganzkörper Hypertrophie', kind: 'kraft', minutes: 60, focus: 'Schwachstellen, Beine leicht, Finisher',
        segments: [
          WARM_FULL,
          superset('A', [reps('pushup-defizit', 3, 10, 15, { rir: '1–2' }), reps('latzug-eng', 3, 10, 12, { rir: '1–2' })]),
          superset('B', [reps('schraegdruecken', 3, 10, 10, { rir: '1–2' }), reps('rudern-einarmig', 3, 10, 10, { perSide: true })]),
          superset('C', [reps('schulterdruecken', 3, 10, 10, { rir: '1–2' }), reps('step-up', 3, 10, 10, { perSide: true, loadHint: 'Kettlebell 8 kg' })]),
          SEAT_OFF,
          superset('D', [reps('hueftstrecken', 3, 12, 12, { rir: '1–2', perSide: true }), reps('seitheben', 3, 15, 15, { perSide: true })], 30, 60),
          // Core-Block am Freitag (Wunsch des Users nach Woche 1: Bauch kam zu kurz), ca. 4 min
          superset('Core', [reps('hanging-knee-raise', 2, 10, 12), p('plank', 2, { seconds: 45 })], 20, 45),
          { type: 'amrap', label: 'Finisher', minutes: 8, exercises: [{ exerciseId: 'burpee', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }], countLabel: 'Runden', benchmarkKey: n === 3 ? 'amrap8' : undefined, description: 'So viele Runden wie möglich in 8 Minuten.' },
          COOL_FULL,
        ],
      },
    ],
  }
}

// ---------- Woche 4: Kraftausdauer-Challenge ----------
const CH_DESC = 'Tagesanteil der Wochenziele, frei aufgeteilt in so wenige Sätze wie möglich. Zeit läuft mit.'
const shareDay = (share: number): Segment => ({
  type: 'challenge', label: 'Challenge', description: CH_DESC,
  items: CHALLENGE_TARGETS.map((t) => ({ exerciseId: t.exerciseId, share })),
})
const w4: Week = {
  number: 4,
  title: 'Kraftausdauer-Challenge',
  note: 'Wochenziele: 8 × Push-Up-Max, 12 × Pull-Up-Max, 10 × Kniebeugen pro Minute, 4 × 5-min-Burpees. Kurzer Krafterhalt (2 schwere Übungen) plus Challenge-Block auf Zeit. Do zählen die Tests, Fr wird der Rest erledigt.',
  sessions: [
    {
      key: 'w4-mo', weekday: 1, title: 'Challenge Tag 1 + Push-Erhalt', kind: 'challenge', minutes: 55, focus: 'Krafterhalt Push, Challenge-Anteil 1/5',
      segments: [
        WARM_PUSH,
        straight('Erhalt', [reps('schraegdruecken', 2, 8, 8, { rir: '2' }), reps('dips', 2, 8, 8, { rir: '2' })], 120),
        shareDay(0.21),
        COOL_PUSH,
      ],
    },
    {
      key: 'w4-di', weekday: 2, title: 'Challenge Tag 2 + Beine-Erhalt', kind: 'challenge', minutes: 55, focus: 'Krafterhalt Beine, Challenge-Anteil',
      segments: [
        WARM_LEGS,
        straight('Erhalt', [reps('kabel-kniebeuge', 2, 8, 8, { rir: '2', tempo: '3-1-1' }), reps('rdl', 2, 8, 8, { rir: '2' })], 120),
        SEAT_ON,
        straight('Erhalt 2', [reps('beinstrecker', 2, 10, 10, { tempo: '3-1-3' })], 90),
        shareDay(0.21),
        COOL_LEGS,
      ],
    },
    {
      key: 'w4-mi', weekday: 3, title: 'Challenge Tag 3 + Pull-Erhalt', kind: 'challenge', minutes: 55, focus: 'Krafterhalt Pull, Challenge-Anteil',
      segments: [
        WARM_PULL,
        straight('Erhalt', [reps('rudern-stehend', 2, 8, 8, { rir: '2' }), reps('latzug', 2, 10, 10, { rir: '2' })], 120),
        shareDay(0.21),
        COOL_PULL,
      ],
    },
    {
      key: 'w4-do', weekday: 4, title: 'Test-Tag', kind: 'challenge', minutes: 45, focus: '5-min-Tests, zählen zum Wochenziel',
      segments: [
        WARM_CARDIO,
        { type: 'amrap', label: 'Test 1', minutes: 5, exercises: [{ exerciseId: 'pushup', reps: 1 }], countLabel: 'Wiederholungen', benchmarkKey: 'pushups5min', description: '5 min Push-Ups, so viele wie möglich. Pausen erlaubt.' },
        { type: 'note', title: 'Pause', text: '10 min gehen oder locker bewegen.' },
        { type: 'amrap', label: 'Test 2', minutes: 5, exercises: [{ exerciseId: 'burpee', reps: 1 }], countLabel: 'Wiederholungen', benchmarkKey: 'burpees5min', description: '5 min Burpees, so viele wie möglich. Vergleich mit Woche 1.' },
        { type: 'cardio', label: 'Zone 2', minutes: 15, exerciseId: 'laufen-z2', description: 'Locker auslaufen.', hrZone: '116–128', alternative: 'Indoor: 15 min Seil locker.' },
        COOL_CARDIO,
      ],
    },
    {
      key: 'w4-fr', weekday: 5, title: 'Challenge-Finale', kind: 'challenge', minutes: 60, focus: 'Restbestand auf Zeit + AMRAP 12',
      segments: [
        WARM_FULL,
        { type: 'challenge', label: 'Finale', description: 'Alles, was vom Wochenziel noch offen ist, auf Zeit.', items: CHALLENGE_TARGETS.map((t) => ({ exerciseId: t.exerciseId, share: -1 })) },
        { type: 'amrap', label: 'AMRAP', minutes: 12, exercises: [{ exerciseId: 'pullup', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }, { exerciseId: 'burpee', reps: 5 }], countLabel: 'Runden', benchmarkKey: 'amrap12', description: 'Abschluss: 12 Minuten, so viele Runden wie möglich.' },
        COOL_FULL,
      ],
    },
  ],
}

// ---------- Block 2: Hypertrophie (Wochen 5–8) ----------
// Beschluss 11.10.2026 nach Auswertung der Wochen 1–3: Kraft-Einheiten dauerten 82–86 min, Ziel jetzt ca. 70 min
// inkl. Warm-up und Cool-down. Hauptübungen 6–8 Wdh., Nebenübungen 8–10, Isolation 10–15. Woche 5 mit einem Satz
// weniger bei den Hauptübungen (Deload zum Blockstart). Mittwoch ohne einarmiges Rudern und Australian Pull-Ups
// (Beschluss 18.09.), Freitag Kickback und Seitheben als getrennte Blöcke (kein Umbau im Supersatz).
const B2_HINT = 'Neuer Bereich 6–8: Die App rechnet die Last aus deinen 10er-Sätzen um (meist 2,5–5 lb mehr).'
function buildBlock2Week(n: 5 | 6 | 7): Week {
  const main = n === 5 ? 3 : 4 // Sätze der Hauptübungen
  const hint = n === 5 ? B2_HINT : undefined
  const intervals = n === 5 ? 8 : n === 6 ? 9 : 10
  const z2 = n === 5 ? 20 : 25
  return {
    number: n,
    title: n === 5 ? 'Block 2 Start (leichter)' : n === 6 ? 'Volles Volumen' : 'Höchstes Volumen im Block',
    note: n === 5
      ? 'Hauptübungen 6–8 Wdh. mit 3 Sätzen (Deload zum Blockstart). Progression: obere Wiederholungszahl in allen Sätzen bei RIR 2 → +2,5 lb, bei RIR ≤ 1 → +5 lb. Einheiten ca. 70 min.'
      : n === 6
        ? 'Hauptübungen mit 4 Sätzen. Isolationsübungen bis 0–1 RIR.'
        : 'Wie Woche 6, Intervalle 10 Runden. Nächste Woche Kraft-Challenge mit Max-Tests und Bleep-Test.',
    sessions: [
      {
        key: `w${n}-push`, weekday: 1, title: 'Push + Core', kind: 'kraft', minutes: 70, focus: 'Obere Brust, Schultern, Trizeps',
        segments: [
          WARM_PUSH,
          straight('A', [reps('schraegdruecken', main, 6, 8, { rir: '1–2', loadHint: hint })], 150),
          superset('B', [reps('dips', 3, 6, 10, { rir: '1–2', loadHint: 'Gehen 10 mit 3+ RIR: schwerere Variante (Negative 3 s, Tempo, Pause unten)' }), reps('fliegende-oben', 3, 10, 12, { rir: '1' })], 30, 90),
          superset('C', [reps('trizeps-ueberkopf', 2, 10, 12, { rir: '1' }), p('plank', 2, { seconds: 45 })], 20, 45),
          SEAT_OFF,
          straight('D', [reps('seitheben', 3, 12, 15, { perSide: true, rir: '0–1' })], 45),
          { type: 'amrap', label: 'Finisher', minutes: 6, exercises: [{ exerciseId: 'burpee', reps: 6 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'mountain-climber', reps: 20 }], countLabel: 'Runden', description: 'So viele Runden wie möglich in 6 Minuten.' },
          COOL_PUSH,
        ],
      },
      {
        key: `w${n}-beine`, weekday: 2, title: 'Beine + Hüfte', kind: 'kraft', minutes: 70, focus: 'Kniefreundlich, schwerer',
        segments: [
          WARM_LEGS,
          straight('A', [reps('kabel-kniebeuge', main, 6, 8, { rir: '1–2', tempo: '3-1-1', loadHint: hint })], 120),
          straight('B', [reps('rdl', main, 6, 8, { rir: '1–2', loadHint: hint })], 120),
          superset('C', [reps('split-squat', 3, 8, 10, { perSide: true, rir: '1–2' }), reps('hueftabduktion', 2, 15, 15, { perSide: true })], 30, 75),
          superset('D', [reps('wadenheben', 3, 10, 12, { rir: '1' }), reps('dead-bug', 3, 10, 10, { perSide: true })], 20, 45),
          SEAT_ON,
          superset('E', [reps('beinbeuger', 2, 8, 10, { perSide: true, tempo: '3-1-3', rir: '1–2' }), reps('beinstrecker', 2, 10, 12, { tempo: '3-1-3', rir: '2', loadHint: 'Nicht bis zum Versagen: Tempo 3-1-3, RIR 2 (Knieschonung)' })], 30, 75),
          COOL_LEGS,
        ],
      },
      {
        key: `w${n}-pull`, weekday: 3, title: 'Pull + hintere Schulter', kind: 'kraft', minutes: 65, focus: 'Rücken, hintere Schulter, Bizeps',
        segments: [
          WARM_PULL,
          straight('A', [reps('pullup', 4, 5, 7, { rir: '1–2', loadHint: 'Gehen 4 × 7 mit 2+ RIR: Variante (Negative, Pause oben) oder 8' })], 120),
          straight('B', [reps('rudern-stehend', main, 6, 8, { rir: '1–2', loadHint: hint })], 120),
          superset('C', [reps('latzug', 3, 8, 10, { rir: '1–2' }), reps('hanging-knee-raise', 3, 10, 12)], 30, 75),
          SEAT_OFF,
          superset('D', [reps('reverse-fly', 3, 12, 15, { rir: '0–1' }), reps('face-pull', 3, 12, 15, { rir: '1' })], 20, 60, 'Beide am Karabiner auf Schulterhöhe, nur die Seile wechseln'),
          superset('E', [reps('bizeps-curl', 2, 10, 12, { rir: '1' }), reps('hammer-curl', 2, 10, 12, { rir: '1' })], 20, 45),
          COOL_PULL,
        ],
      },
      {
        key: `w${n}-cardio`, weekday: 4, title: 'Cardio: Intervalle + Zone 2', kind: 'cardio', minutes: 50, focus: `Burpee-Intervalle ${intervals} Runden, Zone 2 ${z2} min`,
        segments: [
          WARM_CARDIO,
          { type: 'interval', label: 'A', rounds: intervals, workSec: 30, restSec: 60, exerciseId: 'burpee', description: `${intervals} × 30 s Burpees zügig / 60 s gehen. Puls am Ende der Runden 141–153.`, alternative: 'Bei Knieschmerz: Seil oder Mountain Climbers.' },
          { type: 'cardio', label: 'B', minutes: z2, exerciseId: 'laufen-z2', description: 'Zone 2, durchgehend laufen.', hrZone: '116–128', alternative: `Indoor: ${z2} min Seil 45 s / 15 s.`, altWorkSec: 45, altRestSec: 15 },
          COOL_CARDIO,
        ],
      },
      {
        key: `w${n}-full`, weekday: 5, title: 'Ganzkörper Hypertrophie', kind: 'kraft', minutes: 70, focus: 'Obere Brust, Schultern, Rücken, Finisher',
        segments: [
          WARM_FULL,
          superset('A', [reps('pushup-defizit', 3, 8, 12, { rir: '1–2' }), reps('latzug-eng', 3, 8, 10, { rir: '1–2' })], 30, 75),
          superset('B', [reps('schraegdruecken', 3, 8, 10, { rir: '1–2' }), reps('rudern-einarmig', 3, 8, 10, { perSide: true, rir: '1–2' })], 30, 75),
          superset('C', [reps('schulterdruecken', 3, 8, 10, { rir: '1–2' }), reps('hanging-knee-raise', 3, 10, 12)], 30, 75),
          SEAT_OFF,
          straight('D', [reps('hueftstrecken', 2, 12, 12, { perSide: true, rir: '1–2' })], 45),
          straight('E', [reps('seitheben', 2, 12, 15, { perSide: true, rir: '0–1' })], 45),
          { type: 'amrap', label: 'Finisher', minutes: 6, exercises: [{ exerciseId: 'burpee', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }], countLabel: 'Runden', benchmarkKey: n === 7 ? 'amrap6' : undefined, description: n === 7 ? 'Wie in Woche 1 (5 Runden): Vergleichstest.' : 'So viele Runden wie möglich in 6 Minuten.' },
          COOL_FULL,
        ],
      },
    ],
  }
}

// ---------- Woche 8: Kraft-Challenge ----------
const w8: Week = {
  number: 8,
  title: 'Kraft-Challenge',
  note: 'Max-Tests und Wiederholungsmaxima (5RM/8RM) als Grundlage für Block 3. Wenig Volumen, volle Pausen. Do Bleep-Test nur bei ruhigen Knien (Kurz-Check Knie ≤ 2), sonst 5-min-Burpees. Mobility-Check diese Woche.',
  sessions: [
    {
      key: 'w8-mo', weekday: 1, title: 'Test: Schrägdrücken 5RM + Dips', kind: 'challenge', minutes: 50, focus: 'Oberkörper drücken',
      segments: [
        WARM_PUSH,
        straight('A', [p('schraegdruecken', 4, { repsMin: 5, repsMax: 5, ramp: true, loadHint: '5RM finden: Satz 1 mit der 8er-Last, dann je 5 lb mehr, bis 5 gerade noch sauber gehen' })], 180),
        { type: 'test', label: 'B', exerciseId: 'dips', benchmarkKey: 'dipsMax', unit: 'reps', description: 'Max-Test Dips, strikt. Vergleich Woche 1: 18.', restSec: 120 },
        { type: 'test', label: 'Core', exerciseId: 'plank', benchmarkKey: 'plankMax', unit: 'seconds', description: 'Elbow Plank so lange wie möglich. Vergleich Woche 1: 2:31.', restSec: 60 },
        SEAT_OFF,
        straight('C', [reps('seitheben', 2, 12, 15, { perSide: true })], 45),
        COOL_PUSH,
      ],
    },
    {
      key: 'w8-di', weekday: 2, title: 'Test: RDL und Kniebeuge 8RM', kind: 'challenge', minutes: 50, focus: 'Beine',
      segments: [
        WARM_LEGS,
        straight('A', [p('kabel-kniebeuge', 4, { repsMin: 8, repsMax: 8, ramp: true, tempo: '3-1-1', loadHint: '8RM finden: Satz 1 mit der Arbeitslast, dann steigern. Knie ruhig halten, kein Versagen erzwingen.' })], 150),
        straight('B', [p('rdl', 4, { repsMin: 8, repsMax: 8, ramp: true, loadHint: '8RM finden: Satz 1 mit der Arbeitslast, dann je 5–10 lb mehr' })], 150),
        superset('C', [reps('wadenheben', 2, 10, 12), reps('dead-bug', 2, 10, 10, { perSide: true })], 20, 45),
        COOL_LEGS,
      ],
    },
    {
      key: 'w8-mi', weekday: 3, title: 'Test: Pull-Ups + Rudern 5RM', kind: 'challenge', minutes: 55, focus: 'Ziehen, Pull-Up-Leiter',
      segments: [
        WARM_PULL,
        { type: 'test', label: 'A', exerciseId: 'pullup', benchmarkKey: 'pullupsMax', unit: 'reps', description: 'Max-Test: strikte Pull-Ups am Stück. Vergleich Woche 1: 11.', restSec: 240 },
        straight('B', [p('rudern-stehend', 4, { repsMin: 5, repsMax: 5, ramp: true, loadHint: '5RM finden: Satz 1 mit der 8er-Last, dann je 5 lb mehr' })], 180),
        { type: 'test', label: 'Leiter', exerciseId: 'pullup', benchmarkKey: 'pullupLadder', unit: 'reps', description: 'Die Leiter: 1 Pull-Up, kurz absetzen, 2, 3, 4 … bis eine Stufe nicht mehr sauber geht. Pause zwischen den Stufen so lang wie die Stufe gedauert hat. Eintragen: Summe aller sauberen Wiederholungen (z. B. bis Stufe 6 = 21).', restSec: 120 },
        SEAT_OFF,
        superset('C', [reps('reverse-fly', 2, 12, 15), reps('face-pull', 2, 12, 15)], 20, 60),
        COOL_PULL,
      ],
    },
    {
      key: 'w8-do', weekday: 4, title: 'Test: Bleep (VO2max)', kind: 'challenge', minutes: 45, focus: 'Ausdauer-Benchmark',
      segments: [
        WARM_CARDIO,
        { type: 'test', label: 'A', exerciseId: 'bleep', benchmarkKey: 'bleepVo2', unit: 'reps', description: 'Bleep-Test in der Goliaz-App starten (2 Marker, genau 20 m). Eintragen: die letzte Zahl vor dem Verpassen. Vergleich 11.08.2026: 44. Nur bei ruhigen Knien; sonst überspringen und stattdessen 5-min-Burpees als Freies Training (Max-Test).', restSec: 0 },
        { type: 'cardio', label: 'B', minutes: 15, exerciseId: 'laufen-z2', description: 'Locker auslaufen oder gehen.', hrZone: '116–128', alternative: 'Indoor: 15 min Seil locker 45 s / 15 s.', altWorkSec: 45, altRestSec: 15 },
        COOL_CARDIO,
      ],
    },
    {
      key: 'w8-fr', weekday: 5, title: 'Test: Push-Ups + AMRAP 12', kind: 'challenge', minutes: 50, focus: 'Vergleich mit Woche 1 und 4',
      segments: [
        WARM_FULL,
        { type: 'test', label: 'A', exerciseId: 'pushup', benchmarkKey: 'pushupsMax', unit: 'reps', description: 'Max-Test Push-Ups (Goliaz-Standard). Vergleich Woche 1: 63.', restSec: 300 },
        { type: 'amrap', label: 'AMRAP', minutes: 12, exercises: [{ exerciseId: 'pullup', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }, { exerciseId: 'burpee', reps: 5 }], countLabel: 'Runden', benchmarkKey: 'amrap12', description: 'Wie am Freitag der Woche 4: 12 Minuten, so viele Runden wie möglich. Vergleich.' },
        COOL_FULL,
      ],
    },
  ],
}

const placeholder = (n: number, block: Block): Week => ({
  number: n,
  title: `Block ${block.number} „${block.name}“`,
  note: 'Die Einheiten dieses Blocks werden nach Auswertung von Block 1 festgelegt.',
  sessions: [],
})

export const WEEKS: Week[] = [
  w1,
  buildWeek(2),
  buildWeek(3),
  w4,
  buildBlock2Week(5),
  buildBlock2Week(6),
  buildBlock2Week(7),
  w8,
  ...[9, 10, 11, 12, 13, 14, 15, 16].map((n) => placeholder(n, BLOCKS.find((b) => b.weeks.includes(n))!)),
]

export const weekByNumber = (n: number) => WEEKS.find((w) => w.number === n)
export const blockOfWeek = (n: number) => BLOCKS.find((b) => b.weeks.includes(n))
/** Routinen außerhalb des Wochenplans (Mobility-Einheiten, Mobility-Check): Woche 0, die Planwoche kommt beim Start aus dem Datum. */
export const ROUTINE_WEEK: Week = { number: 0, title: 'Mobility', sessions: MOBILITY_SESSIONS }

export function findSession(key: string): { week: Week; session: Session } | undefined {
  for (const week of [...WEEKS, ROUTINE_WEEK]) {
    const session = week.sessions.find((s) => s.key === key)
    if (session) return { week, session }
  }
  return undefined
}
