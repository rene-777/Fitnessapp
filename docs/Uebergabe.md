# Übergabe – Stand 17.09.2026

## Was fertig ist

- **Konzept und Recherche:** `Trainingskonzept.md` mit Studienlage (PubMed, Consensus, alle Quellen verlinkt), 16-Wochen-Architektur in 4 Blöcken mit Challenge-Wochen, alle Entscheidungen des Users dokumentiert (Abschnitt 5).
- **Block 1 komplett:** `Block1-Wochen1-4.md`, Start Montag 21.09.2026, Woche 1 mit Einstufung (10RM an der Bio Force, Max-Tests Push-Ups, Pull-Ups, Dips, Plank, 5-min-Burpees, Cooper-Test in Woche 2), Woche 4 Kraftausdauer-Challenge mit Formeln.
- **Übungsbibliothek:** `Uebungsbibliothek.md`, nach der offiziellen Finnlo-Anleitung (`BioForce-Bedienungsanleitung.pdf`, 110 Übungen). Fotos aller 110 Übungen extrahiert nach `app/public/img/bioforce/` (Start, Ende, Rollenposition, Index in `index.json`).
- **App Phase 1:** läuft, Build sauber, im Browser getestet. Läuft beim User bereits über WLAN (`npm run preview -- --host`) auf dem Android-Handy. PowerShell-Skriptsperre wurde vom User mit `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` gelöst.

## Unmittelbar nächster Schritt: GitHub Pages als installierbare App (HTTPS)

**Entschieden am 17.09.2026:** Hosting über GitHub Pages. Der User hat ein GitHub-Konto angelegt (Benutzername noch nicht bekannt, im nächsten Chat erfragen). Netlify ist damit vom Tisch.

Lokales Git-Repository existiert bereits (Zweig `main`, 2 Commits, Arbeitsbaum sauber, kein Remote). `.gitignore` schließt `node_modules`, `dist`, Logs und `.claude/settings.local.json` aus.

Ablauf im nächsten Chat:
1. GitHub-Benutzernamen erfragen. Repository `Fitnessapp` anlegen, **öffentlich** (GitHub Pages ist im kostenlosen Tarif nur für öffentliche Repos verfügbar; Trainingsdaten sind nie im Repo, nur Code und Plandokumente). Anlegen per `gh repo create` (falls `gh` installiert und eingeloggt) oder der User legt es im Browser an und nennt die URL.
2. Remote setzen und pushen: `git remote add origin https://github.com/<user>/Fitnessapp.git`, `git push -u origin main`.
3. `app/vite.config.ts`: `base: '/Fitnessapp/'` setzen, und in der PWA-Manifest-Konfiguration `start_url` und `scope` auf `/Fitnessapp/` sowie die Icon-Pfade relativ machen. React Router: `<BrowserRouter basename={import.meta.env.BASE_URL}>` in `src/App.tsx`. Bildpfade in `src/data/exercises.ts` (`/img/bioforce/...`) und Icon-Pfad in `index.html` mit `import.meta.env.BASE_URL` präfixen.
4. GitHub-Actions-Workflow `.github/workflows/deploy.yml`: bei Push auf `main` im Ordner `app` `npm ci` und `npm run build`, dann `actions/upload-pages-artifact` mit `app/dist` und `actions/deploy-pages`. Im Repo unter Settings → Pages die Quelle „GitHub Actions“ wählen.
5. SPA-Fallback: Beim Build eine Kopie von `dist/index.html` als `dist/404.html` ablegen (sonst 404 bei direktem Aufruf von Unterpfaden wie `/Fitnessapp/week`).
6. Adresse `https://<user>.github.io/Fitnessapp/` am Handy öffnen → Chrome-Menü „App installieren“. Updates kommen künftig automatisch mit jedem Push.

Wichtig vor dem Umzug: Daten vom WLAN-Stand in der App per Einstellungen → Exportieren sichern und in der installierten App importieren, weil die Adresse (Origin) wechselt und IndexedDB pro Origin getrennt ist.

Alternative, falls GitHub Pages doch nicht gewünscht: Netlify Drop (Ordner `app/dist` per Drag-and-drop, Konto nötig, Updates manuell).

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
