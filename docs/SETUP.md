# Setup

Stand: 2026-04-29

## Voraussetzungen

- Node.js passend fuer Next.js 16 und React 19.
- npm.
- Firebase CLI, wenn Rules/Indexes deployed werden sollen.
- Zugriff auf ein Firebase-Testprojekt fuer lokale echte Daten.
- Optional: Vercel CLI oder Vercel Dashboard fuer Deployments.

## Installation

```powershell
cd C:\VSProjects\Projects\Gameapp
npm install
```

## Lokale Env

Fuer Entwicklung gegen Firebase-Testdaten:

```powershell
Copy-Item .env.test.example .env.local
npm run firebase:check-env
```

Dann in `.env.local` setzen:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- optional `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Fuer API-Routes/Cron mit Firebase Admin SDK zusaetzlich:

- `CRON_SECRET`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Hinweis: Ohne vollstaendige `NEXT_PUBLIC_FIREBASE_*` Werte startet die App im Mock-Modus.

## Firebase-Projekte

Die lokale `.firebaserc` enthaelt aktuell:

- `test`: `mijija-test`
- `live`: `mijija-live`

Empfohlener Alltag:

- Lokal gegen `mijija-test`.
- Vercel gegen `mijija-live`.
- Admin-Importe, Daily-Replace/Reroll und Rules-Aenderungen zuerst im Testprojekt pruefen.

## Entwicklung Starten

```powershell
npm run dev
```

Next startet standardmaessig unter:

```text
http://localhost:3000
```

Wichtige lokale Screens:

- `/login`
- `/`
- `/daily`
- `/lobby`
- `/profile`
- `/admin`
- `/preview`

## Build Und Checks

```powershell
npm run lint
npm run build
```

Aktueller Stand am 2026-04-29:

- `npm run build` laeuft erfolgreich durch.
- `npm run lint` scheitert aktuell an vier Errors; Details stehen in `docs/KNOWN_ISSUES.md`.

## Preview- Und UI-Skripte

```powershell
npm run preview:smoke
npm run ui:capture
```

Weitere Skripte:

- `scripts/review/preview-routes.mjs`
- `scripts/review/capture-ui.mjs`
- `scripts/review/capture-daily-flow.mjs`
- `scripts/firebase/backfill-default-profile-photos.mjs`
- `scripts/firebase/check-env.mjs`

Die Capture-Skripte schreiben Screenshots nach `docs/ui-review/`.

## Firebase Deploy

Firestore Rules und Indexes:

```powershell
npm run firebase:deploy:test
npm run firebase:deploy:live
```

Storage Rules:

```powershell
npm run firebase:deploy:storage:test
npm run firebase:deploy:storage:live
```

Allgemein:

```powershell
npm run firebase:login
npm run firebase:use
```

## Cron / Daily Rollover

Die API-Route ist:

```text
/api/cron/daily-rollover
```

Sie akzeptiert `GET` und `POST`, prueft bei gesetztem `CRON_SECRET` den Header:

```text
Authorization: Bearer <CRON_SECRET>
```

GitHub Actions triggert den Endpoint stuendlich ueber `.github/workflows/daily-rollover.yml`. Der Endpoint entscheidet dann serverseitig, ob in `Europe/Berlin` ein Daily erzeugt werden soll. Fuer manuelle Tests gibt es den Query-Parameter:

```text
?force=1
```

## Vercel Deployment

In Vercel muessen dieselben Firebase-Web-Variablen wie fuer Live gesetzt werden. Fuer serverseitige Routen zusaetzlich die Firebase-Admin-Variablen und `CRON_SECRET`.

Firebase Auth muss die Vercel-Domain als Authorized Domain kennen. Fuer Login/Registrierung muessen die verwendeten Provider in Firebase Authentication aktiviert sein.

## Operative Hinweise

- Keine Secrets in Docs oder Handoffs speichern.
- `.env.local` bleibt lokal und ist nicht fuer Commits gedacht.
- Firestore- und Storage-Rules sind Teil des Deployments und sollten mit Codeaenderungen gemeinsam geprueft werden.
- Bei Aenderungen an Daily-Datenmodell, Admin-Actions oder Rules danach `npm run build`, `npm run lint` und mindestens einen Testlauf gegen `mijija-test` einplanen.
