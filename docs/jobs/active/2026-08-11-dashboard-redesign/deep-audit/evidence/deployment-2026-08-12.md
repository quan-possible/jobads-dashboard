# Production deployment evidence — 2026-08-12

- Release commit: `b7bebe5b6e7a277c6ee3750960a5ef022ec78773`
- Previous production source / rollback:
  `backup/main-pre-dashboard-redesign-20260812-463d919a`
- Next.js: 16.3.0; build ID `R1XRrat8L-kJFQH4OLwqr`
- Local health: API `127.0.0.1:8530/health` 200; web
  `127.0.0.1:8522/healthz` 200
- Public target:
  `https://topics-marion-although-restore.trycloudflare.com`
- LaunchAgent: `/Users/brucenguyen/Library/LaunchAgents/com.aclmr.jobads-dashboard-public.plist`
  starts Uvicorn with `--no-proxy-headers`
- Backup:
  `tmp/deployment/2026-08-12-dashboard-redesign/com.aclmr.jobads-dashboard-public.plist.before`
  (`05de524d64fdf5030dc0471b2be4885d4761fed6d3d15388ac6a21877afb2795`)
- Python: 362 passed; one pre-existing Starlette TestClient deprecation warning
- Web: ESLint passed; TypeScript passed; production webpack build passed;
  complete and production-only npm audits reported zero vulnerabilities
- Data: 25,356,735 metadata/monthly/source postings; source window matched;
  no missing files or schema issues
- Security/API: anonymous and anonymous `full=1` remained at 10 categories;
  authenticated team returned 11; team figure and posting responses were
  `private, no-store`; forged-XFF wrong-password sequence was `401` × 8 then
  `429` × 2
- Browser: all nine EN and FR route responses were 200 with localized titles
  and H1s. Direct inspection passed English desktop Pulse, French mobile
  Geography, locked/authenticated mobile Explore, menu focus return, language
  switching, login, posting detail, and logout relock.
- Screenshots: `live-qa/deployed-pulse-1440-en.png`,
  `live-qa/deployed-geography-390-fr.png`,
  `live-qa/deployed-explore-locked-390-en.png`, and
  `live-qa/deployed-explore-auth-390-en.png`.
- Remote boundary: no push. `origin/main` remains at `98edbe04`; Render CLI is
  unauthorized and its reachable hostname appears to serve an older Streamlit
  application.
- Independent verdict: `READY`, no confirmed material finding. The reviewer
  independently checked canonical/runtime identity, local/public health, all
  nine EN/FR routes, anonymous cap enforcement, protected endpoints, the
  running LaunchAgent flag, and direct visual quality of all four deployed
  screenshots. It deliberately did not reuse production credentials; the
  primary live run owns authenticated uncapping/no-store evidence.
