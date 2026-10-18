# Block 2 „Hypertrophie“ – Wochen 5–8

Start Mo 19.10.2026, Woche 8 (Kraft-Challenge) ab Mo 09.11.2026. Die Daten stehen in `app/src/data/plan.ts` (`buildBlock2Week`, `w8`); diese Datei beschreibt den Plan und die Begründung.

## 1. Ausgangslage (Auswertung Wochen 1–3, Export vom 11.10.2026)

- 17 Einheiten, alle Kurz-Checks mit Knie 0, Muskelkater meist 0–3, Schlaf 7–7,5 h.
- Steigerungen: RDL 70 → 95 lb, Wadenheben 60 → 72,5 lb, Incline Fly 20 → 30 lb, Latzug eng 50 → 52,5 lb, Pallof 10 → 20 lb, einarmiges Rudern 20 → 27,5 lb. Defizit-Push-Ups 4 × 15 bei RIR 2, Dips 3 × 10, Pull-Ups 4 × 6. AMRAP 8 min am Freitag 6 Runden.
- Gewicht 74,7 → 74,0 kg. Benchmarks Woche 1: Push-Ups 63, Pull-Ups 11, Dips 18, Plank 2:31, Burpees 5 min 64, AMRAP 6 min 5 Runden. Cooper 1.950 m nur auf dem Walkingpad (nicht verwertbar), Bleep-Test 11.08.2026: VO2max 44.
- **Problem 1, Dauer:** Kraft-Einheiten in Woche 3 dauerten 82–86 min (geplant 55–60). **Beschluss 11.10.:** ca. 70 min inkl. Warm-up und Cool-down.
- **Problem 2, Progression:** Steigerung nur bei RIR ≤ 1, der User trainiert sauber bei RIR 2 → Lasten blieben stehen (Kabel-Kniebeuge 5 × 10 @ 47,5 lb). **Beschluss 11.10.:** obere Wiederholungszahl bei RIR 2 → +2,5 lb (eine Raste).

## 1b. Ergebnisse Woche 4 (Kraftausdauer-Challenge, Export vom 18.10.2026)

| Ziel | Wochenziel | Geschafft | Anteil |
|---|---|---|---|
| Pull-Ups | 132 (12 × 11) | 155 | 117 % |
| Push-Ups | 504 (8 × 63) | 658 | 131 % |
| Kniebeugen | 500 (Standardwert, kein Minuten-Test) | 585 | 117 % |
| Burpees | 256 (4 × 64) | 361 | 141 % |

- **Mo–Mi:** Zirkel 5 Pull-Ups · 20 Push-Ups · 20 Kniebeugen · 10 Burpees, 7 Runden je Tag (gespeichert 35 / 150 / 150 / 80), Blockzeiten 34:52, 35:15, 33:48 min. Pull-Ups ab Dienstag in 6, ab Mittwoch in allen 7 Runden unbroken; der User spürt vor allem dort einen Kraftzuwachs.
- **Do Test-Tag (15.10.):** 5-min-Push-Ups **98** (neuer Benchmark), 5-min-Burpees **66** (Woche 1: 64, trotz der Push-Ups direkt davor), 15 min Zone 2 mit Ø 125. Pulsdaten des Burpee-Tests unbrauchbar (Armgurt verrutscht, Ø unter 130 angezeigt, real geschätzt 150–160).
- **Finale am So 18.10.** (Fr/Sa keine Zeit, wenig Schlaf, Motivation 3): Rest in 14:31 min (25 / 60 / 60 / 30), danach **AMRAP 12 = 5 Runden** (5 Pull-Ups, 10 Push-Ups, 15 Kniebeugen, 5 Burpees). Erste Runde leichtes Ziehen in rechter Schulter und Oberarm, ab Runde 2 weg.
- **Krafterhalt:** Schrägdrücken 30 → 35 lb, Kabel-Kniebeuge 50 lb (mit Seilverlängerung), RDL 100 lb, Rudern stehend 25 → 27,5 lb, Latzug 40 lb, Beinstrecker 52,5 lb.
- **Kurz-Check:** Knie 0, Muskelkater ≤ 2, Schlaf 6,5–8 h. Einheiten 64–75 min, Finale 43 min.
- **Körper:** 75,0 kg / 88 cm am 18.10. (Start 74,7 / 88); laut User schwankt das Gewicht verdauungsbedingt, realistisch ca. 74,5 kg. Subjektiv mehr Volumen an Brust, Schultern, Armen, Oberschenkeln. Alle Kniebeugen bewusst langsam und so tief wie möglich, Hüftmobilität spürbar besser.
- **Einschätzung des Users:** größter Engpass ist die Kondition, danach die Kraft.

## 2. Prinzipien

- **Wiederholungen:** Hauptübungen 6–8 (RIR 1–2), Nebenübungen 8–10, Isolation 10–15 (RIR 0–1).
- **Woche 5** mit einem Satz weniger bei den Hauptübungen (Deload zum Blockstart, Konzept 3), Wochen 6–7 mit 4 Sätzen.
- **Lastumrechnung beim Wechsel 10 → 6–8:** `suggestLoad()` rechnet über Epley (Wiederholungen + RIR) auf die obere Wiederholungszahl mit RIR 2 um, auf die Raste abgerundet, nie leichter als bisher.
- **Progression:** obere Wiederholungszahl in allen Sätzen bei RIR ≤ 1 → +5 lb, bei RIR 2 → +2,5 lb, bei RIR ≥ 3 → +5/+10 lb. Kleine Übungen wie bisher.
- **Zeit:** Mittwoch ohne einarmiges Rudern und Australian Pull-Ups (Beschluss 18.09.), Core in Supersätzen, Finisher 6 min, Freitag ohne Step-Ups.
- **Umbau:** höchstens ein Sitz-Umbau je Einheit; kein Zubehörwechsel im Supersatz (Fr: Kickback und Seitheben als getrennte Blöcke; Mi: Reverse Flys + Face Pulls beide am Karabiner auf Schulterhöhe).
- **Puls:** Zone 2 116–128, Intervalle 141–153 (HFmax 165, Ruhepuls 43).

## 3. Wochen 5–7

| | Woche 5 | Woche 6 | Woche 7 |
|---|---|---|---|
| Sätze Hauptübungen | 3 | 4 | 4 |
| Burpee-Intervalle 30/60 | 8 Runden | 9 Runden | 10 Runden |
| Zone 2 | 20 min | 25 min | 25 min |
| Fr-Finisher | AMRAP 6 | AMRAP 6 | AMRAP 6 als Vergleichstest (Woche 1: 5 Runden) |

### Mo – Push + Core (ca. 60–65 min)

| Block | Übung | Vorgabe | Pause |
|---|---|---|---|
| A | Kabel-Schrägdrücken | 3/4 × 6–8, RIR 1–2 | 150 s |
| B | Dips + Incline Cable Fly | 3 × 6–10 + 3 × 10–12 | 30/90 s |
| C | Trizeps über Kopf + Elbow Plank | 2 × 10–12 + 2 × 45 s | 20/45 s |
| Umbau | **Sitz abbauen** | | |
| D | Seitheben am Kabel | 3 × 12–15 je Seite, RIR 0–1 | 45 s |
| Finisher | AMRAP 6: 6 Burpees, 10 Push-Ups, 20 Mountain Climbers | | |

### Di – Beine + Hüfte (ca. 70–74 min)

| Block | Übung | Vorgabe | Pause |
|---|---|---|---|
| A | Kabel-Kniebeuge, Tempo 3-1-1, Griffe über je zwei Karabiner (Seilverlängerung) | 3/4 × 6–8 | 120 s |
| B | Romanian Deadlift | 3/4 × 6–8 | 120 s |
| C | Split Squat + Hüftabduktion | 3 × 8–10 je Seite + 2 × 15 je Seite | 30/75 s |
| D | Wadenheben + Dead Bug | 3 × 10–12 + 3 × 10 je Seite | 20/45 s |
| Umbau | **Sitz anbringen** | | |
| E | Beinbeuger + Beinstrecker, Tempo 3-1-3 | 2 × 8–10 je Seite + 2 × 10–12 (RIR 2, nicht bis zum Versagen) | 30/75 s |

### Mi – Pull + hintere Schulter (ca. 65 min)

| Block | Übung | Vorgabe | Pause |
|---|---|---|---|
| A | Pull-Ups | 4 × 5–7, RIR 1–2 | 120 s |
| B | Rudern stehend | 3/4 × 6–8 | 120 s |
| C | Latzug + Hanging Knee Raises | 3 × 8–10 + 3 × 10–12 | 30/75 s |
| Umbau | **Sitz abbauen** | | |
| D | Reverse Flys + Face Pulls | 3 × 12–15 + 3 × 12–15 | 20/60 s |
| E | Bizeps-Curls + Hammer-Curls | 2 × 10–12 + 2 × 10–12 | 20/45 s |

### Do – Cardio (ca. 45–50 min)

Warm-up, Burpee-Intervalle 30 s / 60 s (8/9/10 Runden, Puls am Rundenende 141–153), Zone 2 durchgehend laufen 20/25/25 min (Indoor: Seil 45/15 mit Wechsel-Timer), Cool-down.

### Fr – Ganzkörper Hypertrophie (ca. 70 min)

| Block | Übung | Vorgabe | Pause |
|---|---|---|---|
| A | Defizit-Push-Ups + Latzug eng | 3 × 8–12 + 3 × 8–10 | 30/75 s |
| B | Kabel-Schrägdrücken + einarmiges Rudern | 3 × 8–10 + 3 × 8–10 je Seite | 30/75 s |
| C | Schulterdrücken + Hanging Knee Raises | 3 × 8–10 + 3 × 10–12 | 30/75 s |
| Umbau | **Sitz abbauen** | | |
| D | Hüftstrecken / Kickback | 2 × 12 je Seite | 45 s |
| E | Seitheben am Kabel | 2 × 12–15 je Seite | 45 s |
| Finisher | AMRAP 6: 5 Burpees, 10 Push-Ups, 15 Kniebeugen | | |

## 4. Woche 8 – Kraft-Challenge

Wenig Volumen, volle Pausen; Ergebnisse sind die Grundlage für Block 3 (4–6 Wdh.). Mobility-Check in dieser Woche, Fotos am Montag der Woche 9.

| Tag | Inhalt |
|---|---|
| Mo | Kabel-Schrägdrücken **5RM** (aufsteigend, 4 Sätze), Dips max (W1: 18), Plank max (W1: 2:31), Seitheben 2 Sätze |
| Di | Kabel-Kniebeuge **8RM**, RDL **8RM** (aufsteigend), Wadenheben + Dead Bug |
| Mi | Pull-Ups max (W1: 11), Rudern stehend **5RM**, **Pull-Up-Leiter** 1-2-3-… bis Abbruch (Summe als Benchmark `pullupLadder`), Reverse Flys + Face Pulls |
| Do | **Bleep-Test** (Goliaz-App, Benchmark `bleepVo2`, Vergleich 44) nur bei ruhigen Knien, sonst 5-min-Burpees; 15 min locker |
| Fr | Push-Ups max (W1: 63), AMRAP 12 wie in Woche 4 (Vergleich) |

Pull-Ups mit Zusatzlast (Konzept 3.5) entfallen: Zusatzlast erst ab 20 unbroken (Entscheidung 3).
