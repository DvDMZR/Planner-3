# Changelog

## v0.85 (2026-05-19)

### Audit-Log (Verlauf)
- **Append-Merge bei Sync**: wenn ein zweiter Client gleichzeitig einen
  Audit-Eintrag schreibt, geht der eigene Eintrag nicht mehr verloren.
  Beim Übernehmen einer Remote-Version wird das lokale Log mit dem
  Remote-Log per Eintrags-ID vereinigt, nach Timestamp sortiert und auf
  500 Einträge gekürzt. Beide Clients konvergieren auf die volle Liste.
- Wipe-Schutz: ein Schrumpfen von `audit.json` auf 0 Einträge wird jetzt
  als Korruption gewertet und der Write abgebrochen.

## v0.84 (2026-05-19)

### Auslastung
- Wenn in einem Monat eine Woche mit ≥150 % geplant ist, erscheint
  ein 💢-Symbol in der Monats-Zelle (orange) bzw. ab ≥200 % rot –
  damit sieht man Doppelbuchungen, auch wenn der Monats-Durchschnitt
  durch sparsame andere Wochen unter 100 % bleibt. Gleiche Anzeige
  in der „Ø Zeitraum"-Spalte für die Peak-Woche im gesamten Zeitraum.

### Planung
- Projekte, deren IBN-Woche vergangen ist, sind **nicht mehr** in den
  Planungs-Reitern (Projekte/Timeline, Ressourcen-Auswahl, Übersicht,
  Planungs-Dialog) sichtbar. In Verwaltung → Projekte bleiben sie
  bis zum Setzen des „Abgeschlossen"-Hakens.

### System & Export
- Backup-Toast nutzt jetzt das globale Toast-System: Position fixed
  (oben rechts, sichtbar bei jedem Scroll-Stand) und 6 Sekunden
  Anzeigedauer statt 2,5. Fehler-Toast trägt den echten Grund.

## v0.83 (2026-05-19)

### Datenverlust verhindern
- **`categories.json` weiter aufgeteilt** in drei Dateien nach Edit-Frequenz:
  `category-defs.json` (Team-/Projekt-Kategorien, selten editiert),
  `tasks.json` (Basic/Other/Offtime/Training-Definitionen), `inactive.json`
  (alle Inaktiv-Listen, am häufigsten getoggelt). Parallele Admin-Edits
  blockieren sich nicht mehr gegenseitig.
- **Sanity-Guard erweitert**: jeder Write, der eine zuvor nicht-leere Liste
  oder Map auf leer setzen würde, wird abgebrochen. Schützt jetzt
  `category-defs.json`, `tasks.json`, `inactive.json`, `users.json` und
  `employees.json` (vorher nur `users` + `employees` + `empCategories`).
- **`applyRemoteSnapshot` gehärtet**: alle Listen-Properties verwenden
  jetzt das `length > 0 ? remote : prev`-Muster; `inactiveSupportTasks`
  und `inactiveTrainingTasks` werden jetzt auch synchronisiert (waren
  vorher gar nicht im Update-Pfad).

### Backup
- **„Jetzt sichern" repariert**: tatsächlicher Fehlertext landet jetzt im
  Toast (statt nur „fehlgeschlagen"). Funktioniert jetzt auch im FS-Mode
  (lokaler Ordner) — schreibt nach `planner-data/backups/`.
- **Login-Backup**: Beim Login wird automatisch ein Recovery-Backup
  ausgelöst, rate-limited auf max. eines pro 30 Minuten. Jeder Login
  hinterlässt damit eine wiederherstellbare Datei.

### Kategorien
- **„Hinzufügen"-Button für Basic Tasks**: in Verwaltung → Kategorien
  kann jetzt unter Basic Tasks ein neuer Eintrag angelegt werden
  (analog zu Other/Trainings/Offtime). Neue Basic Tasks landen
  korrekt im „Basic"-Dropdown des Planungs-Dialogs.

### System & Export
- Hinweis „Inhalte ohne PIN-Hashes" entfernt — UI-Rauschen.

## v0.82 (2026-05-19)

### Kategorien
- Neue Sektion **Other Tasks** in Verwaltung → Kategorien. Trennt user-
  erstellte Tasks (mit Meta, in Planung als „Other" sichtbar) sauber von
  den hardcoded **Basic Tasks** (z. B. Office). Beide Sektionen mit
  eigenem Hinzufügen/Inaktiv/Permanent-Toggle.

### Sicherheit
- **PIN-Hashing** (SHA-256 + per-User-Salt, Web Crypto). Bestehende
  Plaintext-PINs werden beim nächsten Login transparent migriert.
- **Admin nicht mehr hardcoded**: lebt jetzt in `users.json` mit gehashtem
  PIN. Default-PIN `1397` wird einmalig beim ersten Start gesetzt und kann
  im UI geändert werden.

### Synchronisation
- `settings.json` aufgeteilt in vier Dateien: `settings.json`,
  `categories.json`, `users.json`, `audit.json`. Hochfrequente Audit-Writes
  blockieren keine Kategorien-Edits mehr → drastisch weniger ETag-Konflikte.
- **Sanity-Guard** in `saveSplitState`: ein Save, der zuvor nicht-leere
  Listen (Kategorien/User/Mitarbeiter) auf leer setzen würde, wird
  abgebrochen. Schützt vor dem „settings.json plötzlich leer"-Fall.

### Backup
- **Auto-Backup** nach `planner-data/backups/` mit zeitgestempelten JSONs
  (vollständiger Snapshot, ohne PIN-Hashes). Intervall in Verwaltung →
  Benutzer einstellbar (Default 60 Min), manueller „Jetzt sichern"-Button.
- Der Backup-Status (letzter Lauf) wird aus dem Folder-Listing gelesen,
  **nicht** in `settings.json` geschrieben → kein zusätzlicher
  Konflikt-Vektor.

### Export
- Backup-Export enthält jetzt **alle** persistierten Felder (inkl.
  `inactiveOfftime/Support/TrainingTasks`, `appUsers`, `auditLog`). PIN-
  Hashes werden konsequent gestrippt.

### Personalisierung
- **Per-User-Einstellungen**: Kompaktansicht wird pro Nutzer gespeichert
  (`user.preferences.compactView`) und beim Login wiederhergestellt.

### Planungs-Chips
- Kommentar-Symbol (Sprechblase) wird jetzt **auch im Kompaktmodus** und
  in der **Projekte-Ansicht** (Timeline) angezeigt; Sichtbarkeit erhöht
  (größeres Icon, höhere Opazität).

### Email-Vorlage
- Text der Planungs-Benachrichtigungs-Email ist jetzt in Verwaltung →
  Benutzer (Admin) editierbar. Platzhalter: `{firstName}`, `{refLabel}`,
  `{typeLabel}`, `{weekRange}`, `{comment}`, `{attachmentNote}`; optionale
  Blöcke via `{{#comment}}…{{/comment}}`.

## v0.6.1 (2026-04-15)

### Bug Fixes
- SharePoint-Sync blieb nach einer kurzen Idlezeit im Browser hängen (Status
  blieb auf „Verbindet ..." bzw. „Speichert ...") und erforderte einen
  kompletten Browser-Reload. Die App erkennt jetzt abgelaufene SharePoint-
  Sitzungen (401/403) und cached den Form-Digest bis zu seinem Ablauf,
  versucht bei Fehlern eine stille Re-Auth über einen unsichtbaren iframe und
  bietet als Rückfall einen Klick-Button „Sitzung abgelaufen – neu verbinden"
  im Status-Indikator, der ohne Reload zum SharePoint-Login führt.
- Behoben: Beim Speichern wurden durch einen `ReferenceError` in
  `buildSplitFiles` nur `meta.json` geschrieben; `inactiveOfftimeTasks`,
  `inactiveSupportTasks` und `inactiveTrainingTasks` werden jetzt sauber aus
  dem State gelesen, sodass alle Split-Dateien wieder geschrieben werden.
- Behoben: Status-Pille blieb nach einem Seiten-Reload dauerhaft auf
  „Verbindet ..." stehen, obwohl Sync tatsächlich lief. Nach 10 s wird ein
  hängender `connecting`-Status jetzt automatisch auf `idle` gesetzt.

### Version
- Version auf v0.6.1 angehoben.

## v0.6 (2026-04-14)

### Bug Fixes
- Fixed sticky employee name column being covered by task chips when scrolling right in resource planning (z-index fix)

### Teams
- Renamed team "ME" to "CSS"
- Added new team "I&C"
- Teams are now displayed in alphabetical order (with "Other" always last)
- Employees within each team are now displayed in alphabetical order

### Planning Types (new in assignment modal)
- Added type "Trainings" with 8 sub-options: R95 Training: I&C, R95 Training: S&T, F45 Training: I&C, F45 Training: S&T, HM Training, T89 Training, T86 Training, DNB Training
- Added type "Support": 24/7 Support, CRM Support, 24/7 Replacement, CRM Replacement
- Added type "Other" for user-created tasks (previously stored under "Basic")
- Tasks created via "+ Neu" now appear under "Other" instead of "Basic"
- Removed "24/7" and "Ticketing" from Basic — they are now Support tasks

### Categories (Kategorien)
- "Set Inactive" is now available for all category types: Basic, Other, Support, Training, Offtime
- Added "Permanent" tag per task: tasks with this tag are never auto-inactivated after 12 weeks
  - Hardcoded tasks (Basic, Support, Training) are permanently active by default
  - User-created Other tasks can be toggled between Permanent and Temporary
  - New user-created tasks default to Temporary (auto-expire after 12 weeks)
- Support and Training tasks now shown in their own sections in Kategorien

### Task Comments
- Click any planned task chip to open the edit modal and add a comment
- Tasks with a comment display a small message icon (indicator)
- Hovering over a task with a comment shows the comment text as a native tooltip
- Copying a task via the copy button also copies the comment
- Drag-dropping a task to a different employee clears the comment (reassignment = new context)

### Colors
- Projects now display their color as the full chip background in resource planning
- 9-color palette available for projects (blue, violet, emerald, teal, rose, lime, cyan, pink, gea)
- New projects are auto-assigned the next available color from the palette
- Project color picker now shows swatches in the project edit dialog
- 24/7 Support: unique amber color not shared with any project
- CRM Support: unique indigo color not shared with any project
- 24/7 Replacement: unique orange color
- CRM Replacement: unique purple color
- Training tasks use a unique sky-blue color
- User-created Other/Basic tasks can optionally have a custom color assigned in Kategorien settings
  (Default is no color — neutral gray chip)

### Projects
- Added address field to projects (shown in project details and included in CSV export)

### Copy Function
- Fixed: source week was not selectable when copying a task (highlighted in amber, now selectable for other employees)
- Employees in copy dialog are now grouped by team in collapsible sections; each team can be expanded/collapsed and all members selected at once

### Version & UI
- Version bumped to v0.6
- Changelog button in sidebar is now a visible badge (more prominent)
- System & Export tab now lists all external libraries with loaded versions and an "Check for updates" button that queries the npm registry

---

## v0.5.1 (2024-04-xx)
- Fix critical sync bugs and field loss in team-split data layer
- Fix workload slider showing wrong percentage for non-40h employees
- Add auto-expiry for custom Basic Tasks (12 weeks)
- Remove invoice status dropdown UI
- Split planner state into per-team files for conflict-free multi-user sync
- Extract modal components to module scope for state preservation
- Performance optimizations (memoization, debounce)
- Add File System Access API sync with IndexedDB persistence
- Add SharePoint Online collaborative sync
- Add invoice email functionality
- Add project number input
