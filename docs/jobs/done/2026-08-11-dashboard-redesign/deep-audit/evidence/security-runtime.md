# Security runtime evidence

- Target: isolated candidate Next `127.0.0.1:8521` to FastAPI
  `127.0.0.1:8531`.
- API launch included `--no-proxy-headers`, matching the repaired production
  entrypoint.
- Fresh forged-header probe: ten sequential wrong-password requests sent ten
  distinct single-value `X-Forwarded-For` headers through Next.
- Status sequence: `401 401 401 401 401 401 401 401 429 429`.
- Conclusion: Uvicorn no longer rewrites the transport peer from untrusted
  client headers, so forged header rotation cannot bypass the eight-failure
  per-peer limit.
- Operational tradeoff: until a trusted proxy actively sanitizes and replaces
  client-IP metadata, users arriving through the same loopback Next proxy share
  one fail-closed throttle bucket.
- Fresh public/team figure probe after restart: anonymous = 8 categories,
  anonymous `full=1` = 8, verified team `full=1` = 11.
- Verified team figure and posting-list responses both returned
  `Cache-Control: private, no-store`.
