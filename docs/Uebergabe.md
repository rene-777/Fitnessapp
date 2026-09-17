# Übergabe – Stand 17.09.2026

## Was fertig ist

- **Konzept und Recherche:** `Trainingskonzept.md` mit Studienlage (PubMed, Consensus, alle Quellen verlinkt), 16-Wochen-Architektur in 4 Blöcken mit Challenge-Wochen, alle Entscheidungen des Users dokumentiert (Abschnitt 5).
- **Block 1 komplett:** `Block1-Wochen1-4.md`, Start Montag 21.09.2026, Woche 1 mit Einstufung (10RM an der Bio Force, Max-Tests Push-Ups, Pull-Ups, Dips, Plank, 5-min-Burpees, Cooper-Test in Woche 2), Woche 4 Kraftausdauer-Challenge mit Formeln.
- **Übungsbibliothek:** `Uebungsbibliothek.md`, nach der offiziellen Finnlo-Anleitung (`BioForce-Bedienungsanleitung.pdf`, 110 Übungen). Fotos aller 110 Übungen extrahiert nach `app/public/img/bioforce/` (Start, Ende, Rollenposition, Index in `index.json`).
- **App Phase 1:** läuft, Build sauber, im Browser getestet. Läuft beim User bereits über WLAN (`npm run preview -- --host`) auf dem Android-Handy. PowerShell-Skriptsperre wurde vom User mit `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` gelöst.
- **Hosting (17.09.2026):** App ist live unter **https://rene-777.github.io/Fitnessapp/** (GitHub Pages, Repo `rene-777/Fitnessapp`, öffentlich). Basispfad `/Fitnessapp/` in Vite, Router, Manifest und Bildpfaden; `404.html` als SPA-Fallback; Workflow `.github/workflows/deploy.yml` deployt bei jedem Push auf `main`. GitHub CLI (`gh`) ist installiert und als `rene-777` angemeldet (`C:\Program Files\GitHub CLI\gh.exe`). Live geprüft: Unterpfade, Manifest, Icons, Übungsfotos, Service Worker. Der User hat die App am 17.09.2026 auf dem Android-Handy installiert, alles funktioniert. Lokale Entwicklung läuft unter `http://localhost:5173/Fitnessapp/`.

## Nächster Schritt: Phase 2 und 3

- **Auswertungs-Tab:** Volumen pro Muskelgruppe und Woche (primär 1, sekundär 0,5 Sätze; `MUSCLE_GROUPS` in `src/data/muscles.ts`), Gesamtwiederholungen pro Zeitraum (Burpees, Pull-Ups, Push-Ups), Bestleistungen und Benchmark-Verlauf (`BENCHMARK_LABELS` in `src/lib/workouts.ts`), Trainingsfrequenz, Herzfrequenz-Verlauf aus Cardio-Sätzen (`avgHr`).
- **Blöcke 2–4 als Daten** in `src/data/plan.ts`, nach Auswertung von Block 1 (Einstufungswerte). Konzept in `Trainingskonzept.md` Abschnitt 3 und Ausblick in `Block1-Wochen1-4.md` Abschnitt 7.
- Kurzversionen der Einheiten (30 min), Autoregulation bei Knie ≥ 4 (bisher nur Hinweis im Kurz-Check), Plan pausieren/verschieben (Weihnachtswoche = Woche 14).
- Optional: Cloud-Sync (Supabase), Polar-Import per Datei.

## Bekannte Kleinigkeiten

- Face Pulls und Pallof Press haben keine eigene Herstellerübung; Face Pulls zeigen das Foto von Nr. 68 (Delta-Rudern), Pallof Press hat kein Foto.
- Bei liegenden Beinübungen (Nr. 19–26) fehlt das „Ende“-Foto (im Handbuch nur ein Bild). Diese Übungen sind im Plan nicht enthalten.
- Der JS-Bundle ist ca. 800 kB (Recharts); Code-Splitting wäre eine spätere Optimierung.
- Chrome-Alert-Dialoge („Bitte einen Wert eintragen“) sind einfach gehalten; könnte durch Inline-Hinweise ersetzt werden.

## Was der User als Nächstes tun sollte

- Montag 21.09. mit Woche 1 starten, in der App oder notfalls mit der Log-Vorlage im Block-1-Dokument und später nachtragen.
- Vor Woche 1 die Bio-Force-Einstellungen für die Übungen einmal durchprobieren (Übungen-Tab, Fotos und Anleitung).
- Nach Woche 1 die Einstufungswerte melden, dann Block 2 ausarbeiten.
