# Android Release Runbook (Step 1-3)

Date context: this was prepared on Saturday, February 28, 2026.  
Expo free-tier Android build quota reset window reported by EAS: Sunday, March 1, 2026.

## 1) Generate fresh preview APK + production AAB

Run from `frontend/`:

```bash
npm run eas:whoami
npm run eas:build:android:preview:ci
npm run eas:build:android:production:ci
```

After both builds complete:

```bash
npx eas-cli build:list --platform android --limit 10 --non-interactive
```

Collect:
- latest `preview` build APK URL for smoke testing
- latest `production` build AAB (build ID for submission)

## 2) Submit production AAB to Play Console Internal testing

Preferred: Play Console UI (works without EAS submit service-account setup)

1. Open Google Play Console -> app `com.herculesgym.mobile`.
2. Go to `Testing` -> `Internal testing`.
3. Create release (or edit existing internal track release).
4. Upload the fresh production `.aab`.
5. Add release notes.
6. Save -> Review release -> Start rollout to Internal testing.

Optional CLI path after service account setup:

```bash
npm run eas:submit:android:production
```

Current state from this machine:
- `eas submit --non-interactive` fails with: `Google Service Account Keys cannot be set up in --non-interactive mode.`
- So use Play Console UI now, or first configure Google service account credentials for EAS Submit.

## 3) Confirm release backend and config

Already configured in this repo:
- `eas.json` has `EXPO_PUBLIC_BACKEND_URL` in both `preview` and `production` profiles.
- `src/config/backend.ts` falls back to production Render backend for non-dev builds.
- `app.json` owner/package/projectId are set for Expo + Android release.

## Quick smoke checklist before promotion

From internal APK/AAB build:
- Login works on production backend
- Membership payment flow works
- Shop payment flow + success message works
- Bengali language shows Bengali script correctly
- Admin Revenues screen loads totals + payment history

After successful internal smoke checks:
- Promote same release from Internal testing to broader track (Closed/Open/Production).
