# Übergabe – Stand 17.09.2026

## Was fertig ist

- **Konzept und Recherche:** `Trainingskonzept.md` mit Studienlage (PubMed, Consensus, alle Quellen verlinkt), 16-Wochen-Architektur in 4 Blöcken mit Challenge-Wochen, alle Entscheidungen des Users dokumentiert (Abschnitt 5).
- **Block 1 komplett:** `Block1-Wochen1-4.md`, Start Montag 21.09.2026, Woche 1 mit Einstufung (10RM an der Bio Force, Max-Tests Push-Ups, Pull-Ups, Dips, Plank, 5-min-Burpees, Cooper-Test in Woche 2), Woche 4 Kraftausdauer-Challenge mit Formeln.
- **Übungsbibliothek:** `Uebungsbibliothek.md`, nach der offiziellen Finnlo-Anleitung (`BioForce-Bedienungsanleitung.pdf`, 110 Übungen). Fotos aller 110 Übungen extrahiert nach `app/public/img/bioforce/` (Start, Ende, Rollenposition, Index in `index.json`).
- **App Phase 1:** läuft, Build sauber, im Browser getestet. Läuft beim User bereits über WLAN (`npm run preview -- --host`) auf dem Android-Handy. PowerShell-Skriptsperre wurde vom User mit `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` gelöst.

## Unmittelbar nächster Schritt: echte installierbare App (HTTPS)

Ziel: `app/dist` auf einen statischen Hoster, damit die App auf dem Handy installierbar, offline-fähig und mit Wake Lock läuft.

Vorschlag Netlify Drop (kostenlos, ohne Build-Pipeline):
1. Im Ordner `app`: `npm run build`.
2. https://app.netlify.com/drop öffnen, Konto anlegen (User macht das selbst), Ordner `app/dist` in die Seite ziehen.
3. Adresse am Handy öffnen → Chrome-Menü „App installieren“.
4. Für Updates: erneut bauen und den `dist`-Ordner in derselben Site hochladen (Netlify: Site → Deploys → Drag-and-drop). Die PWA aktualisiert sich beim nächsten Öffnen.

Alternativen: Cloudflare Pages, GitHub Pages (dann Git-Repo nötig, `base` in `vite.config.ts` anpassen). Optional Passwortschutz bei Netlify.

Wichtig vor dem Umzug: Daten vom WLAN-Stand per Einstellungen → Exportieren sichern und in der installierten App importieren, weil die Adresse (Origin) wechselt und IndexedDB pro Origin getrennt ist.

## Danach: Phase 2 und 3

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
