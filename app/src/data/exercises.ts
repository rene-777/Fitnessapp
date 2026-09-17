import type { MuscleKey } from './muscles'

export type Category = 'push' | 'pull' | 'beine' | 'core' | 'cardio' | 'warmup'
export type LoadType = 'bioforce' | 'bodyweight' | 'extern' | 'none'
export type Unit = 'reps' | 'seconds' | 'meters'

export interface Exercise {
  id: string
  name: string
  category: Category
  primary: MuscleKey[]
  secondary: MuscleKey[]
  loadType: LoadType
  unit: Unit
  bioforceNo?: number // Nummer in der Finnlo-Anleitung, liefert die Fotos
  equipment: string
  setup?: string
  steps: string[]
  tips?: string[]
  knee?: string
}

const bf = (no: number) => no

export const EXERCISES: Exercise[] = [
  // ---------- PUSH ----------
  {
    id: 'schraegdruecken', name: 'Kabel-Schrägdrücken', category: 'push',
    primary: ['brust_oben', 'schulter_vorn'], secondary: ['trizeps'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(34),
    equipment: 'Bio Force, Sitz + Beinmodul angebracht, Handgriffe, Karabiner auf Schulterhöhe, Seile über den Armen',
    setup: 'Aufrecht sitzen, Rücken am Polster. Griffe auf Schulterhöhe, Ellbogen 90°, Handflächen nach unten-vorn. Die Seile laufen über den Oberarmen.',
    steps: [
      'Arme nach vorne und oben strecken, bis die Griffe auf Kopfhöhe sind.',
      'Oben 1 s anspannen.',
      'Langsam (2 s) zurück, bis die Ellbogen wieder auf Schulterhöhe und leicht hinter dem Körper sind (Dehnung der Brust).',
    ],
    tips: ['Nicht waagerecht nach vorn drücken, sonst arbeitet die mittlere statt der oberen Brust.', 'Handgelenke gerade, kein Hohlkreuz.'],
  },
  {
    id: 'fliegende-oben', name: 'Fliegende nach oben', category: 'push',
    primary: ['brust_oben'], secondary: ['schulter_vorn'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(38),
    equipment: 'Bio Force, Sitz angebracht, Handgriffe, Karabiner auf Schulterhöhe, Seile über den Armen',
    setup: 'Sitzen, Griffe seitlich außen halten, Arme fast gestreckt (leichte Beugung bleibt), Handflächen nach vorn. Start ist die Dehnung: Arme weit außen und etwas tiefer als die Schulter.',
    steps: [
      'In der Dehnung 1 s halten.',
      'Arme in einem Bogen nach vorne und oben zusammenführen, bis sich die Griffe vor der Stirn fast berühren.',
      'Kurz anspannen, langsam zurück in die Dehnung.',
    ],
    tips: ['Ellbogenwinkel bleibt gleich, sonst wird es ein Drücken.', 'Die Dehnposition ist der wichtigste Teil. Lieber leichter.'],
  },
  {
    id: 'bankdruecken', name: 'Kabel-Bankdrücken', category: 'push',
    primary: ['brust', 'schulter_vorn'], secondary: ['trizeps'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(32),
    equipment: 'Bio Force, Sitz angebracht, Handgriffe, Karabiner auf Schulterhöhe, Seile unter den Armen',
    setup: 'Griffe auf Brusthöhe, Ellbogen 90°, Handflächen nach unten.',
    steps: ['Gerade nach vorn drücken, Ellbogen auf Schulterhöhe halten.', 'Kurz anspannen, langsam zurück.'],
    tips: ['Enger Griff (Daumen nach innen) betont den Trizeps.'],
  },
  {
    id: 'pushup', name: 'Push-Ups (Goliaz-Standard)', category: 'push',
    primary: ['brust', 'trizeps', 'schulter_vorn'], secondary: ['bauch'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: [
      'Hände etwas breiter als schulterbreit, Körper von Kopf bis Ferse eine Linie.',
      'Absenken, bis die Brust den Boden berührt. Hände kurz vom Boden lösen.',
      'Hände aufsetzen und vollständig hochdrücken.',
    ],
    tips: ['Hüfte nicht durchhängen lassen.', 'Ellbogen etwa 45° zum Körper, nicht weit nach außen.'],
  },
  {
    id: 'pushup-defizit', name: 'Defizit-Push-Ups', category: 'push',
    primary: ['brust', 'trizeps'], secondary: ['schulter_vorn', 'bauch'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Kettlebell-Griffe oder zwei stabile Erhöhungen',
    setup: 'Hände auf den Griffen der Kettlebells, sodass die Brust tiefer als die Hände kommt.',
    steps: ['Wie Push-Ups, unten 1 s in der Dehnung halten.', 'Hochdrücken bis zur vollen Streckung.'],
    tips: ['Schultern unten nicht hochziehen.', 'Kein Abheben der Hände.'],
  },
  {
    id: 'dips', name: 'Dips', category: 'push',
    primary: ['brust', 'trizeps'], secondary: ['schulter_vorn'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Dip-Barren',
    steps: [
      'Stütz auf dem Barren, Oberkörper leicht nach vorn (mehr Brust) oder aufrecht (mehr Trizeps).',
      'Absenken bis der Oberarm waagerecht ist, Ellbogen etwa 90°.',
      'Hochdrücken bis zur vollen Streckung.',
    ],
    tips: ['Nicht tiefer, wenn die Schulter zieht.', 'Schultern nicht hochziehen.'],
  },
  {
    id: 'schulterdruecken', name: 'Schulterdrücken am Kabel', category: 'push',
    primary: ['schulter_vorn', 'schulter_seit'], secondary: ['trizeps', 'ruecken_oben'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(60),
    equipment: 'Bio Force, Sitz angebracht, Handgriffe, Seile von den unteren Haken',
    setup: 'Griffe auf Schulterhöhe, Daumen nach innen, Ellbogen 90°.',
    steps: ['Arme in leichtem Bogen über den Kopf strecken, bis sich die Griffe fast berühren.', 'Langsam zurück, Ellbogen nicht unter Schulterhöhe.'],
    tips: ['Kein Hohlkreuz, Kopf nicht nach vorn schieben.'],
  },
  {
    id: 'seitheben', name: 'Seitheben am Kabel', category: 'push',
    primary: ['schulter_seit'], secondary: ['ruecken_oben'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(67),
    equipment: 'Bio Force, Sitz entfernt, ein Handgriff, untere Haken',
    setup: 'Rücken zum Gerät, Griff seitlich am Körper, Daumen nach vorn. Für mehr Dehnung den Arm leicht hinter der Hüfte starten.',
    steps: ['Arm seitlich anheben bis auf Schulterhöhe, Ellbogen leicht gebeugt und fixiert.', 'Langsam (2–3 s) ablassen.'],
    tips: ['Kein Schwung aus den Beinen.', 'Leicht anfangen: 2,5–5 kg pro Seite.'],
  },
  {
    id: 'trizeps-ueberkopf', name: 'Trizeps über Kopf', category: 'push',
    primary: ['trizeps'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(92),
    equipment: 'Bio Force, Sitz angebracht, Handgriffe, Seile von den unteren Haken hinter dir',
    setup: 'Griffe hinter dem Kopf halten, Ellbogen auf Kopfhöhe und nach vorn gerichtet.',
    steps: ['Unterarme nach oben strecken, bis die Arme fast gestreckt sind.', 'Langsam tief hinter den Kopf zurück (Dehnung).'],
    tips: ['Ellbogen nicht nach außen kippen.'],
  },
  {
    id: 'trizepsdruecken', name: 'Trizepsdrücken', category: 'push',
    primary: ['trizeps'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(94),
    equipment: 'Bio Force, Sitz entfernt, Latstange am oberen Haken, stehend zum Gerät',
    setup: 'Stange im Obergriff, Ellbogen 90° am Körper.',
    steps: ['Ellbogen strecken, kurz halten.', 'Kontrolliert zurück, Oberarme bleiben am Körper.'],
  },
  {
    id: 'plyo-pushup', name: 'Plyo-Push-Ups', category: 'push',
    primary: ['brust', 'trizeps'], secondary: ['schulter_vorn'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: ['Push-Up mit so viel Kraft, dass die Hände kurz vom Boden abheben.', 'Weich landen, Ellbogen fangen ab.'],
  },
  {
    id: 'kabel-explosiv-druecken', name: 'Explosives Kabeldrücken', category: 'push',
    primary: ['brust', 'schulter_vorn'], secondary: ['trizeps'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(32),
    equipment: 'Bio Force wie Bankdrücken, Last ca. 40–50 % des 10RM',
    steps: ['So schnell wie möglich nach vorn drücken.', 'Exzentrisch kontrolliert 2 s zurück.', '3–5 Wiederholungen, lange Pausen.'],
  },

  // ---------- PULL ----------
  {
    id: 'pullup', name: 'Pull-Ups strikt', category: 'pull',
    primary: ['lat', 'bizeps'], secondary: ['ruecken_oben', 'unterarme', 'bauch'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Klimmzugstange',
    steps: [
      'Obergriff etwas breiter als schulterbreit, aus dem vollen Hang.',
      'Schulterblätter nach unten ziehen, dann Ellbogen nach unten-hinten, bis das Kinn über der Stange ist.',
      'Kontrolliert (2 s) ablassen bis zum gestreckten Arm.',
    ],
    tips: ['Kein Schwung, keine halben Wiederholungen.', 'Zusatzlast erst ab 20 sauberen Wiederholungen.'],
  },
  {
    id: 'latzug', name: 'Latzug zur Brust', category: 'pull',
    primary: ['lat'], secondary: ['bizeps', 'ruecken_oben'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(42),
    equipment: 'Bio Force, Sitz angebracht, Latstange am oberen Haken, Gesicht zum Gerät',
    setup: 'Stange weit greifen, leicht zurücklehnen, Brust raus.',
    steps: ['Ellbogen nach unten-hinten ziehen, Stange zur oberen Brust.', 'Kurz anspannen.', 'Langsam zurück, bis die Arme gestreckt sind und die Schultern nach oben gehen (Dehnung).'],
    tips: ['Nicht in den Nacken ziehen.', 'Oberkörper nicht nach hinten werfen.'],
  },
  {
    id: 'latzug-eng', name: 'Latzug enger Griff', category: 'pull',
    primary: ['lat'], secondary: ['bizeps'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(47),
    equipment: 'Bio Force, Sitz angebracht, beide Handgriffe am Lat-Tower, Handflächen zueinander',
    setup: 'Griffe oben fassen, leicht zurücklehnen.',
    steps: ['Ellbogen nach unten ziehen, Hände zur Brust.', 'Langsam zurück in die volle Dehnung.'],
  },
  {
    id: 'rudern-stehend', name: 'Rudern stehend', category: 'pull',
    primary: ['ruecken_oben', 'lat'], secondary: ['schulter_hinten', 'bizeps'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(53),
    equipment: 'Bio Force, Sitz angebracht (als Anlehnpolster), Handgriffe an den unteren Haken, stehend vor dem Sitz',
    setup: 'Vor dem Gerät stehen, leicht in die Knie, Kniescheiben ans Sitzpolster lehnen. Griffe mit Daumen nach oben, Arme gestreckt.',
    steps: ['Ellbogen eng am Körper nach hinten ziehen, Hände zum Bauch, Schulterblätter zusammen.', 'Kurz halten.', 'Langsam nach vorn zurück, Schulterblätter am Ende auseinander lassen.'],
    tips: ['Oberkörper nicht nach hinten werfen.', 'Alternative sitzend: auf dem Sitz mit dem Gesicht zum Gerät.'],
  },
  {
    id: 'rudern-einarmig', name: 'Einarmiges Rudern', category: 'pull',
    primary: ['lat', 'ruecken_oben'], secondary: ['bizeps', 'schulter_hinten'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(54),
    equipment: 'Bio Force, wie Rudern stehend, ein Griff',
    setup: 'Schrittstellung, freie Hand am Gerät abstützen.',
    steps: ['Arm weit nach vorn strecken lassen (Dehnung).', 'Ellbogen zur Hüfte ziehen, kurz halten.', 'Langsam zurück. Beide Seiten.'],
  },
  {
    id: 'australian-pullup', name: 'Australian Pull-Ups', category: 'pull',
    primary: ['ruecken_oben', 'lat'], secondary: ['bizeps', 'schulter_hinten', 'bauch'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Niedrige Stange oder Dip-Barren',
    steps: ['Unter der Stange hängen, Fersen am Boden, Körper gerade.', 'Brust zur Stange ziehen, Schulterblätter zusammen.', 'Langsam ablassen bis zum gestreckten Arm.'],
    tips: ['Schwerer: Füße erhöht. Leichter: Knie beugen.', 'Ersatz: Rudern stehend mit Griffen.'],
  },
  {
    id: 'face-pull', name: 'Face Pulls', category: 'pull',
    primary: ['schulter_hinten', 'ruecken_oben'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(68),
    equipment: 'Bio Force, Sitz entfernt, Handgriffe an den Karabinern auf Schulterhöhe oder oben, stehend zum Gerät',
    setup: 'Griffe mit Daumen nach hinten fassen, Arme gestreckt, Schritt zurück bis Spannung da ist.',
    steps: ['Griffe zum Gesicht ziehen, Ellbogen hoch und weit nach außen. Am Ende zeigen die Fäuste neben die Ohren.', 'Langsam zurück.'],
    tips: ['Zu schwer wird es ein Rudern. 15 saubere Wiederholungen sind das Ziel.', 'Foto zeigt die Herstellervariante Nr. 68 „Delta-Rudern“ (Zug von unten): Ellbogen nach hinten-oben, nicht über Schulterhöhe.'],
  },
  {
    id: 'reverse-fly', name: 'Reverse Flys am Kabel', category: 'pull',
    primary: ['schulter_hinten'], secondary: ['ruecken_oben'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(70),
    equipment: 'Bio Force, Sitz entfernt, Handgriffe an den Karabinern auf Schulterhöhe, Seile über Kreuz, stehend zum Gerät',
    setup: 'Linke Hand hält das rechte Seil und umgekehrt. Griffe vor dem Körper auf Hüft- bis Brusthöhe, Arme fast gestreckt.',
    steps: ['Arme nach außen-hinten öffnen, bis die Ellbogen auf Schulterhöhe sind.', 'Kurz halten, langsam zurück.'],
    tips: ['Ellbogen nicht stark beugen, Oberkörper nicht pendeln.'],
  },
  {
    id: 'bizeps-curl', name: 'Bizeps-Curls am Kabel', category: 'pull',
    primary: ['bizeps'], secondary: ['unterarme'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(81),
    equipment: 'Bio Force, Sitz entfernt, Handgriffe, untere Haken, Rücken zum Gerät',
    setup: 'Untergriff, Ellbogen am Körper fixiert.',
    steps: ['Arme beugen, kurz anspannen.', 'Langsam strecken.'],
    tips: ['Ellbogen nicht nach vorn schwingen.'],
  },
  {
    id: 'hammer-curl', name: 'Hammer-Curls', category: 'pull',
    primary: ['bizeps'], secondary: ['unterarme'], loadType: 'extern', unit: 'reps', bioforceNo: bf(83),
    equipment: 'Kurzhanteln oder Bio Force (Nr. 83)',
    steps: ['Daumen zeigen nach oben (neutraler Griff).', 'Arme beugen, kurz anspannen, langsam strecken.'],
  },
  {
    id: 'shrugs', name: 'Shrugs', category: 'pull',
    primary: ['ruecken_oben'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(62),
    equipment: 'Bio Force, Sitz entfernt, Latstange an den unteren Haken, stehend',
    steps: ['Stange vor den Oberschenkeln, Arme gestreckt.', 'Schultern gerade nach oben ziehen, 1 s halten, ablassen.'],
    tips: ['Nicht kreisen.'],
  },

  // ---------- BEINE ----------
  {
    id: 'kabel-kniebeuge', name: 'Kabel-Kniebeuge', category: 'beine',
    primary: ['quadrizeps', 'gesaess'], secondary: ['hamstrings', 'waden', 'ruecken_unten'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(1),
    equipment: 'Bio Force, Sitz entfernt, Handgriffe an den unteren Haken, stehend mit Gesicht zum Gerät',
    setup: 'Füße schulterbreit, Griffe auf Schulterhöhe halten.',
    steps: ['Langsam (3 s) in die Knie bis die Oberschenkel etwa parallel zum Boden sind, oder so tief wie knieschmerzfrei.', '1 s halten.', 'Kontrolliert hochdrücken, Oberkörper aufrecht.'],
    knee: 'Knie über den Zehen, nicht nach innen. Gewicht auf dem ganzen Fuß. Tiefe nur so weit, wie der Schmerz unter 3/10 bleibt.',
  },
  {
    id: 'rdl', name: 'Romanian Deadlift (Latstange)', category: 'beine',
    primary: ['hamstrings', 'gesaess'], secondary: ['ruecken_unten', 'ruecken_oben', 'unterarme'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(7),
    equipment: 'Bio Force, Sitz entfernt, Latstange an beiden unteren Haken, stehend mit Gesicht zum Gerät',
    setup: 'Stange im Obergriff vor den Oberschenkeln, aufrecht, Knie leicht gebeugt und so lassen.',
    steps: [
      'Hüfte nach hinten schieben, Oberkörper mit geradem Rücken nach vorn neigen. Stange dicht an den Beinen nach unten, bis die hinteren Oberschenkel deutlich ziehen.',
      'Hüfte nach vorn drücken und aufrichten, Gesäß anspannen. Oben nicht überstrecken.',
    ],
    tips: ['Runder Rücken und Stange vom Körper weg sind die Hauptfehler.', 'Foto zeigt Nr. 7 (klassisches Kreuzheben mit Kniebeugung). Wir beugen die Knie kaum.'],
  },
  {
    id: 'pull-through', name: 'Cable Pull-Through', category: 'beine',
    primary: ['gesaess', 'hamstrings'], secondary: ['ruecken_unten'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(6),
    equipment: 'Bio Force, Sitz entfernt, ein Griff oder AB-Strap an einem unteren Haken, Rücken zum Gerät, Seil zwischen den Beinen',
    setup: 'Griff mit beiden Händen zwischen den Beinen, Schritt nach vorn bis Spannung da ist.',
    steps: ['Hüfte nach hinten schieben, Oberkörper neigt sich, Arme bleiben gestreckt und gehen nach hinten zwischen die Beine.', 'Hüfte nach vorn drücken, aufrichten, Gesäß fest anspannen.'],
    tips: ['Nicht mit den Armen ziehen. Die Arme sind nur Haken.'],
  },
  {
    id: 'beinbeuger', name: 'Beinbeuger stehend', category: 'beine',
    primary: ['hamstrings'], secondary: ['waden', 'gesaess'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(8),
    equipment: 'Bio Force, Sitz und Beinmodul angebracht, stehend mit Gesicht zum Gerät, kein Zubehör',
    setup: 'Ein Oberschenkel drückt von vorn gegen das obere Polster. Der Knöchel desselben Beins hakt hinter dem unteren Polster ein. Mit den Händen am Gerät festhalten.',
    steps: ['Ferse zum Gesäß ziehen (3 s), bis der Unterschenkel waagerecht ist. 1 s halten.', 'Langsam (3 s) strecken, nicht ganz durchstrecken.'],
    tips: ['Tempo 3-1-3, leichte Last, beide Seiten.'],
  },
  {
    id: 'beinstrecker', name: 'Beinstrecker', category: 'beine',
    primary: ['quadrizeps'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(4),
    equipment: 'Bio Force, Sitz und Beinmodul angebracht, sitzend, Kniekehlen am Drehpunkt',
    setup: 'Aufrecht sitzen, am Sitz festhalten, Unterschenkel hinter dem unteren Polster.',
    steps: ['Beine langsam (3 s) strecken bis fast gerade. 1 s halten, Oberschenkel fest anspannen.', 'Langsam (3 s) ablassen.'],
    knee: 'Leichte Last, kein Schmerz über 3/10. Die langsame Ausführung ist der Sehnenreiz. Bei Schmerz unten nur die oberen zwei Drittel der Bewegung.',
  },
  {
    id: 'split-squat', name: 'Split Squat', category: 'beine',
    primary: ['quadrizeps', 'gesaess'], secondary: ['hamstrings', 'huefte'], loadType: 'extern', unit: 'reps', bioforceNo: bf(2),
    equipment: 'Körpergewicht, optional Kettlebell vor der Brust',
    setup: 'Großer Schritt nach vorn, hinterer Fuß auf dem Ballen.',
    steps: ['Hinteres Knie langsam Richtung Boden, vorderes Knie bleibt über dem Fuß, Oberkörper aufrecht.', 'Über die vordere Ferse hochdrücken.'],
    knee: 'Kürzerer Schritt und weniger Tiefe entlasten das vordere Knie. Bei Schmerz Step-Up niedrig.',
    tips: ['Foto zeigt Herstellervariante Nr. 2 mit Griffen an den unteren Haken.'],
  },
  {
    id: 'step-up', name: 'Step-Up', category: 'beine',
    primary: ['quadrizeps', 'gesaess'], secondary: ['waden'], loadType: 'extern', unit: 'reps',
    equipment: 'Stabile Stufe (kniehoch oder niedriger), Kettlebell',
    steps: ['Ganzer Fuß auf der Stufe, mit dem oberen Bein hochdrücken. Das untere Bein schiebt nicht mit.', 'Oben kurz stehen, langsam (3 s) absteigen.', 'Alle Wiederholungen einer Seite, dann wechseln.'],
  },
  {
    id: 'hueftabduktion', name: 'Hüftabduktion mit Fußschlaufe', category: 'beine',
    primary: ['huefte'], secondary: ['bauch_schraeg'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(16),
    equipment: 'Bio Force, Sitz entfernt, Fußschlaufe am unteren Haken, seitlich zum Gerät, Schlaufe am äußeren Fuß',
    setup: 'Mit dem Arm am Gerät abstützen, aufrecht stehen.',
    steps: ['Bein gestreckt seitlich vom Gerät wegziehen, Zehen nach vorn. 1 s halten.', 'Langsam zurück.'],
    tips: ['Kein Vor- und Zurückpendeln.', 'Hüftkräftigung ist der stärkste Hebel gegen Knieschmerz.'],
  },
  {
    id: 'hueftstrecken', name: 'Hüftstrecken / Kickback', category: 'beine',
    primary: ['gesaess'], secondary: ['hamstrings'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(12),
    equipment: 'Bio Force, Sitz entfernt, Fußschlaufe am unteren Haken, Gesicht zum Gerät, am Haltegriff abstützen',
    steps: ['Bein gestreckt nach hinten drücken, Gesäß anspannen, 1 s halten.', 'Zurück. Rücken gerade, kein Hohlkreuz.'],
  },
  {
    id: 'wadenheben', name: 'Wadenheben', category: 'beine',
    primary: ['waden'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(9),
    equipment: 'Bio Force (untere Griffe, Zehen zum Gerät) oder Stufe',
    steps: ['Fersen so hoch wie möglich anheben, 1 s halten.', 'Ganz tief ablassen (Dehnung).'],
  },
  {
    id: 'wall-sit', name: 'Wall Sit', category: 'beine',
    primary: ['quadrizeps'], secondary: ['gesaess'], loadType: 'bodyweight', unit: 'seconds',
    equipment: 'Wand',
    steps: ['Rücken an der Wand, Füße einen Schritt vor.', 'Hinuntergleiten bis Knie 90° oder höher (weniger Beugung = leichter). Halten, atmen.'],
    tips: ['Isometrische Sehnenvorbereitung im Warm-up.'],
  },
  {
    id: 'kniebeuge-bw', name: 'Kniebeugen (Körpergewicht)', category: 'beine',
    primary: ['quadrizeps', 'gesaess'], secondary: ['hamstrings'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: ['Füße schulterbreit, Hüfte nach hinten und unten bis Oberschenkel parallel, Fersen am Boden.', 'Hochdrücken. Im Finisher zügig, aber kontrolliert.'],
  },
  {
    id: 'kb-swing', name: 'Kettlebell-Swing', category: 'beine',
    primary: ['gesaess', 'hamstrings'], secondary: ['ruecken_unten', 'schulter_vorn', 'cardio'], loadType: 'extern', unit: 'reps',
    equipment: 'Kettlebell 8 kg',
    steps: ['Hüftbeuge wie beim Pull-Through, Kettlebell zwischen den Beinen zurückschwingen.', 'Hüfte explosiv nach vorn, Arme schwingen bis Brusthöhe.'],
    tips: ['Der Schwung kommt aus der Hüfte, nicht aus den Armen. Knie nur leicht gebeugt.'],
  },

  // ---------- CORE ----------
  {
    id: 'cable-crunch', name: 'Cable Crunch', category: 'core',
    primary: ['bauch'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(106),
    equipment: 'Bio Force, Sitz angebracht, Handgriffe oder AB-Strap am oberen Haken, nach vorn sitzend',
    setup: 'Griffe auf Schulterhöhe, Ellbogen nach vorn.',
    steps: ['Wirbelsäule einrollen, Brust Richtung Hüfte ziehen, 1 s halten.', 'Langsam aufrollen.'],
    tips: ['Nicht mit den Armen ziehen, Hüfte bleibt ruhig.'],
  },
  {
    id: 'pallof', name: 'Pallof Press', category: 'core',
    primary: ['bauch_schraeg'], secondary: ['bauch', 'schulter_vorn'], loadType: 'bioforce', unit: 'reps',
    equipment: 'Bio Force, Sitz entfernt, ein Griff am Karabiner auf Schulterhöhe, seitlich zum Gerät',
    setup: 'Griff mit beiden Händen vor der Brust, ein Schritt vom Gerät weg, Füße schulterbreit.',
    steps: ['Arme langsam nach vorn strecken. Das Kabel will dich zum Gerät drehen, du verhinderst es. 2–3 s halten.', 'Hände zurück zur Brust. Alle Wiederholungen, dann Seite wechseln.'],
  },
  {
    id: 'woodchop', name: 'Oberkörperdrehen / Woodchop', category: 'core',
    primary: ['bauch_schraeg'], secondary: ['bauch', 'schulter_vorn'], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(108),
    equipment: 'Bio Force, Sitz entfernt, ein Griff am Karabiner auf Schulterhöhe, seitlich zum Gerät',
    steps: ['Griff mit beiden Händen, Arme gestreckt, Oberkörper vom Gerät wegdrehen.', 'Drehen, nicht ziehen. Beide Seiten.'],
  },
  {
    id: 'rueckenstrecker', name: 'Rückenstrecker sitzend', category: 'core',
    primary: ['ruecken_unten'], secondary: [], loadType: 'bioforce', unit: 'reps', bioforceNo: bf(110),
    equipment: 'Bio Force, Sitz angebracht, Handgriffe am oberen Haken, Gesicht zum Gerät, Griffe an die Brust',
    steps: ['Aus leicht gebeugter Haltung die Wirbelsäule aufrichten und verlängern, Brustkorb heben, 1 s halten.', 'Zurück. Leichte Last.'],
  },
  {
    id: 'superman', name: 'Superman', category: 'core',
    primary: ['ruecken_unten', 'gesaess'], secondary: [], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: ['Bauchlage, Arme nach vorn. Brust und Beine gleichzeitig leicht anheben, 2 s halten.', 'Ablassen. Blick zum Boden.'],
  },
  {
    id: 'plank', name: 'Elbow Plank', category: 'core',
    primary: ['bauch'], secondary: ['schulter_vorn', 'gesaess'], loadType: 'bodyweight', unit: 'seconds',
    equipment: 'Boden',
    steps: ['Unterarmstütz, Ellbogen unter den Schultern, Körper gerade.', 'Gesäß anspannen, Bauch fest, atmen.'],
  },
  {
    id: 'side-plank', name: 'Side Plank', category: 'core',
    primary: ['bauch_schraeg', 'huefte'], secondary: [], loadType: 'bodyweight', unit: 'seconds',
    equipment: 'Boden',
    steps: ['Seitlicher Unterarmstütz, Hüfte hoch, Körper gerade.', 'Leichter: unteres Knie am Boden.'],
  },
  {
    id: 'hanging-knee-raise', name: 'Hanging Knee Raises', category: 'core',
    primary: ['bauch', 'huefte'], secondary: ['unterarme'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Klimmzugstange',
    steps: ['Hang an der Stange, Knie langsam zur Brust ziehen, Becken leicht einrollen.', 'Langsam ablassen, kein Schwung.'],
  },
  {
    id: 'dead-bug', name: 'Dead Bug', category: 'core',
    primary: ['bauch'], secondary: [], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: ['Rückenlage, Arme senkrecht, Knie 90° über der Hüfte. Unterer Rücken fest am Boden.', 'Gegenüberliegenden Arm und Bein langsam strecken, ohne dass der Rücken abhebt. Zurück, Seite wechseln.'],
  },
  {
    id: 'mountain-climber', name: 'Mountain Climbers', category: 'core',
    primary: ['bauch', 'huefte'], secondary: ['schulter_vorn', 'cardio'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: ['Liegestützposition, Knie abwechselnd zügig zur Brust, Hüfte bleibt tief.', 'Zählung: ein Knie = 1.'],
  },

  // ---------- CARDIO ----------
  {
    id: 'burpee', name: 'Burpees (Goliaz-Standard)', category: 'cardio',
    primary: ['cardio'], secondary: ['brust', 'schulter_vorn', 'quadrizeps', 'bauch'], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: [
      'Aus dem Stand in die Liegestützposition, Brust zum Boden (Push-Up).',
      'Hochdrücken, Füße nach vorn.',
      'Strecksprung: Körper ganz gestreckt, Hände hinter dem Kopf, Füße verlassen kurz den Boden.',
    ],
    knee: 'Keine Burpee-Squat-Jumps oder Tuck-Jumps. Der gestreckte Sprung ist knieverträglich.',
  },
  {
    id: 'seil', name: 'Seilspringen', category: 'cardio',
    primary: ['cardio', 'waden'], secondary: ['schulter_vorn'], loadType: 'none', unit: 'seconds',
    equipment: 'Springseil',
    steps: ['Kleine, flache Sprünge auf dem Vorfuß, Knie weich.', 'Handgelenke drehen das Seil.'],
    knee: 'Bei Schmerz auf Marschieren mit Armzug wechseln.',
  },
  {
    id: 'laufen-z2', name: 'Laufen Zone 2', category: 'cardio',
    primary: ['cardio'], secondary: ['waden', 'quadrizeps'], loadType: 'none', unit: 'meters',
    equipment: 'Draußen, Polar-Armgurt',
    steps: ['Herzfrequenz 105–125. Test: Du kannst in ganzen Sätzen sprechen.', 'Kurze Schritte, hohe Frequenz (170–180 pro Minute), Fuß unter dem Körper aufsetzen.'],
  },
  {
    id: 'walk-run', name: 'Walk-Run', category: 'cardio',
    primary: ['cardio'], secondary: ['waden', 'quadrizeps'], loadType: 'none', unit: 'meters',
    equipment: 'Draußen, Polar-Armgurt',
    steps: ['3 min locker laufen, 1 min gehen, im Wechsel.', 'Herzfrequenz beim Laufen 105–125.'],
    tips: ['Einstieg für Sehnen und Gelenke. Ab Woche 3 durchgehend laufen.'],
  },
  {
    id: 'laufintervall', name: 'Laufintervalle', category: 'cardio',
    primary: ['cardio'], secondary: ['quadrizeps', 'waden'], loadType: 'none', unit: 'seconds',
    equipment: 'Draußen',
    steps: ['Nach 10 min Aufwärmen. Zügig, aber kein Sprint.', 'Pausen gehend oder trabend.'],
  },
  {
    id: 'sprint', name: 'Sprints', category: 'cardio',
    primary: ['cardio', 'hamstrings'], secondary: ['gesaess', 'quadrizeps'], loadType: 'none', unit: 'seconds',
    equipment: 'Flache, ebene Strecke',
    steps: ['10–20 s bei 85–95 % der Höchstgeschwindigkeit.', '2–3 min Gehpause. Erst nach Steigerungsläufen.'],
    knee: 'Nie kalt, nie bergab.',
  },
  {
    id: 'cooper', name: '12-Minuten-Lauf (Cooper-Test)', category: 'cardio',
    primary: ['cardio'], secondary: [], loadType: 'none', unit: 'meters',
    equipment: 'Draußen, Polar-Armgurt, Distanzmessung',
    steps: ['In 12 Minuten so weit wie möglich laufen.', 'Gleichmäßig starten, die letzten 3 Minuten steigern.', 'Distanz und Durchschnittsherzfrequenz notieren.'],
  },

  // ---------- WARM-UP ----------
  {
    id: 'scapula-pushup', name: 'Scapula-Push-Ups', category: 'warmup',
    primary: ['ruecken_oben'], secondary: [], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Boden',
    steps: ['Liegestützposition mit gestreckten Armen. Nur die Schulterblätter zusammenziehen und wieder auseinanderdrücken.'],
  },
  {
    id: 'scapula-pullup', name: 'Scapula Pull-Ups', category: 'warmup',
    primary: ['lat', 'ruecken_oben'], secondary: [], loadType: 'bodyweight', unit: 'reps',
    equipment: 'Klimmzugstange',
    steps: ['Im Hang mit gestreckten Armen nur die Schulterblätter nach unten ziehen, der Körper hebt sich wenige Zentimeter. Langsam zurück.'],
  },
]

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
export const ex = (id: string): Exercise => {
  const e = EXERCISE_MAP[id]
  if (!e) throw new Error('Unbekannte Übung: ' + id)
  return e
}

export function exerciseImages(e: Exercise): { start?: string; end?: string; pulley?: string } {
  if (!e.bioforceNo) return {}
  const n = String(e.bioforceNo).padStart(3, '0')
  const dir = `${import.meta.env.BASE_URL}img/bioforce`
  return { start: `${dir}/bf${n}_start.png`, end: `${dir}/bf${n}_end.png`, pulley: `${dir}/bf${n}_pulley.jpg` }
}

export const CATEGORY_LABEL: Record<Category, string> = {
  push: 'Drücken (Brust, Schultern, Trizeps)',
  pull: 'Ziehen (Rücken, Bizeps)',
  beine: 'Beine und Hüfte',
  core: 'Core und unterer Rücken',
  cardio: 'Cardio und Finisher',
  warmup: 'Warm-up',
}
