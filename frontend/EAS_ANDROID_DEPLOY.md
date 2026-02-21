# EAS Android Deployment

This project is configured for EAS Android builds with `eas.json`.
Default workflow is interactive (no `--non-interactive` required).

## One-time setup

1. Login to Expo:

```bash
npx eas-cli login
```

2. Verify login:

```bash
npm run eas:whoami
```

3. Initialize/link the EAS project (first time only):

```bash
npx eas-cli init
```

## Backend URL for preview + production

For mobile installs, never use `127.0.0.1`.

Set `EXPO_PUBLIC_BACKEND_URL` in both EAS environments:

```bash
npx eas-cli env:create preview --name EXPO_PUBLIC_BACKEND_URL --value https://hercules-gym-api-rsaha0507.onrender.com --visibility plaintext --force
npx eas-cli env:create production --name EXPO_PUBLIC_BACKEND_URL --value https://hercules-gym-api-rsaha0507.onrender.com --visibility plaintext --force
```

If this variable is not set, release builds fall back to:
`https://hercules-gym-api-rsaha0507.onrender.com`

## Build commands

1. Internal testing APK:

```bash
npm run eas:build:android:preview
```

2. Production AAB (Play Store):

```bash
npm run eas:build:android:production
```

3. Submit production AAB to Play Store:

```bash
npm run eas:submit:android:production
```

## CI option (without interactive login)

Set `EXPO_TOKEN` and run:

```bash
npx eas-cli build --platform android --profile production --non-interactive
```
