# Evidence Index

Evidence is grouped by purpose:

- `codex/` — primary-thread records, prompts, transcripts, and `/feedback` Session ID
- `screenshots/` — application and process screenshots
- `tests/` — test outputs and verification records
- `live/` — local live-loop evidence
- `usage/` — measured API usage evidence
- `deployment/` — hosting and live-deployment evidence
- `submission/` — Devpost and final-submission evidence

`review/` contains local working review bundles. Those bundles are excluded from Git and are not authoritative final evidence.

Authoritative final evidence lives in `codex/`, `tests/`, `live/`, `usage/`, and later `deployment/`.

Do not store API keys, authentication codes, tokens, cookies, or payment information here.
