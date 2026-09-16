# App „Transformation 16“ – Anleitung und Stand

Stand: 17.09.2026 · Phase 1 fertig

## Was die App kann (Phase 1)

- **Heute:** zeigt die heutige Einheit mit Fokus und Dauer, Start-Button, Vorschau. Samstag = Puffer mit Liste der offenen Einheiten zum Nachholen. Vor dem Planstart Countdown.
- **Geführtes Training:** Kurz-Check (Schlaf, Muskelkater, Knie, Motivation), dann Schritt für Schritt: Warm-up mit Timer, Sätze mit Eingabe von Wiederholungen, kg pro Seite und RIR, Vorschlag aus der letzten Ausführung, Pausen-Countdown mit Signaltönen, Supersätze im Wechsel, Tests mit Benchmark-Speicherung, AMRAP mit Countdown und Zähler, Intervalle mit Arbeits- und Pausenphasen, Cardio mit Countdown und Eingabe von Distanz und Puls, Challenge-Block mit Tageszielen und Wochenstand. Fortschritt wird nach jedem Satz gespeichert, Abbrechen und später Fortsetzen ist möglich. Bildschirm bleibt im Training an (Wake Lock, nur über HTTPS).
- **Woche:** alle 7 Tage mit Status (geplant, begonnen, erledigt, offen), Blättern durch alle 16 Wochen.
- **Plan:** 4 Blöcke, 16 Wochen, Challenge-Wochenziele aus den Tests berechnet.
- **Übungen:** Bibliothek mit Suche, Muskelgruppen (primär orange, sekundär grau), Herstellerfotos der Bio Force (Start, Ende, Rollenposition), Geräteeinstellung, Ausführung, Hinweise, Kniehinweise. Pro Übung Bestwerte und Verlauf.
- **Nachtragen:** Einheit mit Datum und allen Sätzen im Nachhinein eintragen (auch Tests, dann werden die Benchmarks gesetzt).
- **Körper:** Gewicht und Taille mit Verlaufskurve, Kalorienbedarf nach Mifflin-St Jeor, Proteinziel.
- **Einstellungen:** Profil (Name, Geburtsjahr, Größe, Planstart, HF max), Signaltöne, Sprachansagen, mehrere Profile, Export und Import als JSON, alles löschen.

Noch nicht enthalten (Phase 2 und 3): Auswertungs-Tab mit Volumen pro Muskelgruppe, Gesamtwiederholungen pro Zeitraum, Herzfrequenz-Verlauf; Kurzversionen der Einheiten; Blöcke 2–4 als Daten.

## Wo die Daten liegen

Alle Daten bleiben im Browser des Geräts (IndexedDB). Kein Server, kein Konto. Sicherung: Einstellungen → Exportieren erzeugt eine JSON-Datei. Auf dem PC importieren, um dort auszuwerten. Neuere Einträge gewinnen beim Import.

Damit die Daten nicht verloren gehen: mindestens einmal pro Woche exportieren (z. B. in Dropbox). Der Browser kann lokale Daten löschen, wenn der Speicher knapp wird. Bei einer installierten Web-App passiert das praktisch nicht.

## Auf dem Handy nutzen: zwei Wege

### Weg A: sofort, über das Heimnetz (zum Testen)

Auf dem PC im Ordner `app`:

```bash
npm run build
```

```bash
npm run preview -- --host
```

Dann auf dem Android-Handy im selben WLAN die angezeigte Netzwerk-Adresse öffnen, z. B. `http://192.168.178.53:4173`. Chrome-Menü → „Zum Startbildschirm hinzufügen“.

Einschränkungen: Der PC muss laufen. Ohne HTTPS gibt es keinen Offline-Modus und keinen Wake Lock (Bildschirm bleibt nicht automatisch an; in den Android-Einstellungen die Bildschirmsperre auf 10 min stellen hilft).

### Weg B: empfohlen, als echte installierbare App (HTTPS)

Den Inhalt des Ordners `app/dist` auf einen statischen Hoster legen, z. B. Netlify Drop (Ordner per Drag-and-drop, kostenlos), Cloudflare Pages oder GitHub Pages. Die App enthält keinen Server und sendet keine Daten; die Trainingsdaten bleiben trotzdem nur auf dem Handy. Die Adresse ist öffentlich, aber ohne Link nicht auffindbar. Optional lässt sich bei Netlify ein Passwortschutz setzen.

Dann auf dem Handy die HTTPS-Adresse öffnen → „App installieren“. Ab dann: eigenes Icon, Vollbild, offline nutzbar, Bildschirm bleibt im Training an, Updates automatisch beim nächsten Öffnen.

## Entwicklung

```bash
cd app && npm install && npm run dev
```

Struktur:

- `src/data/exercises.ts` Übungsbibliothek (Muskeln, Beschreibung, Bio-Force-Nummer für Fotos)
- `src/data/plan.ts` Plan als Daten: Blöcke, Wochen, Einheiten, Abschnitte
- `src/lib/steps.ts` verwandelt eine Einheit in die Schrittfolge des geführten Modus
- `src/lib/planEngine.ts` Tageslogik, Challenge-Ziele, Progressionsvorschlag
- `src/db/` Dexie-Datenbank (Profile, Workouts, Sätze, Körperwerte, Benchmarks)
- `src/pages/` Bildschirme
- `public/img/bioforce/` 110 Herstellerübungen als Fotos (aus der Bedienungsanleitung, `docs/BioForce-Bedienungsanleitung.pdf`)
