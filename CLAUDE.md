# Fitnessapp „Transformation 16“

Persönliches Projekt von René: 16-Wochen-Trainingsplan (Bodyweight + Finnlo Bio Force Extreme Kraftstation) und eine lokale Trainings-App (PWA) dazu. Sprache im Projekt und mit dem User: Deutsch.

## Zuerst lesen

1. `docs/Uebergabe.md` – aktueller Stand, offene Punkte, nächste Schritte
2. `docs/Trainingskonzept.md` – Studienlage, Planarchitektur, getroffene Entscheidungen
3. `docs/Block1-Wochen1-4.md` – Woche 1–4 Tag für Tag (Start Mo 21.09.2026)
4. `docs/Uebungsbibliothek.md` – alle Übungen mit Muskeln, Bio-Force-Einstellung, Ausführung
5. `docs/App-Anleitung.md` – was die App kann, wie sie aufs Handy kommt

## Wichtige Fakten zum Athleten

56 J., 172 cm, 73,5 kg, gesund. Knie sind der Schwachpunkt: keine Burpee-Squat-Jumps, Tuck-Jumps, Pistols. Normale Goliaz-Burpees (Strecksprung) sind ok. 5 feste Trainingstage Mo–Fr, Samstag Puffer, Sonntag frei, ca. 60 min morgens. Prioritäten: Muskelaufbau/Kraft, dann Fettabbau, Ausdauer später.

## App (`app/`)

Vite + React 19 + TypeScript, Tailwind v4 (Theme-Tokens in `src/index.css`), Dexie (IndexedDB), vite-plugin-pwa, Recharts, react-router. Farben schwarz/orange. Alle Daten lokal, Export/Import als JSON, Datenmodell mit Profilen und `updatedAt` für späteren Sync.

- `src/data/plan.ts` – der Plan als Daten (Woche 1–4 komplett, 5–16 Platzhalter). Planänderungen hier, nicht in Komponenten.
- `src/data/exercises.ts` – Übungsbibliothek; `bioforceNo` verweist auf Fotos in `public/img/bioforce/bf{NNN}_{start|end|pulley}.webp` (aus der Extreme-Anleitung, 457 × 644 px; Nummerierung folgt weiter der alten Anleitung in `docs/`).
- `src/lib/steps.ts` – Einheit → Schrittfolge für den geführten Modus.
- `src/lib/planEngine.ts` – Tageslogik, Challenge-Ziele, Progressionsvorschlag.
- `src/lib/dashboard.ts` – Kennzahlen für den Startbildschirm (`src/pages/Today.tsx`), ebenfalls reine Funktionen.
- `src/lib/stats.ts` – Auswertung als reine Funktionen (Sätze je Muskelgruppe, Wiederholungen, Benchmarks, Frequenz, Cardio); `src/pages/Stats.tsx` stellt nur dar. Diagramme: eine Achse pro Diagramm, eine Farbe (Akzent), keine zweite y-Achse.
- `src/pages/Workout.tsx` – geführter Modus (größte Datei). Trainingsdatum = Tag des Kurz-Checks, nicht das Plan-Datum aus der Route.
- `src/pages/FreeTraining.tsx` – freies Training (Route `/free`, `/free/:id`): einzelne Übungen ohne Plan-Einheit, Sätze hängen an einem Workout je Tag mit `sessionKey = 'frei'` (`FREE_SESSION_KEY` in `src/lib/workouts.ts`); zählt in Verlauf und Auswertung, nicht als Plan-Einheit (`isFreeWorkout()`).
- `src/pages/Photos.tsx` + `src/lib/photos.ts` – Foto-Check (Route `/photos`): Fortschrittsfotos in vier Posen als JPEG-Blob in der Dexie-Tabelle `photos` (DB-Version 2), Verkleinerung auf 1280 px beim Speichern, Termine = Montag der Wochen 1/5/9/13/17 mit Fenster ±3 Tage, eigene Sicherung (nicht im JSON-Export), hartes Löschen.
- `src/lib/bioforce.ts` – Skala lb ↔ kg. `src/components/UpdateBanner.tsx` – PWA-Update nur auf Knopfdruck (`registerType: 'prompt'`, nie zurück auf `autoUpdate`: ein automatischer Reload hat am 17.09.2026 die Tabelle `workouts` blockiert). `src/components/ErrorBoundary.tsx` – Fehleranzeige; Build-Kennung `__BUILD__` unter „Mehr“.

Befehle im Ordner `app`: `npm run dev`, `npm run build` (führt `tsc -b` aus), `npm run preview -- --host` (LAN-Test). Dev-Server für den Browser-Pane: `.claude/launch.json` → „app“.

## Konventionen

- TypeScript strikt (`verbatimModuleSyntax`, `erasableSyntaxOnly`, keine unbenutzten Variablen). Vor Abschluss immer `npx tsc -b` im Ordner `app`.
- `findSession()` und ähnliche Lookups in Komponenten mit `useMemo` kapseln (sonst Endlos-Rerender, siehe Workout.tsx).
- Bio-Force-Lasten: Die Geräteskala zeigt lb pro Seite (5–125, einstellbar in 2,5-lb-Rasten; `BF_STEP_LB` = Raste, `BF_PROGRESS_LB` = üblicher Steigerungsschritt 5 lb). Eingabe und Anzeige in lb, gespeichert wird `weightKg` (kg pro Seite); Umrechnung nur über `src/lib/bioforce.ts`.
- Supersätze: nie Bio-Force-Übungen mit `seat: 'on'` und `seat: 'off'` mischen; pro Einheit höchstens ein Sitz-Umbau, davor `SEAT_ON`/`SEAT_OFF` in `plan.ts` einfügen. Prüfen mit `node scripts/check-plan.mjs` im Ordner `app`.
- Dokumente in `docs/` sind die Quelle für Plan und Übungen; bei Änderungen Doku und `src/data` zusammen anpassen.
- Git-Repository: Zweig `main`, Remote `origin` = `https://github.com/rene-777/Fitnessapp.git` (öffentlich). `gh` ist installiert und angemeldet. Commits mit `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; Commit-Autor René <rene.sch@gmx.net>.
- Kie.ai (Bild- und Videogenerierung): MCP-Server `kie-ai` über `.mcp.json` → `app/scripts/kie-mcp.mjs` (startet `@felores/kie-ai-mcp-server`). API-Key nur als Windows-Benutzervariable `KIE_AI_API_KEY`, nie in Dateien des Repos.
- Hosting: **GitHub Pages**, live unter `https://rene-777.github.io/Fitnessapp/`. Jeder Push auf `main` deployt automatisch (`.github/workflows/deploy.yml`); Ergebnis prüfen mit `& "C:\Program Files\GitHub CLI\gh.exe" run list -R rene-777/Fitnessapp -L 1` (`gh` liegt evtl. nicht im PATH der Shell). Basispfad `/Fitnessapp/` gilt in Vite, Router, Manifest und Bildpfaden; neue statische Pfade immer mit `import.meta.env.BASE_URL` präfixen. Dev-Adresse: `http://localhost:5173/Fitnessapp/`.
