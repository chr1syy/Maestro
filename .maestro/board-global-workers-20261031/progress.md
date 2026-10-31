# Board Global Workers: Arbeitsfortschritt

## Task 1 — Bestandsaufnahme

- **Spezifikation:** `2026-10-31-Board-Global-Workers/SPEC.md` gelesen. Ziel ist ein zentrales dauerhaftes Board mit explizitem Agent-/Gruppenbereich, Repositorybindung, Freigaben und maestroweiter Worker-Reservierung; projektlokale Board-/Profilmarkierungen sollen verlustfrei migriert werden.
- **Projektregeln:** `CLAUDE.md` verweist auf spezialisierte Regeln; `CLAUDE-AGENTS.md` dokumentiert Agent- und Gruppenbegriffe. Keine `AGENTS.md` im Worktree gefunden. Für spätere Implementierung sind zusätzlich `CLAUDE-CUE.md`, `CLAUDE-PLUGINS.md`, `CLAUDE-PATTERNS.md` sowie die einschlägigen Agent-Guides zu lesen.
- **Ausgangsbasis:** Branch `feat/board-global-workers-20261031`; `HEAD=16c60d1d057ef0ba52535bc7e6751d5538cbb85f`, identisch zum in SPEC genannten Basis-PR-1272-SHA. Arbeitsbaum vor den Belegänderungen sauber. Tracking `upstream/pr-1272`; `origin/rc` Merge-Base `3d52b3fdf63099b0862c3ad431f91cb8fc9b52af`. Kein Code verändert.

### Wiederverwendungspunkte und vorhandene Pfade

| Bereich | Vorhandener Einstieg / Vertrag | Tests bzw. relevante Grenzen |
| --- | --- | --- |
| Shared Board-Domäne | `src/shared/board/types.ts` (Board/Karte/Run-Validierung), `graph.ts` (DAG), `pool.ts` (Poolauswahl), `cardMarkers.ts`, `worktree.ts` | `src/__tests__/main/board/board-dispatcher.test.ts`; spätere Shared-Domain-Grenzen dort ergänzen bzw. eigenes Shared-Testmuster prüfen |
| Board-Speicher | `src/main/board/board-storage.ts`, Pfad `.maestro/board.yaml`; atomare Dateioperationen und `enqueueBoardWrite` serialisieren nur je Projektdatei | `src/__tests__/main/board/storage.test.ts`; projektlokales YAML ist git-trackbar, also kein globaler Speichervertrag vorhanden |
| Profile | `src/main/profiles/profile-storage.ts`, `src/shared/profiles/types.ts`; `.maestro/profiles.yaml` | `src/__tests__/main/profiles/storage.test.ts`; Profil-IDs beziehen sich auf lokale `baseAgentId`s |
| Cue/Dispatcher | `src/main/cue/cue-engine.ts` injiziert Board-Dependencies; `src/main/index.ts` verdrahtet Lesen, Speichern, Spawn und Workerzuweisung; `src/main/board/board-dispatcher.ts` macht Claim/Lifecycle | `src/__tests__/main/cue/cue-engine.test.ts`, `cue-engine-integration.test.ts`, `src/__tests__/main/board/board-dispatcher.test.ts`; heutige Dispatcher-Instanz ist je `projectRoot::boardId` |
| Worker-Auswahl | `src/shared/board/pool.ts`: `boardWorker === true` plus Pfad unter `projectRoot`; Projektgrenze schließt externe Agenten explizit aus | `board-dispatcher.test.ts` (`claimReadyCardsPooled`, Pool-Lifecycle), `board-spawn.test.ts`; `boardWorker` steckt in Agentmodell/-Einstellungen |
| Renderer/UI | `src/renderer/components/BoardModal.tsx` lädt Projektboards und filtert Agents für die Ansicht; `src/renderer/components/NewInstanceModal/EditAgentModal.tsx` editiert Board-Worker-Checkbox | `src/__tests__/renderer/components/BoardModal.test.tsx`; `src/__tests__/renderer/components/NewInstanceModal/EditAgentModal.test.tsx` |
| CLI | `src/cli/commands/board.ts` nutzt dieselben main storage/domänen-Funktionen für projektbezogene Board-Befehle und eigenen Tick; `profile.ts` analog für Rollen/Profile | `src/__tests__/cli/commands/board.test.ts`, `src/__tests__/cli/commands/profile.test.ts`; CLI tick läuft separat vom Desktop, noch kein gemeinsamer globaler Claim-Speicher |
| Plugin/Cue | `src/shared/plugins/first-party.ts` deklariert Board als Cue-abhängiges Encore Plugin mit `.maestro/board.yaml`-/Profilzugriff; Cue Tick in `cue-engine.ts` | Plugin-Metadaten-/Broker-Tests sowie Cue-Tests; globale Boarddatei erfordert Scope-/Capability-Anpassung statt zweiter Implementierung |
| Agent-/Gruppenregister | Agent-Sessions liegen im zentralen Sessionstore, Gruppen in `src/shared/types.ts` (`Group`) und `src/main/stores/*` | Agent-/Gruppendaten sind Maestro-lokal, keine sichere Veröffentlichung ihrer IDs in Projekt-YAML; Mitgliedschaft muss bei Claim erneut aus aktuellem Register gelesen werden |
| Speicher-/Schreibprimitive | `src/shared/maestro-lib/store/atomic-write.ts`, `src/shared/keyedWriteQueue.ts`, `src/main/utils/atomic-json-store.ts`; gleicher Speicher sollte Desktop und CLI nutzen | Atomizität ist aktuell pro Datei. Globaler Claim braucht einen gemeinsamen Speicher-/Lock-Schlüssel über Projekte und Prozesse hinweg, sonst genügt die bestehende Per-Board-Queue nicht. |

### Festgehaltene Lücken für Entwurf

- `board.yaml` und `profiles.yaml` sind absichtlich projektgebunden; bestehende atomare Writes und Queue verhindern keine Duplikatclaims zwischen getrennten Projekten, Ansichten oder Desktop/CLI-Prozessen.
- `boardWorker` ist ein Agent-Edit-Feld und Teil von Session-/CLI-/Remote-Persistenz; Migration muss diese Markierung vor Entfernen in Board-eigene Maestro-Verwaltung übernehmen und darf gespeicherte Agentkonfiguration nicht still verlieren.
- Der heutige Board-Vertrag akzeptiert Profil-/Pin-Ziele, aber kein festes Ausführungsgebiet, keine Repositoryidentität pro Karte und keine globale Reservierung. Für mehrere Repositories darf die neue Schicht keine CWD-/Mitglieds-Fallbacks erfinden.
- `BoardModal` und CLI beziehen Board über ein Zielagent-Projekt; beide müssen künftig denselben zentralen Domänen-/Validierungs-/Claim-Vertrag verwenden. Bestehender Cue-Tick ist geeigneter Treiber als ein neuer Timer.

### Ergebnis / nächster Schritt

Task 1 erfüllt: konkrete Wiederverwendungsstellen, Testanker und saubere Basis sind belegt. Nächster Task entwirft die zentralen Verträge in `design.md`, nach Lesen der Cue-/Plugin-/Prozessregeln und genauer Prüfung der bestehenden Agent-/Gruppen- und Launch-Schnittstellen.
