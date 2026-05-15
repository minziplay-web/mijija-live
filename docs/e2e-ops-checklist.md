# E2E- und Ops-Checklist

Diese Liste ist die naechste produktnahe Testschicht fuer `Mijija`.

Ziel:
- gleiche Kernfluesse immer wieder pruefbar machen
- Admin-/Ops-Diagnostik bewusst gegen reale Ereignisse lesen
- Randfaelle nicht nur fixen, sondern reproduzierbar machen

## Vor dem Test

1. Dev-Server starten:
```bash
npm run dev -- --port 3100
```

2. Preview-Routen pruefen:
```bash
npm run preview:smoke
```

3. UI-Screenshots erzeugen:
```bash
npm run ui:capture
```

Artefakte:
- Screenshots landen in `docs/ui-review/after`.

## Block A: Daily normal

Ziel:
- heutige Daily ist spielbar
- Antworten speichern
- Home und Daily zeigen denselben Fortschritt

Check:
1. Admin: fuer heute Run erzeugen
2. `/daily` oeffnen
3. mehrere Fragetypen beantworten
4. `/` oeffnen
5. Fortschritt vergleichen

Erwartung:
- kein Speichern-Fehler
- Home/Daily stimmen ueberein
- bei anonymen Fragen bleibt nur die eigene Sicht privat

## Block B: Daily Replace mitten im Betrieb

Ziel:
- Replace raeumt alte Tagesdaten wirklich auf
- Admin bekommt verstaendliche Rueckmeldung

Check:
1. Run fuer heute erzeugen
2. mindestens eine Frage beantworten
3. Admin: `Heutigen Run ersetzen`
4. Erfolgsmeldung lesen
5. Daily neu laden

Erwartung:
- alte Fragen koennen nicht mehr weiter beantwortet werden
- Replace-Meldung zeigt geloeschte:
  - oeffentliche Antworten
  - private Antworten
  - anonyme Aggregates
  - First-Answer-Locks
- Diagnostics.todayDaily passt sich an neuen Run an

## Block C: Live normal

Ziel:
- Session-Erstellung, Join, Fragephase, Reveal und Finish funktionieren

Check:
1. Admin/Host erstellt Live-Runde
2. zweiter Nutzer joint per Code
3. Host startet
4. beide antworten
5. Reveal abwarten
6. weiter zur naechsten Frage
7. Runde beenden

Erwartung:
- Join per Code funktioniert
- Reveal kommt nicht sofort beim Host-Submit, sondern countdownbasiert
- Finished Summary rendert ohne Fehlzustand

## Block D: Host leaves / Teilnehmer gehen raus

Ziel:
- Session strandet nicht als Zombie

Check:
1. aktive Live-Session erstellen
2. Host verlaesst die Session
3. alternativ: alle Teilnehmer disconnecten

Erwartung:
- Session wird backendseitig beendet
- Lobby-Code wird deaktiviert
- Admin-Diagnostics.activeLive zeigt danach keinen offenen kaputten Zustand

## Block E: Cleanup und stale Session Ops

Ziel:
- Cleanup finalisiert und raeumt stale Zustaende auf

Check:
1. stale Session simulieren oder bestehen lassen
2. Admin-Diagnostics im Ops-Block lesen
3. Cleanup ausloesen

Erwartung:
- stale Live-Sessions werden ggf. erst finalisiert, dann bereinigt
- Rueckmeldung zeigt:
  - finalisierte stale Sessions
  - geloeschte finished Sessions
  - geloeschte Lobby-Codes
  - geloeschte First-Answer-Locks

## Block F: Admin-Diagnostics lesen

Daily:
- `missing`
- `ready`
- `incomplete`
- `unplayable`

Live:
- `ready`
- `warning`
- `error`

Ops:
- Anzahl finished Sessions
- stale finished Sessions
- inaktive Codes
- stale Codes
- verwaiste First-Answer-Locks
- aelteste stale Session / aeltester stale Code

Erwartung:
- keine eigene Heuristik notwendig
- UI rendert direkt, was das Backend liefert

## Wenn ein Test faellt

Immer festhalten:
1. Route / Flow
2. beteiligte Rolle:
   - Host
   - Teilnehmer
   - Admin
3. erwartetes Verhalten
4. tatsaechliches Verhalten
5. betroffene Diagnostics / Fehlermeldung
6. Screenshot-Pfad, falls vorhanden

## Nächster Paket-Uebergang

Wenn die Blöcke A-F stabil sind, geht es weiter mit:
- Mehrnutzer-Testblock / Abschluss-Haertung
- danach Release-/Deploy-Vorbereitung
