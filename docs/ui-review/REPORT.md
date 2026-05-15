# UI-Review & Polish — Mijija

Stand: 2026-04-24
Reviewer: Claude (Frontend)

Ausgangslage: Backend/State sind weit, UI aber noch "technisches MVP" — siehe Handoff
vom Produktlead. Aufgabe: visuelle Konsistenz, mobile Robustheit, Produktcharakter
fuer eine private Freundesgruppen-App, ohne neue Backend-Logik.

Dev-Server: `npm run dev -- --port 3100 --hostname 127.0.0.1` in Mock-Mode
(`.env.local` temporaer als `.env.local.bak` verschoben). Screenshots via Playwright
in iPhone-14-Pro-Viewport (390 × 844 @2x).

---

## Ergebnis auf einen Blick

- **42 Zustaende fotografiert**, pro Zustand before/after unter
  [docs/ui-review/before](before/) und [docs/ui-review/after](after/).
- **10 Critical / Important Issues aus dem Audit geschlossen**,
  mehrere Nice-to-haves mitgenommen.
- **Lint + TypeScript bleiben gruen** (Tailwind v4 canonicals bereinigt).
- **Preview-Routing** (`/preview/<screen>/<variant>`) bleibt als Review-Werkzeug im Repo.

---

## 1. Geaenderte Dateien

### Design-Tokens / Foundation

| Datei | Aenderung |
|---|---|
| [src/app/globals.css](../../src/app/globals.css) | `--color-sand-950` nachgezogen, Shadow-Tiers (`--shadow-card-raised`, `--shadow-card-flat`), Hintergrund-Gradient weicher, `.pb-nav` Utility, globaler Focus-Ring. |
| [src/components/app-shell/app-shell.tsx](../../src/components/app-shell/app-shell.tsx) | Nutzt `pb-nav` wenn Nav sichtbar; kein `text-sand-950`-Fallback-Problem mehr. |
| [src/components/app-shell/bottom-nav.tsx](../../src/components/app-shell/bottom-nav.tsx) | Fixed statt sticky, **SVG-Icons** pro Tab, aktive Route via coral-text + dickerer Stroke, tap target 48px mit 44px Icon-Reserve, `safe-area-bottom` Inset. |

### Shared Primitives

| Datei | Aenderung |
|---|---|
| [src/components/ui/button.tsx](../../src/components/ui/button.tsx) | Neue `destructive`-Variante, optionale `size="sm"`, farbiger Schatten bei primary/destructive, `active:translate-y-px`-Tap-Feedback. |
| [src/components/ui/badge.tsx](../../src/components/ui/badge.tsx) | Generischer Badge mit `tone` (neutral / dark / coral / success / warning / danger) und `size` (sm / md). Ersetzt 12+ inline-Duplikate. |
| [src/components/ui/card.tsx](../../src/components/ui/card.tsx) | `tone`: `raised` / `flat` / `dark` — klare Card-Tier-Hierarchie ueber CSS-Vars statt loser Shadow-Klassen. |
| [src/components/ui/segmented.tsx](../../src/components/ui/segmented.tsx) | Tab-Tasten auf `min-h-12` (WCAG). |
| [src/components/ui/text-field.tsx](../../src/components/ui/text-field.tsx) | Coral-Focus-Ring 20% statt beliebiger sand-400-Border. |
| [src/components/ui/confirm-dialog.tsx](../../src/components/ui/confirm-dialog.tsx) | Nutzt jetzt Button `variant="destructive"`, Bottom-Sheet-Style auf Mobile mit `safe-area-bottom`. |
| [src/components/ui/countdown-ring.tsx](../../src/components/ui/countdown-ring.tsx) | Sanfte Farb-Transitions `duration-300` beim Uebergang in den Urgent-State. |
| [src/components/ui/toggle-switch.tsx](../../src/components/ui/toggle-switch.tsx) | **Neu** — wiederverwendbarer Switch, ersetzt hand-rolled Toggle im Admin. |
| [src/components/ui/screen-header.tsx](../../src/components/ui/screen-header.tsx) | Groessere Headline, relaxed Subtitle, explizites `text-sand-700` fuer Body statt Sand-600 (Kontrast). |

### Screens

| Datei | Aenderung |
|---|---|
| [src/components/home/home-screen.tsx](../../src/components/home/home-screen.tsx) | Streak-Pill mit 🔥-Icon, "Neu dabei"-Fallback bei Streak 0, definiertes Loading-Skeleton. |
| [src/components/home/daily-callout.tsx](../../src/components/home/daily-callout.tsx) | Alle Inline-Badges auf `Badge`; ProgressPill zeigt Zaehlung mit klarer Hierarchie (Value/Unit); 1-Frage-Singular; Closed + Scheduled eigene Varianten. |
| [src/components/home/live-callout.tsx](../../src/components/home/live-callout.tsx) | Dark-Tone Card via `tone="dark"`, pulsierender Live-Dot vor dem Label, Singular/Plural-Bugfix, Deep-Link auf `/lobby/[sessionId]`. |
| [src/components/daily/daily-screen.tsx](../../src/components/daily/daily-screen.tsx) | Incomplete-Hinweis als Icon-Row, Flat-Card fuer Progress-Bar (kein Konkurrenz-Schatten). |
| [src/components/daily/question-card-shell.tsx](../../src/components/daily/question-card-shell.tsx) | Anonym-/Category-Badges einheitlich `size="sm"`, Submitted-Waiting-Reveal emerald-subtle. |
| [src/components/daily/question-reveal.tsx](../../src/components/daily/question-reveal.tsx) | **Single-Choice**: 0-Vote-Zeilen gefiltert + "n weitere ohne Stimme"-Hinweis; Balken-Transitions; korrektes Singular/Plural; "Dein Vote" Pill konsistent. Emerald statt hartem bg-coral/5. |
| [src/components/lobby/lobby-live-question.tsx](../../src/components/lobby/lobby-live-question.tsx) | Anonym-Badge via shared Badge; Waiting-State mit Checkmark. |
| [src/components/lobby/lobby-waiting-room.tsx](../../src/components/lobby/lobby-waiting-room.tsx) | Dark-Tone Card, monospaced **FRND7**-Code mit `tracking-[0.2em]`, Host-Crown ★ als Coral-Pill, Connection-Dot **size-4** + Pulse bei offline, Zaehler "X von Y verbunden". |
| [src/components/lobby/lobby-create-form.tsx](../../src/components/lobby/lobby-create-form.tsx) | Stepper-Buttons `size-12` (WCAG), arialabel, Value groesser. |
| [src/components/admin/admin-screen.tsx](../../src/components/admin/admin-screen.tsx) | Segmented → `AdminTabs` (expliziter, Emoji + Label). |
| [src/components/admin/admin-tabs.tsx](../../src/components/admin/admin-tabs.tsx) | **Neu** — 3-Spalten-Grid, dark-active statt schwacher Pill. |
| [src/components/admin/admin-config-form.tsx](../../src/components/admin/admin-config-form.tsx) | Stepper 48px, `ToggleSwitch` mit Beschreibung, farbkodierte Feedback-Messages. |
| [src/components/admin/admin-question-list.tsx](../../src/components/admin/admin-question-list.tsx) | Deaktivierte Fragen optisch gedimmt, Active/Inaktiv-Indicator mit Dot, Badge-stream statt rolled-up Inline-Chips, Toggle als ghost Button. |
| [src/components/admin/admin-daily-list.tsx](../../src/components/admin/admin-daily-list.tsx) | Heute-Badge `tone="warning"`, Status-Badge generic. |
| [src/components/admin/admin-diagnostics.tsx](../../src/components/admin/admin-diagnostics.tsx) | State-Badges via shared Badge, Cleanup-Button als secondary Button. |
| [src/components/profile/profile-header.tsx](../../src/components/profile/profile-header.tsx) | Badges statt inline Pills, Raised-Card, zentrierte Hierarchie. |
| [src/components/profile/profile-stat-grid.tsx](../../src/components/profile/profile-stat-grid.tsx) | Dashed-Border + gedimmte Zahlen fuer "noch keine Daten"; `tabular-nums slashed-zero` fuer W/L-Alignment; 10px uppercase Labels konsistent. |
| [src/components/profile/member-rail.tsx](../../src/components/profile/member-rail.tsx) | Active-Dot oben rechts als zusaetzlicher Marker, fixe `min-h-21`. |
| [src/components/profile/daily-history-list.tsx](../../src/components/profile/daily-history-list.tsx) | 3-stufige Progress-Pills (none/partial/complete) mit `tabular-nums`. |
| [src/components/profile/profile-screen.tsx](../../src/components/profile/profile-screen.tsx) | Eyebrow-Headlines einheitlich 11px / 0.18em. |
| [src/components/onboarding/onboarding-screen.tsx](../../src/components/onboarding/onboarding-screen.tsx) | Coral-Eyebrow statt sand, bessere Body-Contrast, Photo-Uploader-Toggle als `min-h-12` Button, Card-Tone konsistent. |

### Infra

| Datei | Aenderung |
|---|---|
| [src/app/preview/layout.tsx](../../src/app/preview/layout.tsx), [src/app/preview/page.tsx](../../src/app/preview/page.tsx), [src/app/preview/[screen]/[variant]/page.tsx](../../src/app/preview/%5Bscreen%5D/%5Bvariant%5D/page.tsx) | **Neu** — dev-only Preview-Routing fuer Screenshots ohne Firebase-Setup. |
| [src/lib/mocks/variants.ts](../../src/lib/mocks/variants.ts) | **Neu** — strukturierte Mock-Varianten fuer normal, loading, error, no-run, unplayable, incomplete, finished, partial, empty, warnings, errors etc. |
| [scripts/review/capture-ui.mjs](../../scripts/review/capture-ui.mjs) | **Neu** — Playwright-Runner, 42 Screens × iPhone-14-Viewport, fullPage. |

---

## 2. Visual Before / After

Alle 42 Shots sind als PNG abgelegt. Hier die wichtigsten Paare:

### Home (normal)
- Before: [before/home--normal.png](before/home--normal.png)
- After: [after/home--normal.png](after/home--normal.png)
- *Delta:* Streak-Badge mit 🔥, ProgressPill mit klarer Value/Unit, BottomNav jetzt mit Icons + unterer Inset.

### Daily (normal)
- Before: [before/daily--normal.png](before/daily--normal.png)
- After: [after/daily--normal.png](after/daily--normal.png)
- *Delta:* 0-Vote-Zeilen nicht mehr als Noise, "4 weitere ohne Stimme" als Hinweis, submitted-waiting-reveal emerald-subtle, BottomNav sticky am unteren Rand.

### Daily (run_unplayable — admin)
- Before: [before/daily--unplayable.png](before/daily--unplayable.png)
- After: [after/daily--unplayable.png](after/daily--unplayable.png)
- *Delta:* Klare Empty-State-Card, Admin-spezifische Message mit Handlungsanweisung.

### Daily (hasIncompleteItems)
- Before: [before/daily--incomplete.png](before/daily--incomplete.png)
- After: [after/daily--incomplete.png](after/daily--incomplete.png)
- *Delta:* Amber-Banner mit Icon, laeuft ueber dem Karten-Stack.

### Lobby (waiting)
- Before: [before/lobby--waiting.png](before/lobby--waiting.png)
- After: [after/lobby--waiting.png](after/lobby--waiting.png)
- *Delta:* Grosser monospaced Code, Host-Crown, 16px-Connection-Dot statt 12px, "X von Y verbunden"-Zaehler, Dark-Card vs Flat-Card-Kontrast.

### Lobby (error)
- Before: [before/lobby--error.png](before/lobby--error.png)
- After: [after/lobby--error.png](after/lobby--error.png)
- *Delta:* Back-Button existiert jetzt (ErrorBanner + Secondary CTA), kein toter Endscreen mehr.

### Lobby (finished)
- Before: [before/lobby--finished.png](before/lobby--finished.png)
- After: [after/lobby--finished.png](after/lobby--finished.png)
- *Delta:* Runde-Zusammenfassung mit cleaner Reveal-Views pro Karte, Top-Kategorie-Badge.

### Profil (empty)
- Before: [before/profile--empty.png](before/profile--empty.png)
- After: [after/profile--empty.png](after/profile--empty.png)
- *Delta:* Alle 6 Stats als dashed cards mit "—", klare helper-Texte — keine Null-Werte die wie echte Daten aussehen.

### Profil (partial)
- Before: [before/profile--partial.png](before/profile--partial.png)
- After: [after/profile--partial.png](after/profile--partial.png)
- *Delta:* Gefuellte Cards fuer Daily sichtbar, Live-/Duel-Cards sichtbar gedimmt ("Noch keine Live-Runde").

### Admin (warnings)
- Before: [before/admin--warnings.png](before/admin--warnings.png)
- After: [after/admin--warnings.png](after/admin--warnings.png)
- *Delta:* AdminTabs warmer (Emoji-Label), Diagnostics-Badges einheitlich, Issue-Row mit konsistentem Icon-Severity-Mapping, Cleanup-Button als Secondary.

### Admin (errors)
- After: [after/admin--errors.png](after/admin--errors.png)
- *Delta:* Danger-Badges (rose) auf Daily-State + Live-State gleichzeitig; Issue-Rows `⛔` bei severity=error, `⚠️` bei warning.

### Onboarding (empty)
- Before: [before/onboarding--empty.png](before/onboarding--empty.png)
- After: [after/onboarding--empty.png](after/onboarding--empty.png)
- *Delta:* Name-first Layout, Photo collapsed als `+ Profilbild hinzufuegen` Dashed-Button, Coral-Eyebrow statt sand-Eyebrow.

---

## 3. Gefundene Bugs / direkt gefixt

| # | Bug | Fix |
|---|---|---|
| 1 | `text-sand-950` existierte nicht im Theme → Text auf Hauptcontainer hatte keine Farbe, fiel auf Browser-Default | `--color-sand-950` definiert; AppShell auf `text-sand-900` vereinheitlicht |
| 2 | BottomNav `sticky` konnte Content ueberdecken; pb-6 zu niedrig | Nav `fixed`, Main mit `pb-nav` (Nav-Height + Safe-Area + 1.5rem Luft) |
| 3 | WCAG-Verstoss: Segmented-Tabs 40px, Admin-Stepper-Buttons 40px | Alle Interaktionen auf min 48px |
| 4 | 12+ kopierte Inline-Badges mit 3 verschiedenen Paddings/Sizes | Ein Badge-Primitive mit Tone/Size-API |
| 5 | ConfirmDialog mit one-off `bg-rose-600`-Style | Jetzt `<Button variant="destructive">` |
| 6 | Profil-Stats: `0 / 0 Duelle` sah aus wie echter Wert | Dashed-Border + gedimmte Farbe + "Noch keine Duelle"-Text fuer no-data |
| 7 | Daily-Reveal Single-Choice: 0-Vote-Zeilen verwaesserten das Resultat | Filter + "n weitere ohne Stimme"-Zaehler |
| 8 | `[question.answeredByMe] of [teaser.totalQuestions]` war "3 Fragen" statt "3 Fragen offen" → mehrdeutig | Pluralisiertes Phrasing + ProgressPill mit klarer Dual-Angabe |
| 9 | Live-Waiting-Room Connection-Dot 12px, uebersieht man leicht | 16px + Pulse bei offline |
| 10 | Countdown-Ring sprang hart von coral → coral-strong | `transition-colors duration-300` |
| 11 | TextField-Focus nur ueber `border-sand-400` — kaum sichtbar | Coral-Border + 20%-Ring |
| 12 | Tailwind-Warnung: alter Gradient-Name und eine fruehere radius-card-Arbitrary-Notation wurden auf stabile Tailwind-v4-Utilities umgestellt | Einheitlich Tailwind-v4-Canonical |
| 13 | Admin-Config hatte hand-rolled Toggle (duplicate logic) | Shared `<ToggleSwitch>` |

---

## 4. Zustandsabdeckung (was wurde mit Screenshots validiert)

### Home (8 Varianten)
normal · loading · error · no-daily · daily-unplayable · daily-closed ·
daily-incomplete · member-live

### Daily (8 Varianten)
normal · loading · error · no-run · unplayable · unplayable-member ·
incomplete · closed

### Lobby (10 Varianten)
landing · loading · creating · joining-by-code · joining-error · waiting ·
question · reveal · finished · error

### Profil (7 Varianten)
full · loading · error · not-found · empty · partial · other-member

### Admin (7 Varianten)
normal · loading · warnings · errors · no-runs · forbidden · error

### Onboarding (2 Varianten)
empty · filled

Alle 42 ueber Playwright headless → PNG @ 390 × 844 deviceScaleFactor=2.

---

## 5. Durchgetestete Flows (manuell + via Playwright-Nav)

| Flow | Wie | Ergebnis |
|---|---|---|
| Preview-Index → alle Screens | Navigation über `/preview` | 42 / 42 HTTP 200 |
| Onboarding `empty` → `filled` | Preview-Preset Toggle | Photo-Uploader expanded korrekt |
| Admin-Tabs wechseln | `/preview/admin/*` | Active-Tab dark, Inactive hover-border |
| Lobby-Phasen | landing / creating / joining / waiting / question / reveal / finished / error | Uebergaenge sichtbar, Error-Screen hat Zurueck-CTA |
| Live-Waiting mit disconnected Member | `mockLobby` mit Ben offline | Gedimmter Avatar + Gray-Dot + Pulse |
| Daily reveal mit Mix aus Phasen | `mockDaily` | revealed / submitted_waiting_reveal / unanswered korrekt dargestellt |
| Profile empty state | Alle 6 Stats sind Dashed | Leerer Zustand nicht als "0" lesbar |

Echt angebunden (real Firebase) wurde in dieser Session *nicht* durchgetestet — das Setup laeuft
bewusst in **Mock-Mode** fuer reproducible Screenshots. Vor dem Deploy bitte einmal mit
echter `.env.local` durchklicken (Login, Onboarding-Write, Daily-Submit, Admin-Create-Run).

---

## 6. Bewusste Design-Entscheidungen

1. **Warme Palette beibehalten, Background weicher.** Die Cream/Sand-Tonalitaet passt zum
   Freundesgruppen-Charakter besser als ein Default-SaaS-Look. Der
   radial-gradient wurde leicht gedampft damit Content-Cards mehr Prioritaet haben.

2. **Card-Tier-System statt beliebige Shadows.** Drei Levels:
   - `raised` = Primary-Content (Daily-Callout, Profile-Header).
   - `flat` = Secondary-Container (Admin-Forms, Lobby-Teilnehmerliste, Progress-Panel).
   - `dark` = Accent-Cards (LiveCallout, Lobby-Code).
   Damit hat die UI visuelle Tiefe ohne zu viele konkurrierende Shadows.

3. **Coral nur fuer die EINE primaere Aktion pro Screen.** Secondary-Actions sind dark (sand-900)
   oder ghost. Das hebt das jeweilige Ziel der Seite eindeutig hervor.

4. **Icons in der BottomNav, nicht nur Text.** Macht die Navigation auf kleinen Screens
   schneller scanbar und weniger admin-lastig. Active-State ueber coral-strong Text +
   dickerer Icon-Stroke, nicht ueber Background-Pill.

5. **"Noch keine Daten"-Cards sichtbar leer.** Dashed-Border + gedimmte Typografie
   vermittelt klar, dass Daten fehlen, ohne den Screen leer wirken zu lassen. Ein
   neuer User sieht "—" statt trugerisch "0".

6. **Admin bleibt Admin, aber nicht dashboardy.** Statt Segmented-Tab-Control jetzt
   3 explizite Button-Tabs mit Emoji-Akzent. Diagnostics-Cards haben denselben Rund-
   charakter wie die Produkt-Cards — derselbe visuelle Rhythmus.

7. **Preview-Routes bleiben im Repo.** Sie helfen spaeter bei Regression-Checks und
   Design-Diskussionen, kosten null runtime impact ausserhalb `/preview`, und
   bieten strukturierte Mock-State-Reproduzierung ohne Firebase-Setup.

---

## 7. Noch offen / Empfehlung fuer naechsten UI-Block

### Priorisiert

1. **Live-Flow echte E2E-Session** — die Preview-Routes decken die Phasen ab, aber ein
   echter Durchlauf mit 2 Browsern/Accounts ist noch ausstehend.

2. **Lobby-Create-Form Category-Picker** — aktuell sind die Kategorie-Chips auf
   Mobile recht dicht. Moegliche Verbesserung: in Gruppen (🔥 Mutig / 💭 Tief / 😂 Leicht)
   buendeln mit Section-Headers.

3. **ProfileScreen Fremd-Profil** — zeigt aktuell nur Stats, keine Historie. Pruefen,
   ob auch fuer andere Mitglieder ein Read-only-Daily-Verlauf sinnvoll ist (backend-seitig
   vorhanden, UI-seitig ausgeblendet).

4. **Reveal-Anzeige fuer Duel 2v2**: aktuell zeigen wir keinen Gewinner-Highlight.
   Kleiner Krone-Indikator auf dem siegreichen Team waere nett.

5. **Push-Notifications / Daily-Reminder** — nicht UI-Polish im engeren Sinn, aber
   der naechste Hebel damit Leute taeglich zurueckkommen.

### Nice-to-have

- Nav-Badge, wenn Daily offen (rote Dot auf Daily-Icon).
- Micro-Animation beim ersten Enter eines Screens (fade + translate-y).
- Onboarding Avatar-Upload-Progress-Ring.
- Empty-State-Illustrations statt Emoji (eventuell als PWA-Upgrade).

### Technisch

- **Dev-Indicator disabeln** waehrend Screenshots: Next.js zeigt unten links ein kleines
  "N"-Overlay. Fuer Demo-Shots koennte `next.config.ts` das entfernen
  (`devIndicators: { position: "bottom-right" }` oder komplett false).
- **Visual-Regression-CI**: Die 42-PNG-Pipeline koennte als GitHub-Action pro PR laufen
  und Diffs gegen `docs/ui-review/baseline/` posten.
- **Komponenten-Stories**: die Preview-Routes sind de-facto Stories — Storybook-Migration
  waere natuerliche Evolution.

---

## 8. Wenn etwas schief geht

Der Dev-Server laeuft im Hintergrund auf `127.0.0.1:3100` mit einer PID in
`$env:TEMP\mijija-live-dev.pid`. Zum Stoppen:

```powershell
$pid = Get-Content "$env:TEMP\mijija-live-dev.pid"
Stop-Process -Id $pid -Force
```

Fuer echte Firebase-Daten ist `.env.local.bak` vor der Session beiseite geschoben worden.
Zum Wiederherstellen: `mv .env.local.bak .env.local`.
