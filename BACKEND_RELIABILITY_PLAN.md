# Backend Reliability Plan (Pre-Play Store)

## Goal
Avoid login failures after idle periods and remove day-to-day manual Atlas monitoring.

## What is already implemented in code
- Frontend API retries for transient network/timeout/5xx conditions on safe requests.
- Auth context keeps cached session during temporary backend wake-up windows.
- Backend Mongo operations on auth-critical paths use retry with backoff.
- Backend startup no longer hard-crashes if DB is briefly unavailable; service starts in degraded mode and recovers.
- Background DB keepalive ping task is enabled.

## Production configuration actions required
1. Keep backend always warm:
- Recommended: use Render paid instance (no sleep).
- Alternative: add external uptime ping to `GET /api/health` every 5 minutes.

2. Ensure Atlas network access is stable:
- Prefer allowlist suitable for cloud runtime (or VPC peering/private networking for stricter security).
- Do not rely on laptop/browser Atlas session for app runtime.

3. Use durable Atlas tier and alerts:
- Use a production tier (not temporary/dev only).
- Configure Atlas alerts for connection errors and high latency.

4. Set robust env values on backend service:
- `MONGO_SERVER_SELECTION_TIMEOUT_MS=5000` (or 7000 for slower regions)
- `MONGO_CONNECT_TIMEOUT_MS=10000`
- `DB_KEEPALIVE_INTERVAL_SECONDS=300`

5. Monitoring and incident visibility:
- Keep Render logs/metrics enabled.
- Add alerting on repeated 503 responses from auth endpoints.

## Validation checklist before Play Store
1. Leave app idle for 2+ hours, then login from member/trainer/admin in one attempt.
2. Restart backend service once and verify login/chat/attendance recover without repeated manual attempts.
3. Confirm `GET /api/health` remains `healthy`/`degraded` (never hard-down due startup DB race).
