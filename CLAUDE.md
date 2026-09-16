# Fitnessapp „Transformation 16“

Persönliches Projekt von René: 16-Wochen-Trainingsplan (Bodyweight + Finnlo Bio Force Kraftstation) und eine lokale Trainings-App (PWA) dazu. Sprache im Projekt und mit dem User: Deutsch.

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
- `src/data/exercises.ts` – Übungsbibliothek; `bioforceNo` verweist auf Fotos in `public/img/bioforce/bf{NNN}_{start|end|pulley}`.
- `src/lib/steps.ts` – Einheit → Schrittfolge für den geführten Modus.
- `src/lib/planEngine.ts` – Tageslogik, Challenge-Ziele, Progressionsvorschlag.
- `src/pages/Workout.tsx` – geführter Modus (größte Datei).

Befehle im Ordner `app`: `npm run dev`, `npm run build` (führt `tsc -b` aus), `npm run preview -- --host` (LAN-Test). Dev-Server für den Browser-Pane: `.claude/launch.json` → „app“.

## Konventionen

- TypeScript strikt (`verbatimModuleSyntax`, `erasableSyntaxOnly`, keine unbenutzten Variablen). Vor Abschluss immer `npx tsc -b` im Ordner `app`.
- `findSession()` und ähnliche Lookups in Komponenten mit `useMemo` kapseln (sonst Endlos-Rerender, siehe Workout.tsx).
- Bio-Force-Lasten immer in kg pro Seite.
- Dokumente in `docs/` sind die Quelle für Plan und Übungen; bei Änderungen Doku und `src/data` zusammen anpassen.
- Git-Repository lokal vorhanden (Zweig `main`), noch kein Remote. Commits mit `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; Commit-Autor René <rene.sch@gmx.net>.
- Hosting-Entscheidung: **GitHub Pages** (User hat GitHub-Konto). Ablauf steht in `docs/Uebergabe.md`. Nach dem Umzug auf Pages gilt der Basispfad `/Fitnessapp/` in Vite, Router, Manifest und Bildpfaden.
