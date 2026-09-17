# App „Transformation 16“ – Anleitung und Stand

Stand: 17.09.2026 · Phase 1 fertig

## Was die App kann (Phase 1)

- **Heute:** zeigt die heutige Einheit mit Fokus und Dauer, Start-Button, Vorschau. Samstag = Puffer mit Liste der offenen Einheiten zum Nachholen. Vor dem Planstart Countdown.
- **Geführtes Training:** Kurz-Check (Schlaf, Muskelkater, Knie, Motivation), dann Schritt für Schritt: Warm-up mit Timer, Sätze mit Eingabe von Wiederholungen, Bio-Force-Skalenwert (lb pro Seite, kg wird daneben angezeigt) und RIR, Vorschlag aus der letzten Ausführung, Pausen-Countdown mit Signaltönen, Supersätze im Wechsel, Umbau-Hinweis als eigener Schritt (Sitz ab- oder anbauen, höchstens einmal pro Einheit), Tests mit Benchmark-Speicherung, AMRAP mit Countdown und Zähler, Intervalle mit Arbeits- und Pausenphasen, Cardio mit Countdown und Eingabe von Distanz und Puls, Challenge-Block mit Tageszielen und Wochenstand. Fortschritt wird nach jedem Satz gespeichert, Abbrechen und später Fortsetzen ist möglich. Bildschirm bleibt im Training an (Wake Lock, nur über HTTPS).
- **Vorlauf 3-2-1:** Bei allem, was auf Zeit läuft (AMRAP und Max-Tests auf Zeit, Intervalle, Cooper-Test, Halte-Timer, Test-Stoppuhr, Challenge), zählt die App nach dem Tipp auf „Start“ erst 3-2-1 mit Pieptönen herunter, dann kommt das Startsignal und die Zeit läuft.
- **Einheit ansehen:** Vorschau aller Übungen. Ist zu der Einheit schon ein Training gespeichert (begonnen oder erledigt), steht dort „Dieses Training löschen“: entfernt das Training samt Sätzen und Testwerten, danach lässt sich die Einheit neu starten. Die angezeigte Dauer läuft vom Kurz-Check („Los geht's“) bis zum Beenden, inklusive aller Pausen; über 180 min gilt sie als unplausibel und wird bis zum letzten gespeicherten Satz gerechnet.
- **Woche:** alle 7 Tage mit Status (geplant, begonnen, erledigt, offen), Blättern durch alle 16 Wochen.
- **Plan:** 4 Blöcke, 16 Wochen, Challenge-Wochenziele aus den Tests berechnet.
- **Übungen:** Bibliothek mit Suche, Muskelgruppen (primär orange, sekundär grau), Herstellerfotos der Bio Force (Start, Ende, Rollenposition; Tipp auf ein Foto vergrößert es), Chip „Sitz angebracht“ oder „Sitz entfernt“, Geräteeinstellung, Ausführung, Hinweise, Kniehinweise. Pro Übung Bestwerte und Verlauf.
- **Nachtragen:** Einheit mit Datum und allen Sätzen im Nachhinein eintragen (auch Tests, dann werden die Benchmarks gesetzt).
- **Körper:** Gewicht und Taille mit Verlaufskurve, Kalorienbedarf nach Mifflin-St Jeor, Proteinziel.
- **Analyse (Auswertung):** Trainingsfrequenz je Woche (erledigt/geplant, Tipp auf eine Woche wählt sie aus), Sätze pro Muskelgruppe für die gewählte Woche mit Vorwochen-Strich (Hauptmuskel 1 Satz, Hilfsmuskel 0,5; nur Kraftsätze und Max-Tests), Wiederholungen gesamt für Burpees, Push-Ups, Pull-Ups, Dips und Kniebeugen (je Woche und Summe, inklusive AMRAP und Challenge), Benchmarks mit Verlauf ab dem zweiten Test, schwerste Sätze an der Bio Force (Start → Bestwert in lb), Cardio (Ø Puls, Tempo, Tabelle) und Verlauf des Kurz-Checks (Knie, Schlaf).
- **Einstellungen:** Profil (Name, Geburtsjahr, Größe, Planstart, HF max), Signaltöne, Sprachansagen, mehrere Profile, Export und Import als JSON, alles löschen.

Noch nicht enthalten (Phase 2 und 3): Auswertungs-Tab mit Volumen pro Muskelgruppe, Gesamtwiederholungen pro Zeitraum, Herzfrequenz-Verlauf; Kurzversionen der Einheiten; Blöcke 2–4 als Daten.

## Wo die Daten liegen

Alle Daten bleiben im Browser des Geräts (IndexedDB). Kein Server, kein Konto. Sicherung: Einstellungen → Exportieren erzeugt eine JSON-Datei. Auf dem PC importieren, um dort auszuwerten. Neuere Einträge gewinnen beim Import.

Damit die Daten nicht verloren gehen: mindestens einmal pro Woche exportieren (z. B. in Dropbox). Der Browser kann lokale Daten löschen, wenn der Speicher knapp wird. Bei einer installierten Web-App passiert das praktisch nicht.

## Auf dem Handy nutzen: zwei Wege

### Weg A: über das Heimnetz (nur noch zum Testen)

Auf dem PC im Ordner `app`:

```bash
npm run build
```

```bash
npm run preview -- --host
```

Dann auf dem Android-Handy im selben WLAN die angezeigte Netzwerk-Adresse öffnen, z. B. `http://192.168.178.53:4173/Fitnessapp/`. Chrome-Menü → „Zum Startbildschirm hinzufügen“.

Einschränkungen: Der PC muss laufen. Ohne HTTPS gibt es keinen Offline-Modus und keinen Wake Lock (Bildschirm bleibt nicht automatisch an; in den Android-Einstellungen die Bildschirmsperre auf 10 min stellen hilft).

### Weg B: als echte installierbare App über GitHub Pages (eingerichtet, Standard)

Adresse: **https://rene-777.github.io/Fitnessapp/**

Das Projekt liegt im öffentlichen GitHub-Repository `rene-777/Fitnessapp`. Ein GitHub-Actions-Workflow (`.github/workflows/deploy.yml`) baut die App bei jedem Push auf `main` und veröffentlicht sie unter dieser Adresse. Die App enthält keinen Server und sendet keine Daten; die Trainingsdaten bleiben nur auf dem Handy. Öffentlich sind nur Code und Plandokumente.

Auf dem Handy die Adresse in Chrome öffnen → Chrome-Menü „App installieren“. Ab dann: eigenes Icon, Vollbild, offline nutzbar, Bildschirm bleibt im Training an, Updates nach jedem Push: Beim Öffnen erscheint oben der Balken „Neue Version verfügbar“, ein Tipp auf „Jetzt aktualisieren“ lädt sie (nie automatisch und nie im laufenden Training). Die laufende Version steht unter „Mehr“ ganz unten.

Vor dem Umzug von Weg A auf Weg B: in der WLAN-Version Einstellungen → Exportieren, in der installierten App Importieren. Die beiden Adressen haben getrennte Datenbanken.

Update veröffentlichen: Änderungen committen und `git push`. Der Workflow läuft ca. 1 Minute; Status mit `gh run list` oder im Repo unter „Actions“.

## Wenn etwas hängt

- Bleibt der Trainingsstart bei „Lade …“ stehen, erscheint nach 8 Sekunden eine Fehlermeldung mit „Erneut versuchen“. Hilft das nicht: App komplett schließen (aus der Liste der letzten Apps wischen) und neu öffnen. Die Daten bleiben erhalten.
- Welche Version läuft, steht unter „Mehr“ ganz unten (Build-Zeit in UTC).
- Dreht sich der Bildschirm trotz Hochformat-Sperre: App einmal deinstallieren und neu installieren (vorher exportieren).

## Entwicklung

```bash
cd app && npm install && npm run dev
```

Struktur:

- `src/data/exercises.ts` Übungsbibliothek (Muskeln, Beschreibung, Bio-Force-Nummer für Fotos)
- `src/data/plan.ts` Plan als Daten: Blöcke, Wochen, Einheiten, Abschnitte
- `src/lib/steps.ts` verwandelt eine Einheit in die Schrittfolge des geführten Modus
- `src/lib/planEngine.ts` Tageslogik, Challenge-Ziele, Progressionsvorschlag
- `src/lib/bioforce.ts` Umrechnung Bio-Force-Skala (lb pro Seite) und kg
- `src/components/UpdateBanner.tsx` PWA-Update auf Knopfdruck, `src/components/ErrorBoundary.tsx` Fehleranzeige
- `src/db/` Dexie-Datenbank (Profile, Workouts, Sätze, Körperwerte, Benchmarks)
- `src/pages/` Bildschirme
- `public/img/bioforce/` 110 Herstellerübungen als Fotos (WebP, 457 × 644 px, aus der Anleitung der Bio Force Extreme; Nummerierung nach `docs/BioForce-Bedienungsanleitung.pdf`)
