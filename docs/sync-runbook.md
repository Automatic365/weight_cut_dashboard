# Dashboard Sync Runbook

## Normal Flow

1. `Automatic365/daily_nutrition_logs` receives a push to `main` that changes `daily_log.md`.
2. Its `Trigger Dashboard Rebuild` workflow sends a `repository_dispatch` event to `Automatic365/weight_cut_dashboard`.
3. `weight_cut_dashboard` runs `Sync Dashboard Data Artifacts`, parses the remote daily log, and publishes `artifacts/data.json` and `artifacts/sync-metadata.json` to the `data` branch.
4. The dashboard app fetches those artifacts with a cache-busting query parameter, so GitHub raw CDN caching should not hide a freshly published artifact.

## If Sync Does Not Start Immediately

1. Open the latest `Trigger Dashboard Rebuild` run in `Automatic365/daily_nutrition_logs`.
2. If it fails with `Bad credentials`, rotate the `DASHBOARD_PAT` repository secret in `daily_nutrition_logs`.
3. The token must be owned by an account with access to `Automatic365/weight_cut_dashboard` and permission to create repository dispatch events. If a fine-grained token does not work reliably, use a classic PAT with `repo` scope.
4. Keep the secret name exactly `DASHBOARD_PAT`.

## Manual Recovery

1. Manually run `Sync Dashboard Data Artifacts` in `Automatic365/weight_cut_dashboard` from the Actions tab.
2. Verify the run succeeds and publishes to the `data` branch.
3. Check `https://raw.githubusercontent.com/Automatic365/weight_cut_dashboard/data/artifacts/sync-metadata.json?v=<timestamp>` and confirm `lastLogDateIso` matches the newest daily log.

## Expected Freshness

The target is under 2 minutes from a `daily_log.md` push to updated dashboard artifacts, allowing for normal GitHub Actions queue time.
