export const MUSCLES = {
  brust_oben: 'Obere Brust',
  brust: 'Brust',
  schulter_vorn: 'Vordere Schulter',
  schulter_seit: 'Seitliche Schulter',
  schulter_hinten: 'Hintere Schulter',
  trizeps: 'Trizeps',
  bizeps: 'Bizeps',
  unterarme: 'Unterarme',
  lat: 'Latissimus',
  ruecken_oben: 'Oberer Rücken',
  ruecken_unten: 'Unterer Rücken',
  bauch: 'Bauch',
  bauch_schraeg: 'Schräge Bauchmuskeln',
  quadrizeps: 'Quadrizeps',
  hamstrings: 'Hintere Oberschenkel',
  gesaess: 'Gesäß',
  huefte: 'Hüfte',
  waden: 'Waden',
  cardio: 'Herz-Kreislauf',
} as const

export type MuscleKey = keyof typeof MUSCLES

// Gruppen für die Volumenauswertung
export const MUSCLE_GROUPS: Record<string, MuscleKey[]> = {
  Brust: ['brust_oben', 'brust'],
  Schultern: ['schulter_vorn', 'schulter_seit', 'schulter_hinten'],
  Trizeps: ['trizeps'],
  Bizeps: ['bizeps', 'unterarme'],
  Rücken: ['lat', 'ruecken_oben'],
  'Unterer Rücken': ['ruecken_unten'],
  Core: ['bauch', 'bauch_schraeg'],
  Quadrizeps: ['quadrizeps'],
  'Hintere Kette': ['hamstrings', 'gesaess'],
  Hüfte: ['huefte'],
  Waden: ['waden'],
}
