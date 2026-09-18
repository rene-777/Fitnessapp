# Übergabe – Stand 18.09.2026

## Kurzfassung

Die App ist live unter **https://rene-777.github.io/Fitnessapp/**, auf dem Android-Handy des Users installiert und startklar für Woche 1 (Start Montag 21.09.2026). Phase 1 (geführtes Training) und Phase 2 (Auswertungs-Tab, Dashboard) sind fertig. Arbeitsbaum sauber, alles auf `origin/main` gepusht und deployt. Nächstes großes Arbeitspaket: **Blöcke 2–4**, sobald die Einstufungswerte aus Woche 1 vorliegen. Bis dahin: Rückmeldungen des Users vom Handy abarbeiten.

Arbeitsweise: Der User testet jede Änderung direkt am Handy (Update-Knopf) und meldet Auffälligkeiten. Getestete Änderungen dürfen ohne Rückfrage committet und gepusht werden (siehe Memory `feedback-commit-push-allowed`); in der Shell ist keine Git-Identität gesetzt, deshalb `git -c user.name="René" -c user.email="rene.sch@gmx.net" commit …`.

## Was fertig ist

- **Konzept und Recherche:** `Trainingskonzept.md` mit Studienlage (PubMed, Consensus, alle Quellen verlinkt), 16-Wochen-Architektur in 4 Blöcken mit Challenge-Wochen, alle Entscheidungen des Users dokumentiert (Abschnitt 5).
- **Block 1 komplett:** `Block1-Wochen1-4.md`, Woche 1 mit Einstufung (10RM an der Bio Force, Max-Tests Push-Ups, Pull-Ups, Dips, Plank, 5-min-Burpees, Cooper-Test in Woche 2), Woche 4 Kraftausdauer-Challenge mit Formeln.
- **Übungsbibliothek:** `Uebungsbibliothek.md` nach der Finnlo-Anleitung (110 Übungen). Fotos in `app/public/img/bioforce/` als WebP (457 × 644 px, zusammen 4,5 MB), aus der Anleitung der Extreme (`docs/BioForce-Bedienungsanleitung-NEU.pdf`, 73 MB, per `.gitignore` nur lokal, Quelle https://manuals.hammer.de/3841.pdf); Nummerierung folgt der alten Anleitung.
- **App Phase 1:** Heute, geführtes Training, Woche, Plan, Übungen, Nachtragen, Körper, Einstellungen mit Export/Import. Details in `App-Anleitung.md`.
- **App Phase 2:** Auswertungs-Tab „Analyse“ (`src/lib/stats.ts` + `src/pages/Stats.tsx`, Route `/stats`) und Startbildschirm als Dashboard (`src/lib/dashboard.ts` + `src/pages/Today.tsx`).
- **Hosting:** GitHub Pages, Repo `rene-777/Fitnessapp` (öffentlich). Basispfad `/Fitnessapp/` in Vite, Router, Manifest und Bildpfaden; `404.html` als SPA-Fallback; `.github/workflows/deploy.yml` deployt bei jedem Push auf `main` (ca. 1 min). GitHub CLI: `C:\Program Files\GitHub CLI\gh.exe` (evtl. nicht im PATH), angemeldet als `rene-777`. Deployment abwarten mit `gh run watch`. Lokale Entwicklung: `http://localhost:5173/Fitnessapp/`.

## Was am 17.09.2026 passiert ist

### Tagsüber (erste Session)

1. **GitHub Pages eingerichtet**, App am Handy installiert.
2. **Feedback nach dem ersten Test am Gerät:** Gerät ist die **Bio Force Extreme**, Skala in **lb pro Seite**. Eingabe und Anzeige in lb, gespeichert wird `weightKg` (Umrechnung nur in `src/lib/bioforce.ts`). **Supersätze neu sortiert:** nie Übungen mit und ohne Sitz im selben Supersatz, höchstens ein Sitz-Umbau pro Einheit (`SEAT_ON`/`SEAT_OFF` in `plan.ts`, Feld `seat` in `exercises.ts`, Prüfskript `scripts/check-plan.mjs`). „Incline Cable Fly“ statt „Fliegende nach oben“ (der User bevorzugt gängige englische Namen). RIR-Texte klarer. Fotos per Tipp vergrößerbar. Hochformat erzwungen.
3. **Vorfall „Lade …“:** Nach einem Update hing der Trainingsstart, bis die App neu gestartet wurde. Vermutete Ursache: automatischer Reload durch das PWA-Update während einer Datenbank-Aktion. Gegenmaßnahmen: PWA-Update nur auf Knopfdruck (`registerType: 'prompt'`, `UpdateBanner.tsx`), Fehler und 8-s-Zeitüberschreitung werden angezeigt (`ErrorBoundary.tsx`), Build-Kennung unter „Mehr“. Seitdem nicht mehr aufgetreten.

### Abends (zweite Session)

Rückmeldungen des Users: Hochformat-Sperre wirkt, alle Fotos passen, „Lade …“ ist nicht mehr aufgetreten. Danach umgesetzt, alles live:

- **Pallof Press:** steht nicht in der Herstelleranleitung (Bauch & unterer Rücken = Nr. 106–110, geprüft). Zeigt Startfoto („Aufstellung“) und Rollen-Diagramm von Nr. 108, ohne Endfoto (`noEndPhoto` in `exercises.ts`), mit erklärendem Hinweis. Nr. 108 ist laut Hersteller mit angebrachtem Sitz fotografiert, Pallof Press geht also mit und ohne Sitz (in den Daten weiter `seat: 'off'`); gibt in Block 2–4 Spielraum beim Sitz-Umbau.
- **Skala in 2,5-lb-Rasten:** vom User am Gerät festgestellt (Beschriftung in 5ern; die Anleitung sagt dazu nichts). `BF_STEP_LB = 2.5` (Eingabe, Rundung), `BF_PROGRESS_LB = 5` (Steigerungsvorschlag), Anzeige über `fmtLb` („12,5 lb“). Untergrenze weiter 5 lb (Annahme, vom User noch nicht bestätigt).
- **Kleine Übungen:** Feld `smallStep` (Seitheben, Face Pulls, Reverse Flys). `suggestLoad()` schlägt dort nur +2,5 lb vor, und erst, wenn alle Sätze 2 Wiederholungen über dem Ziel liegen (`SMALL_STEP_EXTRA_REPS`). Alle anderen Übungen: +5 lb mit Hinweis auf die halbe Stufe.
- **Pflichtfeld-Hinweis** direkt am Feld statt Chrome-Alert (`error`-Prop in `NumberInput.tsx`).
- **Training löschen und Dauer:** `deleteWorkout()` in `workouts.ts` (Soft-Delete von Training, Sätzen, Benchmarks) mit Knopf in `SessionPreview.tsx`. `startedAt` wird erst beim Abschluss des Kurz-Checks gesetzt; `finishWorkout()` rechnet bei über 180 min (`MAX_DURATION_MIN`) nur bis zum letzten Satz oder speichert keine Dauer. Die Dauer ist Start bis Ende inklusive Pausen.
- **Fehler bei Max-Tests mit Folgesätzen behoben (Dips, Pull-Ups):** Test und 1. Folgesatz hatten denselben Schlüssel (Übung + Label + Satz 1); der Testwert stand im Feld, und das Speichern überschrieb den Test-Satz. Folgesätze haben jetzt das Label „D danach“ (`steps.ts`).
- **Ziehen zum Neuladen abgeschaltet:** `overscroll-behavior-y: none` jetzt auch auf `html` (Chrome wertet es nur am Wurzelelement aus). Vom User am Handy bestätigt. Ein Neuladen verliert ohnehin nichts: Sätze liegen sofort in IndexedDB, ein laufendes Training springt zum gespeicherten Schritt (`stepIndex`); nur ein beendetes Training öffnet bei Schritt 1.
- **Auswertungs-Tab:** Trainingsfrequenz, Sätze pro Muskelgruppe (primär 1, sekundär 0,5; nur Kraftsätze und Max-Tests; Vorwochen-Strich), Wiederholungen gesamt (Burpees, Push-Ups, Pull-Ups, Dips, Kniebeugen), Benchmarks mit Verlauf, schwerste Sätze an der Bio Force, Cardio (Puls, Tempo), Kurz-Check (Knie, Schlaf). Entwickelt mit generierten Testdaten über 4 Wochen (im Dev-Browser erzeugt und wieder gelöscht). Beim Nachtragen speichern AMRAPs mit mehreren Übungen jetzt auch die Wiederholungssummen (`-sum`).
- **3-2-1-Vorlauf** (`GetReady` in `Timer.tsx`): vor AMRAP/Max-Tests auf Zeit, Intervallen (nur vor Runde 1), Cardio-Countdown, Halte-Timer, Test-Stoppuhr (`Stopwatch leadIn`) und Challenge-Block (Stoppuhr startet danach von selbst, `autoStart`). Nicht vor Pausen- und Warm-up-Timern.
- **Dashboard:** Der User hat aus drei Entwürfen „A Fokus-Ring“ gewählt, ergänzt um „Letztes Mal“ und „Neuer Bestwert“ (aus B) und den Meilenstein-Countdown (aus C). Fortschrittsring, Heute-Karte, Wochenstreifen, Meilenstein, drei Kennzahlen (Einheiten in Folge, Gewicht, Knie), Bestwert. Geprüft mit Testdaten (Trainingstag in Woche 4) und im Zustand vor dem Planstart. Rückmeldung des Users zum Aussehen am Handy steht noch aus.

## Was am 18.09.2026 passiert ist

Der User hat die Dienstag-Einheit (Beine + Hüfte) probeweise durchgemacht. Zwei Rückmeldungen, beide umgesetzt und live:

- **Split Squat ist jetzt eine Bio-Force-Übung** (`loadType: 'bioforce'`, `seat: 'off'`, Nr. 2: Handgriffe an den unteren Haken, Griffe auf Schulterhöhe). Der User macht sie am Gerät, das Feld zeigte aber kg. Jetzt lb-Skala in 2,5er-Rasten wie überall; ohne Last bleibt das Feld leer. Plan-Hinweis Woche 1 „Leicht starten, notfalls ohne Last“, Doku angepasst. Geprüft: Hammer-Curls (Kurzhanteln laut Plan), Step-Ups und Kettlebell-Swing (Kettlebell 8 kg) bleiben bewusst in kg (`loadType: 'extern'`); Bizeps-Curls am Kabel sind bereits lb.
- **Hammer-Curls am Kabel** (Nr. 83, `loadType: 'bioforce'`, `seat: 'off'`): der User macht sie am Gerät, nicht mit Kurzhanteln. In kg bleiben nur noch Step-Ups und Kettlebell-Swing.
- **Frage des Users zum Mittwoch (Pull):** warum Rudern stehend, einarmiges Rudern, Latzug und Pull-Ups nebeneinander. Antwort: zwei Zugrichtungen (vertikal Lat, horizontal oberer Rücken und hintere Schulter), der Tag ist wegen der Schwachstelle hintere Schulter bewusst horizontal-lastig; Latzug liefert dosierbares Lat-Volumen nach dem Max-Test, einarmiges Rudern mehr Bewegungsweg und Seitenausgleich. Echte Überlappung: Rudern stehend und einarmig. **Beschluss:** Block 1 bleibt; nach Woche 1 die Dauer des Mittwochs prüfen. Wird sie zu lang, D1 (einarmiges Rudern) durch Face Pulls ersetzen (ca. 8 min kürzer, Betonung hintere Schulter bleibt).
- **Trainingsdatum = echter Tag:** Der User sah im Verlauf von Seitheben einen Eintrag „Mo., 21.09.“ (Test am Handy am 17./18.09.). Ursache: `Workout.tsx` übernahm das Plan-Datum aus der Route. Jetzt setzt der Abschluss des Kurz-Checks `date = today()` (auch beim Überspringen des Checks); Sätze übernehmen es über `saveSet(w, …)`. Lookup bleibt über `findWorkout()` (Schlüssel, Fallback jüngstes Training). Nachtragen und freies Training hatten schon das gewählte Datum. Die fehlende lb-Angabe in dem Eintrag: Feld war beim Test leer gelassen, Last ist an der Bio Force absichtlich optional (Split Squat ohne Last).
- **Rückmeldung des Users:** Dashboard vorerst ohne Anpassungsbedarf (nochmal ansehen, sobald die Woche läuft). Analyse-Tab passt; Wunsch: Max-Zeiten statischer Übungen (Plank) unter Benchmarks. Das war schon drin, jetzt lesbarer: Zeit-Tests erscheinen als m:ss (`fmtSec`), die Einheit kommt aus dem gespeicherten Testwert (`BenchmarkSeries.unit`) statt aus dem Schlüssel, Differenz in Sekunden, Dashboard-Bestwert ebenfalls m:ss. Spätere Zeit-Tests (Wall Sit, Side Plank, Dead Hang in Block 2–4) laufen damit automatisch richtig. Geprüft mit zwei Test-Benchmarks im Dev-Browser, wieder gelöscht.
- **Freies Training** (`src/pages/FreeTraining.tsx`, Routen `/free` und `/free/:id`; Einstieg über „Mehr“, die Übungsseite und einen Link auf „Einheit nachtragen“; auf Wunsch des Users so benannt, nicht „Übung nachtragen“): einzelne Übungen ohne Plan-Einheit eintragen. Bei Halteübungen (`unit: 'seconds'`) gibt es je Satz „Stoppuhr starten“ (`HoldStopwatch`, `Stopwatch leadIn` mit 3-2-1-Vorlauf), die gestoppte Zeit landet gerundet im Sekundenfeld. Mehrere Übungen nacheinander: Speichern gibt die Übungswahl wieder frei (Meldung oben, `done`), darunter die Tagesliste aller freien Sätze (`daySets` über den Index `date`, gruppiert je Übung, „+ Satz“ wählt die Übung erneut, Löschen je Satz). Sätze hängen an einem „Freien Training“ je Tag (`getOrCreateFreeWorkout()`, `sessionKey = FREE_SESSION_KEY = 'frei'`, `segmentLabel = 'frei'`, Status fertig, `backfilled`). Freie Trainings sind in `frequencyByWeek()` und `totals()` ausgenommen (`isFreeWorkout()`), Sätze zählen überall sonst normal mit. Schalter „Als Max-Test speichern“ für Übungen in `EXERCISE_BENCHMARK` (Push-Ups, Pull-Ups, Dips, Plank), bester Satz wird Benchmark. `deleteSet()` löscht einen Satz weich und den Testwert desselben Trainings mit; Löschknöpfe auf der Seite „Freies Training“ (ohne Rückfrage) und im Verlauf der Übungsseite (✕, mit `confirm()`). Geprüft im Dev-Browser mit Split Squat (lb) und Plank als Max-Test, Einträge wieder gelöscht.
- **Vorschau in der Pause** (`NextPreview` in `Workout.tsx`): Während der Pausen-Countdown läuft, stehen darunter die anstehenden Umbau-Hinweise (Sitz an/ab, orange hervorgehoben) und die nächste Übung mit Vorgabe, Muskeln, Gerät, Ausgangsposition und Fotos. Bei gleicher Übung nur „Gleiche Übung, kein Umbau“. Umbau-Hinweise, die in der Pause zu sehen waren, werden nach der Pause übersprungen (`upcoming` in `Workout.tsx`); folgt der Hinweis auf einen Schritt ohne Pause, erscheint er weiterhin als eigener Schritt.

## Nächste Schritte

- **Rückmeldungen des Users** zum Dashboard und zum Auswertungs-Tab am Handy (Größen, Reihenfolge, Karten). Mit echten Daten ab 21.09. prüfen, vor allem die Satz-Zählung je Muskelgruppe („Schultern“ fällt hoch aus, weil jede Drückübung die vordere Schulter halb mitzählt; bei Bedarf Gruppen feiner aufteilen).
- **Nach Woche 1:** Dauer des Mittwochs (Pull) ansehen; bei Bedarf D1 einarmiges Rudern → Face Pulls (Beschluss vom 18.09.).
- **Blöcke 2–4 als Daten** in `src/data/plan.ts`, nach Auswertung von Woche 1 (Einstufungswerte). Konzept in `Trainingskonzept.md` Abschnitt 3, Ausblick in `Block1-Wochen1-4.md` Abschnitt 7. Sitz-Regel und Geräte-Setup (Zugpunkt, Zubehör) von Anfang an mitdenken; 2,5-lb-Rasten für feinere Lastvorgaben nutzen.
- Kurzversionen der Einheiten (30 min), Autoregulation bei Knie ≥ 4 (bisher nur Hinweis im Kurz-Check), Plan pausieren/verschieben (Weihnachtswoche = Woche 14).
- Optional: Cloud-Sync (Supabase), Polar-Import per Datei, Vorlaufdauer des 3-2-1 je Übung einstellbar (z. B. länger beim Cooper-Test).

## Offene Punkte und bekannte Kleinigkeiten

- Urheberrecht: Herstellerfotos und die ältere Anleitung (`docs/BioForce-Bedienungsanleitung.pdf`) liegen im öffentlichen Repo. Dem User wurde angeboten, die PDF aus dem Repo zu nehmen; Entscheidung steht aus. Vor dem Entfernen fragen.
- Untergrenze der Skala: 5 lb angenommen; falls es eine Raste bei 2,5 lb gibt, `BF_MIN_LB` in `bioforce.ts` anpassen.
- Face Pulls und Pallof Press haben keine eigene Herstellerübung; Face Pulls zeigen das Foto von Nr. 68 (Delta-Rudern), Pallof Press Start und Rollen von Nr. 108.
- Bei liegenden Beinübungen (Nr. 19–26) gibt es nur ein Foto (kein „Ende“). Diese Übungen sind im Plan nicht enthalten.
- Der JS-Bundle ist ca. 840 kB (Recharts); Code-Splitting wäre eine spätere Optimierung.
- Die `confirm()`-Dialoge („Einheit verlassen?“, „Einheit beenden?“, „Training löschen?“) sind noch Browser-Dialoge; bei Bedarf durch eigene ersetzen.
- GitHub Actions warnt, dass `actions/checkout@v4`, `setup-node@v4` und `upload-artifact@v4` auf Node 20 zielen (läuft weiter, erzwungen auf Node 24); irgendwann die Versionen in `deploy.yml` anheben.
- Das Datum eines geführten Trainings ist der Tag des Kurz-Checks, nicht das Plan-Datum; `findWorkout()` fällt ohne Treffer für das Datum auf das jüngste Training derselben Einheit zurück; eine Einheit lässt sich also nicht zweimal an verschiedenen Tagen führen, ohne das alte Training zu löschen. Bisher gewollt.
- Im Dev-Browser (Browser-Pane) liegen alte Test-Trainings vom 22.09. und 23.09. sowie ein leeres freies Training vom 18.09.; betrifft nur die lokale Entwicklungsdatenbank.
- Freie Einträge vor dem Planstart (Woche 0) erscheinen in „Sätze pro Muskelgruppe“ nicht, weil die Wochenansicht bei Woche 1 beginnt; Verlauf und Bestwerte zeigen sie trotzdem.

## Was der User als Nächstes tun sollte

- Am Handy den Update-Knopf antippen, bis unter „Mehr“ eine Build-Kennung vom 17.09.2026 ab ca. 21:50 UTC steht, dann Dashboard und „Analyse“ ansehen.
- **Vor dem Start am Montag:** Einstellungen → „Alle Daten löschen“ (gemischte Test- und Echtdaten entfernen). Das Profil wird automatisch neu angelegt (René, 1970, 172 cm, Start 21.09.2026); nur Gewicht und Taille unter „Körper“ neu eintragen.
- Einmal den Flugmodus testen (Offline-Betrieb).
- Montag 21.09. mit Woche 1 starten. Einmal pro Woche Einstellungen → Exportieren (z. B. in die Dropbox).
- Nach Woche 1 die Einstufungswerte melden, dann wird Block 2 ausgearbeitet.
