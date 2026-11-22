# Fitnessapp „Transformation 16“

Persönliches Projekt von René: 16-Wochen-Trainingsplan (Bodyweight + Finnlo Bio Force Extreme Kraftstation) und eine lokale Trainings-App (PWA) dazu. Sprache im Projekt und mit dem User: Deutsch.

## Zuerst lesen

1. `docs/Uebergabe.md` – aktueller Stand, offene Punkte, nächste Schritte (die Chronik bis 17.11.2026 liegt in `docs/Uebergabe-Archiv.md`, nur bei Bedarf nachschlagen; neue Einträge kurz halten und Erledigtes ins Archiv schieben)
2. `docs/Trainingskonzept.md` – Studienlage, Planarchitektur, getroffene Entscheidungen
3. `docs/Block1-Wochen1-4.md` – Woche 1–4 Tag für Tag (Start Mo 21.09.2026); `docs/Block2-Wochen5-8.md` – Block 2 mit Auswertung der Wochen 1–3; `docs/Block3-Wochen9-13.md` – Ergebnisse der Kraft-Challenge, Übergangswoche 9, Accumulator-Tabelle
4. `docs/Uebungsbibliothek.md` – alle Übungen mit Muskeln, Bio-Force-Einstellung, Ausführung
5. `docs/App-Anleitung.md` – was die App kann, wie sie aufs Handy kommt
6. `docs/Mobility.md` – Mobility-Konzept (Studienlage, Warm-up/Cool-down, Routinen, Mobility-Check)

## Wichtige Fakten zum Athleten

56 J., 172 cm, 73,5 kg, gesund. Knie sind der Schwachpunkt: keine Burpee-Squat-Jumps, Tuck-Jumps, Pistols. Normale Goliaz-Burpees (Strecksprung) sind ok. 5 feste Trainingstage Mo–Fr, Samstag Puffer, Sonntag frei, ca. 60 min morgens. Prioritäten: Muskelaufbau/Kraft, dann Fettabbau, Ausdauer später.

## App (`app/`)

Vite + React 19 + TypeScript, Tailwind v4 (Theme-Tokens in `src/index.css`), Dexie (IndexedDB), vite-plugin-pwa, Recharts, react-router. Farben schwarz/orange. Alle Daten lokal, Export/Import als JSON, Datenmodell mit Profilen und `updatedAt` für späteren Sync.

- `src/data/plan.ts` – der Plan als Daten (17 Wochen seit der eingeschobenen Übergangswoche 9; Woche 1–12 komplett, 13–17 Platzhalter; Block 2 in `docs/Block2-Wochen5-8.md`, Block 3 in `docs/Block3-Wochen9-13.md`). Planänderungen hier, nicht in Komponenten.
- `src/data/exercises.ts` – Übungsbibliothek; `bioforceNo` verweist auf Fotos in `public/img/bioforce/bf{NNN}_{start|end|pulley}.webp` (aus der Extreme-Anleitung, 457 × 644 px; Nummerierung folgt weiter der alten Anleitung in `docs/`).
- `src/data/mobilityExercises.ts` + `src/data/mobility.ts` – Mobility-Übungen (Kategorie `mobility`), Routinen `mob-hip`/`mob-shoulder` und Mobility-Check `mob-check` (Routinen außerhalb des Wochenplans, `ROUTINE_WEEK` in `plan.ts`). Konzept in `docs/Mobility.md`. Warm-ups und Cool-downs sind `timed`-Segmente (Posten mit Sekunden, `perSide`), geführt über `src/components/TimedFlow.tsx` (automatischer Übergang mit Signal); Messungen (`measure`) landen als Benchmarks in cm (`LOWER_IS_BETTER` in `workouts.ts`).
- `src/data/accumulator.ts` – Accumulator (Goliaz-Burpee-Stufentest, Ausdauer-Benchmark statt Bleep): Tabelle angesagte Zahl (16–65) → Burpees; `saveBenchmark()` leitet aus `accumulatorVo2` den Benchmark `accumulatorBurpees` und einen Burpee-Satz ab.
- `src/lib/steps.ts` – Einheit → Schrittfolge für den geführten Modus. Speicherplatz eines Satzes = Übung + `segKey` + Satznummer; `segKey` kommt aus `Segment.id`, sonst aus dem `label`. Wird ein `label` geändert, zu dem es schon Sätze gibt: `id` auf das alte `label` setzen.
- Bemerkungen: `SetLog.note` (je Satz, Eingabe im Satz und in der Pause danach) und `Workout.notes` (je Einheit) über `src/components/NoteField.tsx`; die App schreibt dort nichts selbst hinein. Intervalle speichern die Wiederholungen je Runde in `SetLog.roundReps` (`reps` = Summe). Bei jeder Auswertung eines Exports mitlesen.
- `src/lib/planEngine.ts` – Tageslogik, Challenge-Ziele, Progressionsvorschlag (`suggestLoad`: nach Einstufung 10RM über Epley mit RIR, doppelte Progression, Regel „zu leicht“ bei RIR ≥ 3, Varianten bei Körpergewicht über `Exercise.variants` → `SetLog.variant`; `Prescription.hold` = Last halten ohne Steigerung (Wiedereinstieg), `Prescription.maxLb` = Obergrenze, `Session.note` = Hinweis zur Einheit). Einheiten dürfen auf Sa (`weekday: 6`) liegen, ein Wochentag ohne Einheit ist „frei“ (Woche 7 liegt nach dem Infekt auf Di–Sa).
- `src/lib/dates.ts` + `src/lib/planShift.ts` – Plan-Kalender: der User kann Wochen pausieren (`Profile.pauses`, Montage der Pausenwochen; alle folgenden Planwochen rücken sieben Tage) und Einheiten innerhalb der Woche verschieben (`Profile.moves`, Einheit → Wochentag). Datumsfunktionen nehmen `Cal` (Startmontag oder `PlanCal`); in Seiten immer `calOf(profile)` übergeben, nie `profile.planStartDate` direkt, und den Wochentag einer Einheit über `weekdayOf(session, cal)` lesen, nicht `session.weekday`. Terminliche Abweichungen macht der User in der App; `plan.ts` nur für Inhalte ändern.
- `src/lib/dashboard.ts` – Kennzahlen für den Startbildschirm (`src/pages/Today.tsx`), ebenfalls reine Funktionen.
- `src/lib/stats.ts` – Auswertung als reine Funktionen (Sätze je Muskelgruppe, Wiederholungen, Benchmarks, Frequenz, Cardio); `src/pages/Stats.tsx` stellt nur dar. Diagramme: eine Achse pro Diagramm, eine Farbe (Akzent), keine zweite y-Achse.
- `src/pages/Workout.tsx` – geführter Modus: Ablauf, Pause, Abschluss. Die Schritt-Typen liegen in `src/components/workout/` (`SetStepView`, `AmrapStep`, `IntervalStep`, `CardioStep`, `ChallengeStep`, `NextPreview`, `SupersetPartners`, `ReadinessForm`, `Notes`). Trainingsdatum = Tag des Kurz-Checks, nicht das Plan-Datum aus der Route.
- `src/pages/FreeTraining.tsx` – freies Training (Route `/free`, `/free/:id`): einzelne Übungen ohne Plan-Einheit, Sätze hängen an einem Workout je Tag mit `sessionKey = 'frei'` (`FREE_SESSION_KEY` in `src/lib/workouts.ts`); zählt in Verlauf und Auswertung, nicht als Plan-Einheit (`isFreeWorkout()`).
- `src/pages/Photos.tsx` + `src/lib/photos.ts` – Foto-Check (Route `/photos`): Fortschrittsfotos in vier Posen als JPEG-Blob in der Dexie-Tabelle `photos` (DB-Version 2), Verkleinerung auf 1280 px beim Speichern, Termine = Montag der Wochen 1/5/9/14/18, Fenster vom Freitag davor bis zum Tag vor dem nächsten Fenster (verspätete Fotos zählen), eigene Sicherung (nicht im JSON-Export), hartes Löschen. Hauptweg für Aufnahmen ist die Kamera-App des Handys über ein Dateifeld mit `capture` (volle Bildqualität); `src/components/PhotoCamera.tsx` (getUserMedia mit Selbstauslöser) ist nur Nebenweg, weil Chrome auf dem Xiaomi bei Größenwünschen nur Querformat und per ImageCapture nur rohe, flaue Bilder liefert.
- `src/lib/bioforce.ts` – Skala lb ↔ kg. `src/components/UpdateBanner.tsx` – PWA-Update nur auf Knopfdruck (`registerType: 'prompt'`, nie zurück auf `autoUpdate`: ein automatischer Reload hat am 17.09.2026 die Tabelle `workouts` blockiert). `src/components/ErrorBoundary.tsx` – Fehleranzeige; Build-Kennung `__BUILD__` unter „Mehr“.

Befehle im Ordner `app`: `npm run dev`, `npm test` (Vitest, `src/**/*.test.ts`; Datenbank-Tests laufen gegen `fake-indexeddb`), `npm run check` (Plan-Prüfung + Tests, läuft auch im Deploy vor dem Build), `npm run build` (führt `tsc -b` aus), `npm run preview -- --host` (LAN-Test). Dev-Server für den Browser-Pane: `.claude/launch.json` → „app“.

## Konventionen

- TypeScript strikt (`verbatimModuleSyntax`, `erasableSyntaxOnly`, keine unbenutzten Variablen). Vor Abschluss immer `npx tsc -b` und `npm run check` im Ordner `app`.
- Neue oder geänderte Logik in `src/lib` und `src/data` bekommt einen Test daneben (`*.test.ts`), statt sie mit Wegwerf-Skripten zu prüfen. Fixtures erfinden: das Repo ist öffentlich, echte Exporte des Users gehören nicht hinein.
- `src/lib/backup.ts` – dauerhafter Speicher (`navigator.storage.persist()`) und Erinnerung an den Export (`Settings.lastExportAt`, Karte auf „Heute“ nach 7 Tagen).
- `findSession()` und ähnliche Lookups in Komponenten mit `useMemo` kapseln (sonst Endlos-Rerender, siehe Workout.tsx).
- Bio-Force-Lasten: Die Geräteskala zeigt lb pro Seite (5–125; bis 100 lb in 2,5-lb-Rasten, darüber nur in 5-lb-Schritten; `BF_STEP_LB`/`BF_COARSE_STEP_LB` = Rasten, `BF_FINE_MAX_LB` = 100, `BF_PROGRESS_LB` = üblicher Steigerungsschritt 5 lb). Nie selbst runden oder addieren, sondern `snapLb`/`floorLb`/`stepLb`/`bfStepAt` aus `bioforce.ts` nutzen. Eingabe und Anzeige in lb, gespeichert wird `weightKg` (kg pro Seite); Umrechnung nur über `src/lib/bioforce.ts`.
- Zubehör (Yes4All-Set: Doppel-D-Griff, Trizepsseil, gerade Stange, V-Stange) steht als `Exercise.attachment` an der Übung; beide Seile hängen über einen Karabiner in der einen Öse, der Skalenwert bleibt pro Seite. Im Supersatz kein Zubehör mit Handgriff-Übungen mischen (Umstecken dauert zu lang). Vertikaler Zug am Gerät ab Woche 9: `latzug-einarmig` statt `latzug`.
- Supersätze: nie Bio-Force-Übungen mit `seat: 'on'` und `seat: 'off'` mischen; pro Einheit höchstens ein Sitz-Umbau, davor `SEAT_ON`/`SEAT_OFF` in `plan.ts` einfügen. Prüfen mit `node scripts/check-plan.mjs` im Ordner `app`.
- Dokumente in `docs/` sind die Quelle für Plan und Übungen; bei Änderungen Doku und `src/data` zusammen anpassen.
- Git-Repository: Zweig `main`, Remote `origin` = `https://github.com/rene-777/Fitnessapp.git` (öffentlich). `gh` ist installiert und angemeldet. Commits mit `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; Commit-Autor René <rene.sch@gmx.net>.
- Kie.ai (Bild- und Videogenerierung): MCP-Server `kie-ai` über `.mcp.json` → `app/scripts/kie-mcp.mjs` (startet `@felores/kie-ai-mcp-server`). API-Key nur als Windows-Benutzervariable `KIE_AI_API_KEY`, nie in Dateien des Repos.
- Hosting: **GitHub Pages**, live unter `https://rene-777.github.io/Fitnessapp/`. Jeder Push auf `main` deployt automatisch (`.github/workflows/deploy.yml`); Ergebnis prüfen mit `& "C:\Program Files\GitHub CLI\gh.exe" run list -R rene-777/Fitnessapp -L 1` (`gh` liegt evtl. nicht im PATH der Shell). Basispfad `/Fitnessapp/` gilt in Vite, Router, Manifest und Bildpfaden; neue statische Pfade immer mit `import.meta.env.BASE_URL` präfixen. Dev-Adresse: `http://localhost:5173/Fitnessapp/`.
