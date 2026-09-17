import type { Block, ChallengeTarget, Prescription, Segment, Session, Week } from './planTypes'

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

const warm = (minutes: number, items: string[]): Segment => ({ type: 'warmup', minutes, items })
const cool = (items: string[]): Segment => ({ type: 'cooldown', minutes: 3, items })
const straight = (label: string, exercises: Prescription[], restSec: number, note?: string): Segment =>
  ({ type: 'block', label, kind: 'straight', exercises, restSec, note })
const superset = (label: string, exercises: Prescription[], restBetweenSec = 30, restSec = 90, note?: string): Segment =>
  ({ type: 'block', label, kind: 'superset', exercises, restSec, restBetweenSec, note })

// Umbau-Hinweise: Jede Einheit ist so sortiert, dass der Sitz höchstens einmal umgebaut wird.
// Innerhalb eines Supersatzes haben alle Bio-Force-Übungen denselben Sitz-Status (Exercise.seat).
const SEAT_OFF: Segment = { type: 'note', title: 'Umbau: Sitz abbauen', text: 'Alle folgenden Bio-Force-Übungen dieser Einheit laufen ohne Sitz.' }
const SEAT_ON: Segment = { type: 'note', title: 'Umbau: Sitz anbringen', text: 'Sitz und Beinmodul anbringen. Alle folgenden Bio-Force-Übungen dieser Einheit laufen mit Sitz.' }

const WARM_PUSH = warm(8, ['2 min Seil locker', 'Schulterkreisen vor und zurück', 'Katzenbuckel / Pferderücken 10×', '10 Scapula-Push-Ups', '2 leichte Sätze Kabel-Schrägdrücken × 10'])
const WARM_LEGS = warm(8, ['3 min Marschieren oder Seil leicht', 'Hüftkreisen, Beinschwünge vor/zurück und seitlich', '10 halbe Kniebeugen', 'Wall Sit 2 × 30 s (Sehnenvorbereitung)'])
const WARM_PULL = warm(8, ['2 min Seil', 'Schulterblattkreisen', 'Scapula Pull-Ups 2 × 8', 'Latzug leicht 2 × 10'])
const WARM_FULL = warm(8, ['2 min Seil', 'Ganzkörper-Mobility: Hüfte, Schulter, Brustwirbelsäule', '10 Push-Ups leicht', '10 Kniebeugen'])
const WARM_CARDIO = warm(8, ['Gehen und leichtes Laufen im Wechsel', 'Beinschwünge, Fußgelenke kreisen, Wadendehnung dynamisch'])
const COOL_PUSH = cool(['Brustdehnung im Türrahmen 2 × 30 s', 'Schulterdehnung über Kreuz', 'Trizepsdehnung über Kopf'])
const COOL_LEGS = cool(['Quadrizeps im Stand 2 × 30 s je Seite', 'Hintere Oberschenkel sitzend', 'Hüftbeuger im Kniestand'])
const COOL_PULL = cool(['Latdehnung an der Stange hängend 2 × 20 s', 'Bizepsdehnung an der Wand', 'Unterarme'])
const COOL_CARDIO = cool(['Gehen bis der Puls unter 100 ist', 'Waden, Quadrizeps, Hüftbeuger je 30 s'])

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
        { type: 'test', label: 'D', exerciseId: 'dips', benchmarkKey: 'dipsMax', unit: 'reps', description: 'Max-Test Dips, strikt.', restSec: 120, followUp: reps('dips', 2, 8, 8) },
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
        superset('C', [reps('split-squat', 3, 8, 8, { perSide: true, loadHint: 'Körpergewicht' }), reps('hueftabduktion', 2, 15, 15, { perSide: true })], 30, 75),
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
        superset('F', [reps('bizeps-curl', 2, 12, 12), reps('hammer-curl', 2, 12, 12, { loadHint: 'Kurzhanteln' })], 20, 45),
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
        { type: 'cardio', label: 'B', minutes: 20, exerciseId: 'walk-run', description: 'Zone 2 als Walk-Run: 3 min laufen / 1 min gehen, 5 Runden.', hrZone: '105–125', alternative: 'Indoor: Seilspringen 40 s locker / 20 s gehen, 20 Runden. Bei Knieschmerz Marschieren mit Armzug.' },
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
        COOL_PUSH,
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
          straight('B', [reps('pushup', 3 + extra, 12, 15, { rir: '1–2' })], 90),
          straight('C', [reps('fliegende-oben', 3, 12, 12, { rir: '1–2' })], 75),
          straight('D', [reps('dips', 3, 8, 10, { rir: '1–2' })], 90),
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
          superset('F', [reps('bizeps-curl', 2, 12, 12), reps('hammer-curl', 2, 12, 12, { loadHint: 'Kurzhanteln' })], 20, 45),
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
              { type: 'cardio', label: 'B', minutes: 12, exerciseId: 'walk-run', description: 'Walk-Run Zone 2: 3 min laufen / 1 min gehen.', hrZone: '105–125', alternative: 'Indoor: Seil 40 s / 20 s.' },
              COOL_CARDIO,
            ],
          }
        : {
            key: 'w3-cardio', weekday: 4, title: 'Cardio: Intervalle + Zone 2', kind: 'cardio', minutes: 50, focus: 'Burpee-Intervalle, erstmals durchgehend laufen',
            segments: [
              WARM_CARDIO,
              { type: 'interval', label: 'A', rounds: 8, workSec: 30, restSec: 60, exerciseId: 'burpee', description: '8 × 30 s Burpees zügig / 60 s gehen.', alternative: 'Bei Knieschmerz: Seil oder Mountain Climbers.' },
              { type: 'cardio', label: 'B', minutes: 20, exerciseId: 'laufen-z2', description: 'Zone 2, durchgehend laufen. Wenn die Knie unruhig sind: Walk-Run beibehalten.', hrZone: '105–125', alternative: 'Indoor: 20 min Seil 45 s / 15 s.' },
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
          superset('D', [reps('pull-through', 3, 12, 12, { rir: '1–2' }), reps('seitheben', 3, 15, 15, { perSide: true })], 30, 60),
          { type: 'amrap', label: 'Finisher', minutes: 8, exercises: [{ exerciseId: 'burpee', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }], countLabel: 'Runden', benchmarkKey: n === 3 ? 'amrap8' : undefined, description: 'So viele Runden wie möglich in 8 Minuten.' },
          COOL_PUSH,
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
        { type: 'cardio', label: 'Zone 2', minutes: 15, exerciseId: 'laufen-z2', description: 'Locker auslaufen.', hrZone: '105–125', alternative: 'Indoor: 15 min Seil locker.' },
        COOL_CARDIO,
      ],
    },
    {
      key: 'w4-fr', weekday: 5, title: 'Challenge-Finale', kind: 'challenge', minutes: 60, focus: 'Restbestand auf Zeit + AMRAP 12',
      segments: [
        WARM_FULL,
        { type: 'challenge', label: 'Finale', description: 'Alles, was vom Wochenziel noch offen ist, auf Zeit.', items: CHALLENGE_TARGETS.map((t) => ({ exerciseId: t.exerciseId, share: -1 })) },
        { type: 'amrap', label: 'AMRAP', minutes: 12, exercises: [{ exerciseId: 'pullup', reps: 5 }, { exerciseId: 'pushup', reps: 10 }, { exerciseId: 'kniebeuge-bw', reps: 15 }, { exerciseId: 'burpee', reps: 5 }], countLabel: 'Runden', benchmarkKey: 'amrap12', description: 'Abschluss: 12 Minuten, so viele Runden wie möglich.' },
        COOL_PUSH,
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
  ...[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((n) => placeholder(n, BLOCKS.find((b) => b.weeks.includes(n))!)),
]

export const weekByNumber = (n: number) => WEEKS.find((w) => w.number === n)
export const blockOfWeek = (n: number) => BLOCKS.find((b) => b.weeks.includes(n))
export function findSession(key: string): { week: Week; session: Session } | undefined {
  for (const week of WEEKS) {
    const session = week.sessions.find((s) => s.key === key)
    if (session) return { week, session }
  }
  return undefined
}
