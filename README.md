# APMS-2

APMS-2 is a patient monitoring system that combines an Expo React Native caregiver app with Firebase as the backend data and alerting layer. The app is designed for continuous remote monitoring use cases where a caregiver needs live visibility into patient vitals, falls, geofence status, medicine schedule adherence, and watch location.

## Repository Overview

This repository currently contains:

- `frontend/`: Expo React Native application for caregiver-facing dashboards and workflows.
- `firebase.json`: Firebase project configuration pointing Firestore to `firestore.rules`.
- `firestore.rules`: Security rules for authenticated app access and write-shape constraints.

## Core Features

- Email/password authentication using Firebase Auth.
- Automatic user profile bootstrap (`users/{uid}`) for first-time sign-up.
- Multi-screen caregiver dashboard with tabbed navigation:
  - Home dashboard
  - Watch map and geofence controls
  - Logs and historical summaries
  - Medicine scheduling
  - Voice message recording and upload
  - Profile and patient management
- Live Firestore subscriptions for:
  - Vitals (`vitals`)
  - Falls (`falls`)
  - Watch GPS location (`locations` and user-scoped fallback)
  - Medicine logs (`medicineLogs`)
- Local notifications for:
  - Medicine reminders
  - Vitals threshold alerts
  - Fall alerts
  - Geofence breach transitions

## Tech Stack

- Frontend framework: Expo SDK 54 + React Native 0.81 + React 19.
- Routing and navigation: Expo Router + PagerView custom tab bar.
- Backend: Firebase Auth + Firestore (+ Storage dependency available).
- Mapping: MapLibre React Native with OpenStreetMap raster tiles.
- Notifications: Expo Notifications.
- Audio capture: Expo AV.
- Styling: React Native Unistyles.

## Architecture Summary

The app follows a hook-driven architecture:

- Screen components handle UI and interaction.
- Hooks encapsulate data subscriptions and business logic.
- Firebase services provide authentication, real-time database access, and persistent storage.
- User scoping supports both current per-user documents and legacy/default document fallbacks.

Key flow:

1. User authenticates.
2. App resolves user-scoped document paths (with legacy fallback where implemented).
3. Hooks subscribe to Firestore collections/documents.
4. Alert hooks trigger local notifications on state changes.

## Data Model (Firestore)

Common collections/documents used by the app:

- `users/{uid}`
  - `carerName`, `patientName`, `patientStatus`
  - Optional `patients` array
  - Optional `geofence`: `{ homeLatitude, homeLongitude, radius }`
- `users/{uid}/medicines/{medicineId}`
  - Medicine schedule and metadata
- `users/{uid}/locations/{locationId}`
  - Watch GPS documents (fallback read path)
- `medicines/{medicineId}`
  - Legacy top-level medicine storage
- `vitals/{readingId}`
  - `heartRate`, `spo2`, `timestamp`
- `falls/{fallId}`
  - `timestamp` (and optional `fall` flag)
- `locations/{locationId}`
  - `latitude`, `longitude`, optional `hdop`, `satellites`, `timestamp`
- `medicineLogs/{logId}`
  - Daily medicine status records for logs screen
- `voiceMessages/{messageId}`
  - Voice clip metadata and payload for watch-side consumption

Refer to `firestore.rules` for exact read/write permissions and allowed write shapes.

## Prerequisites

For local development:

- Node.js 18 or newer.
- npm (bundled with Node.js).
- Java 17 and Android SDK (for Android builds).
- Android Studio emulator or physical Android device.
- Xcode (macOS only, if building iOS locally).
- Firebase project with Auth and Firestore enabled.

## Setup

### 1) Install dependencies

From repository root:

```bash
cd frontend
npm install
```

### 2) Configure Firebase Android environment variables

The Expo config plugin at `frontend/plugins/withFirebaseAndroid.js` generates `frontend/google-services.json` from environment variables.

Create `.env` from the template:

```bash
cd frontend
cp .env.example .env
```

Then fill these values in `.env`:

- `FIREBASE_PROJECT_NUMBER`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MOBILESDK_APP_ID`
- `FIREBASE_ANDROID_PACKAGE_NAME`
- `FIREBASE_API_KEY`

If any value is missing, app config will fail during startup/build.

### 3) Configure Firebase project files

Ensure platform configuration is present:

- Android: `frontend/android/app/google-services.json` may be used for native builds.
- iOS: `GoogleService-Info.plist` should be set up in the iOS project if targeting iOS.

## Running the App

From `frontend/`:

- Start Metro/Expo dev server:

```bash
npm run start
```

- Launch Android build:

```bash
npm run android
```

- Launch iOS build (macOS):

```bash
npm run ios
```

- Web target:

```bash
npm run web
```

- Lint:

```bash
npm run lint
```

## Security Rules Deployment

Rules file is located at repository root:

- `firestore.rules`

Firebase config references it through:

- `firebase.json`

Deploy with Firebase CLI (after login and project selection):

```bash
firebase deploy --only firestore:rules
```

## Important Operational Notes

- Authentication is required for app data access.
- Some hooks support legacy fallback paths (for migration compatibility).
- Watch location reads first from top-level `locations`, then user-scoped fallback on permission-denied.
- Geofence alerts trigger on out-of-zone transition with cooldown protection.
- Voice message upload stores base64 payload in Firestore; recording duration is capped to reduce document size risk.

## Development Tips

- Keep Firestore document shapes aligned with `firestore.rules` validators.
- Prefer user-scoped paths for new data writes.
- Test alert hooks with realistic data cadence to avoid duplicate notifications.
- Validate permission-denied fallback paths when tightening Firestore rules.

## Folder Reference

Top-level app areas under `frontend/`:

- `app/`: route entry points.
- `components/`: reusable UI components.
- `hooks/`: data and alert logic.
- `screens/`: tab content screens.
- `services/`: notification and user scoping utilities.
- `styles/`: screen and component style modules.
- `plugins/`: Expo config plugins.

For app-specific details, see `frontend/README.md`.
