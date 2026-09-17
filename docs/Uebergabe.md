# Übergabe – Stand 17.09.2026 (abends)

## Kurzfassung

Die App ist live unter **https://rene-777.github.io/Fitnessapp/**, auf dem Android-Handy des Users installiert und nach einer Feedback-Runde startklar für Woche 1 (Start Montag 21.09.2026). Arbeitsbaum sauber, alles auf `origin/main` gepusht. Nächstes Arbeitspaket: **Auswertungs-Tab (Phase 2)**.

## Was fertig ist

- **Konzept und Recherche:** `Trainingskonzept.md` mit Studienlage (PubMed, Consensus, alle Quellen verlinkt), 16-Wochen-Architektur in 4 Blöcken mit Challenge-Wochen, alle Entscheidungen des Users dokumentiert (Abschnitt 5).
- **Block 1 komplett:** `Block1-Wochen1-4.md`, Woche 1 mit Einstufung (10RM an der Bio Force, Max-Tests Push-Ups, Pull-Ups, Dips, Plank, 5-min-Burpees, Cooper-Test in Woche 2), Woche 4 Kraftausdauer-Challenge mit Formeln.
- **Übungsbibliothek:** `Uebungsbibliothek.md` nach der Finnlo-Anleitung (110 Übungen). Fotos aller Übungen in `app/public/img/bioforce/` als WebP (457 × 644 px, zusammen 4,5 MB).
- **App Phase 1:** Heute, geführtes Training, Woche, Plan, Übungen, Nachtragen, Körper, Einstellungen mit Export/Import. Details in `App-Anleitung.md`.
- **Hosting:** GitHub Pages, Repo `rene-777/Fitnessapp` (öffentlich). Basispfad `/Fitnessapp/` in Vite, Router, Manifest und Bildpfaden; `404.html` als SPA-Fallback; `.github/workflows/deploy.yml` deployt bei jedem Push auf `main` (ca. 1 min). GitHub CLI ist installiert und als `rene-777` angemeldet (`C:\Program Files\GitHub CLI\gh.exe`, liegt evtl. nicht im PATH). Lokale Entwicklung: `http://localhost:5173/Fitnessapp/`.

## Was in der Session vom 17.09.2026 passiert ist

1. **GitHub Pages eingerichtet**, App am Handy installiert.
2. **Feedback nach dem ersten Test am Gerät umgesetzt:**
   - Gerät ist die **Bio Force Extreme**. Die Skala an den Schwingarmen zeigt **lb pro Seite, 5–125 in 5er-Rasten** (vom User abgelesen, von beiden Anleitungen bestätigt). Eingabe und Anzeige in lb, gespeichert wird weiter `weightKg` (Umrechnung nur in `src/lib/bioforce.ts`). Progression = eine Raste (+5 lb).
   - **Supersätze neu sortiert (Woche 1–4):** nie Übungen mit und ohne Sitz im selben Supersatz, höchstens ein Sitz-Umbau pro Einheit, Umbau als eigener Schritt (`SEAT_ON`/`SEAT_OFF` in `plan.ts`, Feld `seat` in `exercises.ts`, Chip auf jeder Übungskarte). Übungen, Satzzahlen und Dauer unverändert. Prüflogik: je Supersatz alle `seat`-Werte gleich, je Einheit max. ein Wechsel mit vorangestelltem Hinweis.
   - „Fliegende nach oben“ heißt jetzt **„Incline Cable Fly“** (ID bleibt `fliegende-oben`). Der User bevorzugt gängige englische Namen statt konstruierter deutscher.
   - RIR: Vorschlagstext und Beschriftung klarer („wie viele wären noch gegangen?“), fehlende RIR-Angaben (Face Pulls u. a.) auf 1–2 ergänzt.
   - Fotos per Tipp vergrößerbar (Lightbox mit Zurück/Weiter).
   - Hochformat erzwungen (Manifest `portrait-primary` plus `screen.orientation.lock`). Rückmeldung des Users, ob es am Handy wirkt, steht noch aus.
3. **Fotos in hoher Auflösung:** aus der Anleitung der Extreme (`docs/BioForce-Bedienungsanleitung-NEU.pdf`, 73 MB, per `.gitignore` nur lokal, Quelle https://manuals.hammer.de/3841.pdf). Die PDF ist in Druckbogen-Reihenfolge gespeichert und verteilt die Übungen anders auf die Seiten, deshalb Zuordnung per Bildinhalt (Fotos) bzw. per Markierungspunkten (Rollen-Diagramme). Nummerierung folgt weiter der alten Anleitung.
4. **Vorfall „Lade …“:** Nach einem Update hing der Trainingsstart am Handy, bis die App komplett neu gestartet wurde. Vermutete Ursache: automatischer Reload durch das PWA-Update während einer Datenbank-Aktion (blockierte Tabelle `workouts`); nicht mehr beweisbar, am Desktop nicht reproduzierbar. Gegenmaßnahmen: PWA-Update nur noch auf Knopfdruck (`registerType: 'prompt'`, `UpdateBanner.tsx`, im Training ausgeblendet; live getestet), Fehler und 8-s-Zeitüberschreitung beim Trainingsstart werden angezeigt (`ErrorBoundary.tsx`), Build-Kennung unter „Mehr“.

## Nachtrag 17.09.2026 (spät): Rückmeldungen und Feinschliff

- **Rückmeldungen des Users:** Hochformat-Sperre wirkt, alle Fotos passen, „Lade …“ ist nicht mehr aufgetreten.
- **Pallof Press:** steht nicht in der Herstelleranleitung (Abschnitt Bauch & unterer Rücken = Nr. 106–110, geprüft). Zeigt jetzt Startfoto („Aufstellung“) und Rollen-Diagramm von Nr. 108, ohne Endfoto (`noEndPhoto` in `exercises.ts`), mit erklärendem Hinweis. Nr. 108 ist laut Hersteller mit angebrachtem Sitz fotografiert, Pallof Press geht also mit und ohne Sitz (in den Daten weiter `seat: 'off'`).
- **Kleine Übungen:** Feld `smallStep` in `exercises.ts` (Seitheben, Face Pulls, Reverse Flys). `suggestLoad()` schlägt dort erst dann eine Raste mehr vor, wenn alle Sätze 3 Wiederholungen über dem Ziel liegen (`SMALL_STEP_EXTRA_REPS`), sonst „gleiche Last, Wiederholungen steigern“.
- **Pflichtfeld-Hinweis:** Der Chrome-Alert beim Satz-Speichern ist durch einen Hinweis direkt am Feld ersetzt (`error`-Prop in `NumberInput.tsx`).

## Nächster Schritt: Phase 2 und 3

- **Auswertungs-Tab (als Nächstes):** Volumen pro Muskelgruppe und Woche (primär 1, sekundär 0,5 Sätze; `MUSCLE_GROUPS` in `src/data/muscles.ts`), Gesamtwiederholungen pro Zeitraum (Burpees, Pull-Ups, Push-Ups), Bestleistungen und Benchmark-Verlauf (`BENCHMARK_LABELS` in `src/lib/workouts.ts`), Trainingsfrequenz, Herzfrequenz-Verlauf aus Cardio-Sätzen (`avgHr`). Bio-Force-Lasten in der Auswertung als lb anzeigen (`loadText`), Volumen intern in kg. Mit Testdaten entwickeln, echte Daten kommen ab 21.09.
- **Blöcke 2–4 als Daten** in `src/data/plan.ts`, nach Auswertung von Block 1 (Einstufungswerte). Konzept in `Trainingskonzept.md` Abschnitt 3, Ausblick in `Block1-Wochen1-4.md` Abschnitt 7. Dabei die Sitz-Regel und das Geräte-Setup (Zugpunkt, Zubehör) von Anfang an mitdenken.
- Kurzversionen der Einheiten (30 min), Autoregulation bei Knie ≥ 4 (bisher nur Hinweis im Kurz-Check), Plan pausieren/verschieben (Weihnachtswoche = Woche 14).
- Optional: Cloud-Sync (Supabase), Polar-Import per Datei.

## Offene Punkte und bekannte Kleinigkeiten

- Sätze, die vor dem 17.09.2026 mit Bio-Force-Last eingetragen wurden, sind als kg gespeichert und erscheinen auf die nächste lb-Raste umgerechnet (nur Testdaten des Users).
- Urheberrecht: Herstellerfotos und die ältere Anleitung (`docs/BioForce-Bedienungsanleitung.pdf`) liegen im öffentlichen Repo. Dem User wurde angeboten, die PDF aus dem Repo zu nehmen; Entscheidung steht aus.
- Face Pulls und Pallof Press haben keine eigene Herstellerübung; Face Pulls zeigen das Foto von Nr. 68 (Delta-Rudern), Pallof Press Start und Rollen von Nr. 108.
- Bei liegenden Beinübungen (Nr. 19–26) gibt es nur ein Foto (kein „Ende“). Diese Übungen sind im Plan nicht enthalten.
- Der JS-Bundle ist ca. 800 kB (Recharts); Code-Splitting wäre eine spätere Optimierung.
- Die `confirm()`-Dialoge („Einheit verlassen?“, „Einheit beenden?“) sind noch Browser-Dialoge; bei Bedarf durch eigene ersetzen.

## Was der User als Nächstes tun sollte

- App einmal komplett schließen und neu öffnen, bis unter „Mehr“ eine Version ab „2026-09-17 17:58 UTC“ steht (Umstieg auf Update per Knopfdruck).
- Vor Woche 1 die Bio-Force-Einstellungen einmal durchprobieren (Übungen-Tab, Fotos und Anleitung), einmal den Flugmodus testen (Offline-Betrieb).
- Montag 21.09. mit Woche 1 starten. Einmal pro Woche Einstellungen → Exportieren (z. B. in die Dropbox).
- Nach Woche 1 die Einstufungswerte melden, dann wird Block 2 ausgearbeitet.
