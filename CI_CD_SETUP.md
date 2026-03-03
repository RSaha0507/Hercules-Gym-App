# Hercules Gym App CI/CD Setup

This repository now has an essential CI/CD baseline using GitHub Actions + EAS.

## Workflows

1. `CI` (`.github/workflows/ci.yml`)
   - Trigger: every pull request + push to `main`.
   - Runs:
     - Backend dependency install + Python syntax check (`backend/server.py`).
     - Frontend install + lint + TypeScript type check.

2. `Android Preview Build` (`.github/workflows/android-preview-build.yml`)
   - Trigger: manual (`workflow_dispatch`).
   - Purpose: build testing APK (`preview` profile).
   - Option: wait for build completion and output artifact URL.

3. `Android Production Release` (`.github/workflows/android-production-release.yml`)
   - Trigger: manual (`workflow_dispatch`).
   - Purpose: build production AAB (`production` profile).
   - Option: submit latest build to Play Console Internal testing.

## Required GitHub Secret

Add this in:
`GitHub Repo -> Settings -> Secrets and variables -> Actions -> New repository secret`

1. `EXPO_TOKEN`
   - Generate from Expo account:
     `https://expo.dev/settings/access-tokens`

## Runbook

1. Push changes and open PR.
2. Ensure `CI` passes.
3. Merge to `main`.
4. Run `Android Preview Build` for tester APK.
5. Run `Android Production Release` when releasing.
6. Enable `submit_to_play_internal` only when release checks are complete.

## Notes

1. Current workflows use existing EAS build profiles from `frontend/eas.json`.
2. Android credentials are expected to work with your current project setup.
3. If `submit_to_play_internal` is enabled, EAS submit must already be configured for the Expo project.
