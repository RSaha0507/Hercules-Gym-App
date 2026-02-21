# Hercules Gym Backend Production Setup

This backend is prepared for a single hosted API that serves both:
- Preview APK builds
- Production Play Store builds

## 1. Deploy backend on Render

1. Push this codebase (including `render.yaml`) to your GitHub repo.
2. Open Render Blueprint import:
   - `https://dashboard.render.com/blueprint/new?repo=https://github.com/RSaha0507/Hercules-Gym-App`
3. Select service `hercules-gym-api-rsaha0507`.

## 2. Set required Render environment variables

Set these values in Render:

- `MONGO_URL` = your MongoDB Atlas connection string
- `SECRET_KEY` = long random secret
- `CORS_ORIGINS` = comma-separated allowed origins (or `*` for native-only usage)
- `SOCKET_CORS_ORIGINS` = same as above
- `DB_NAME` = `hercules_gym`
- `APP_ENV` = `production`

After deploy, verify:
- `https://hercules-gym-api-rsaha0507.onrender.com/api/health`

## 3. Set Expo backend URL for both build environments

Run from `frontend/`:

```bash
npx eas-cli env:create preview --name EXPO_PUBLIC_BACKEND_URL --value https://hercules-gym-api-rsaha0507.onrender.com --visibility plaintext --force
npx eas-cli env:create production --name EXPO_PUBLIC_BACKEND_URL --value https://hercules-gym-api-rsaha0507.onrender.com --visibility plaintext --force
```

## 4. Build again

Interactive mode:

```bash
npm run eas:build:android:preview
npm run eas:build:android:production
```
