# Übergabe – Stand 22.11.2026

Diese Datei hält den aktuellen Stand, die nächsten Schritte und die offenen Punkte. Die Chronik bis zum 17.11.2026 (wer was wann warum entschieden hat, Details zu einzelnen Funktionen) steht in `Uebergabe-Archiv.md`; dort nachschlagen, wenn eine frühere Entscheidung oder ein Detail gebraucht wird.

## Kurzfassung

**Stand 22.11.2026 (So, Abend vor Woche 10):** Übergangswoche 9 ausgewertet (Export `transformation16-2026-11-22.json`, Ergebnisse in `Block3-Wochen9-13.md` Abschnitt 5): alle fünf Einheiten gemacht, Accumulator am Sa 21.11. mit **41 (68 Burpees)**, laut Bemerkung nach schlechter Nacht, höchstens ein Level mehr möglich. Der User lag in der leichten Woche mehrfach über den Vorgaben (Kabel-Kniebeuge bis 70 lb × 8, RDL 125 lb, Schrägdrücken 35 lb × 12, Push-Ups 3 × 25); Beinstrecker 47,5 lb und Hammer-Curls wieder RIR 0; zwei Einheiten 67–70 min. **Rückmeldung des Users:** rechte Schulter und rechter Ellenbogen in Ruhe noch leicht spürbar, in Bewegung besser; Schrägdrücken in der neuen Position „weitgehend schmerzfrei“. Mobility-Check aus Woche 8 nicht gemacht (keine Zeit), Fotos macht er am Mo 23.11. vor dem Training. Die Pakete vom 17.11. (Bemerkungen, Rundenfeld, Latzug einarmig) passen am Handy. **Umgesetzt und deployt: Wochen 10–12** (`buildBlock3Week()` in `plan.ts`): Mo Beine (Kraft), Di Push (Aufbau), Mi Pull (Kraft), Do Cardio drinnen, Fr Ganzkörper + Power; Hauptübungen 4–6 Wdh. bei RIR 2–3 (Woche 10 mit 3, danach 4 Sätzen); Schrägdrücken gedeckelt auf 40/45/47,5 lb (freitags 35/40/42,5 lb als Technik-Sätze), Dips erst ab Woche 11 ohne Tempo, nichts über Kopf, Trizepsdrücken statt Trizeps über Kopf, Power über Kettlebell-Swings (8 kg), Pallof Press neu; **auf Wunsch des Users** Pull-Ups ohne Zusatzlast (erst ab 20 am Stück; 4 × 7–8, Ziel 4 × 8) und normale Goliaz-Push-Ups 3 × 25–30 im 3-Sekunden-Takt statt Defizit-Push-Ups (Ziel 100 am Stück); Beinstrecker gedeckelt auf 45 lb; Einheiten auf rund 60 min gekürzt. Zwei neue Tests in `plan.test.ts`, drei in `photos.test.ts` (62). Session am 22.11. gegen 21:25 beendet, Arbeitsbaum sauber, alles auf `origin/main` deployt; der User meldet sich nach Woche 10 mit neuem Export. **Woche 13 (Challenge) ist noch Platzhalter:** welche Drück-Tests möglich sind, hängt von der Schulter ab.

Arbeitsweise: Der User testet jede Änderung direkt am Handy (Update-Knopf) und meldet Auffälligkeiten. Getestete Änderungen dürfen ohne Rückfrage committet und gepusht werden (siehe Memory `feedback-commit-push-allowed`); in der Shell ist keine Git-Identität gesetzt, deshalb `git -c user.name="René" -c user.email="rene.sch@gmx.net" commit …`.

## Was fertig ist

- **Konzept und Recherche:** `Trainingskonzept.md` mit Studienlage (PubMed, Consensus, alle Quellen verlinkt), 16-Wochen-Architektur in 4 Blöcken mit Challenge-Wochen, alle Entscheidungen des Users dokumentiert (Abschnitt 5).
- **Block 1 komplett:** `Block1-Wochen1-4.md`, Woche 1 mit Einstufung (10RM an der Bio Force, Max-Tests Push-Ups, Pull-Ups, Dips, Plank, 5-min-Burpees, Cooper-Test in Woche 2), Woche 4 Kraftausdauer-Challenge mit Formeln.
- **Übungsbibliothek:** `Uebungsbibliothek.md` nach der Finnlo-Anleitung (110 Übungen). Fotos in `app/public/img/bioforce/` als WebP (457 × 644 px, zusammen 4,5 MB), aus der Anleitung der Extreme (`docs/BioForce-Bedienungsanleitung-NEU.pdf`, 73 MB, per `.gitignore` nur lokal, Quelle https://manuals.hammer.de/3841.pdf); Nummerierung folgt der alten Anleitung.
- **App Phase 1:** Heute, geführtes Training, Woche, Plan, Übungen, Nachtragen, Körper, Einstellungen mit Export/Import. Details in `App-Anleitung.md`.
- **App Phase 2:** Auswertungs-Tab „Analyse“ (`src/lib/stats.ts` + `src/pages/Stats.tsx`, Route `/stats`) und Startbildschirm als Dashboard (`src/lib/dashboard.ts` + `src/pages/Today.tsx`).
- **Hosting:** GitHub Pages, Repo `rene-777/Fitnessapp` (öffentlich). Basispfad `/Fitnessapp/` in Vite, Router, Manifest und Bildpfaden; `404.html` als SPA-Fallback; `.github/workflows/deploy.yml` deployt bei jedem Push auf `main` (ca. 1 min). GitHub CLI: `C:\Program Files\GitHub CLI\gh.exe` (evtl. nicht im PATH), angemeldet als `rene-777`. Deployment abwarten mit `gh run watch`. Lokale Entwicklung: `http://localhost:5173/Fitnessapp/`.

## Nächste Schritte

- **Nach Woche 10 oder 11 neuen Export auswerten:** Schulter und Ellenbogen (Nächte nach Di und Fr, Ruheschmerz), ob die Obergrenzen beim Schrägdrücken passen, Dauer der Einheiten (Ziel 60 min), Rundenwerte der Burpee-Intervalle (`roundReps`), Bemerkungen mitlesen.
- **Woche 13 (Challenge) ausarbeiten,** spätestens nach Woche 11: Accumulator, Pull-Ups, Rudern und Kniebeuge sicher; Schrägdrücken-5RM und Dips-Max nur bei ruhiger Schulter, nicht bis zum Versagen mit abgespreizten Armen. Mobility-Check gehört in Woche 13.
- **Mobility-Check aus Woche 8 ist offen** (keine Zeit); nicht drängen, in Woche 13 steht der nächste an.
- **Fotos:** der User macht sie am Mo 23.11. vor dem Training. **Fotoregel geändert (22.11., Wunsch des Users):** das Fenster eines Termins reicht jetzt vom Freitag davor bis zum Tag vor dem Fenster des nächsten Termins (`photoSchedule()` in `photos.ts`, Tests in `photos.test.ts`), verspätete Fotos zählen also zum zurückliegenden Termin. Beim nächsten Kontakt fragen, ob „Nach Block 2“ am Handy als erledigt erscheint.
- **Weihnachtswoche (Woche 14, Mo 21.12.):** der User pausiert sie bei Bedarf selbst (Wochenseite → „Woche pausieren“).
- **Seilverlängerung der Kabel-Kniebeuge:** der User verlängert weiter (Bandschlinge oder Kette statt vieler Karabiner; Ziel: in der tiefen Hocke liegen die Griffe auf Schulterhöhe und der Block liegt gerade noch auf). Wenn die Lösung steht, `exercises.ts` (`equipment`, `setup`, `tips`) und `Uebungsbibliothek.md` nachziehen.
- **Später, noch nicht beauftragt:** Kurzversionen der Einheiten (30 min), Autoregulation bei Knie ≥ 4 (bisher nur Hinweis im Kurz-Check), Cloud-Sync, Polar-Import per Datei, Vorlaufdauer des 3-2-1 je Übung einstellbar.

## Offene Punkte und bekannte Kleinigkeiten

- Urheberrecht: Herstellerfotos und die ältere Anleitung (`docs/BioForce-Bedienungsanleitung.pdf`) liegen im öffentlichen Repo. Dem User wurde angeboten, die PDF aus dem Repo zu nehmen; Entscheidung steht aus. Vor dem Entfernen fragen.
- Untergrenze der Skala: 5 lb angenommen; falls es eine Raste bei 2,5 lb gibt, `BF_MIN_LB` in `bioforce.ts` anpassen.
- Face Pulls und Pallof Press haben keine eigene Herstellerübung; Face Pulls zeigen das Foto von Nr. 68 (Delta-Rudern), Pallof Press Start und Rollen von Nr. 108.
- Bei liegenden Beinübungen (Nr. 19–26) gibt es nur ein Foto (kein „Ende“). Diese Übungen sind im Plan nicht enthalten.
- Die `confirm()`-Dialoge („Einheit verlassen?“, „Einheit beenden?“, „Training löschen?“) sind noch Browser-Dialoge; bei Bedarf durch eigene ersetzen.
- GitHub Actions warnt, dass `actions/checkout@v4`, `setup-node@v4` und `upload-artifact@v4` auf Node 20 zielen (läuft weiter, erzwungen auf Node 24); irgendwann die Versionen in `deploy.yml` anheben.
- Das Datum eines geführten Trainings ist der Tag des Kurz-Checks, nicht das Plan-Datum; `findWorkout()` fällt ohne Treffer für das Datum auf das jüngste Training derselben Einheit zurück; eine Einheit lässt sich also nicht zweimal an verschiedenen Tagen führen, ohne das alte Training zu löschen. Bisher gewollt.
- Im Dev-Browser (Browser-Pane) liegen alte Test-Trainings vom 22.09. und 23.09. sowie ein leeres freies Training vom 18.09.; betrifft nur die lokale Entwicklungsdatenbank.
- Freie Einträge vor dem Planstart (Woche 0) erscheinen in „Sätze pro Muskelgruppe“ nicht, weil die Wochenansicht bei Woche 1 beginnt; Verlauf und Bestwerte zeigen sie trotzdem.
