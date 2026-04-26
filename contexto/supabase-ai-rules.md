# Supabase AI rules for MUBER

## Context
Supabase is the real operational backend for MUBER.

## Mandatory rules
- Use TEST by default.
- Use REAL only with explicit authorization.
- Never mix TEST and REAL credentials or data.
- Do not propose backend changes that cannot be verified in real tables.
- If UI and database differ, database is the source of truth.
- Keep compatibility with User, Assisted, Driver and current tracking flows.

## What must be verifiable
- new requests in `requests`
- new trips in `trips`
- status changes in `trip_status_history`
- payment-related writes when applicable
- any new columns, relationships or policies

## Verification checklist
After any backend-related change, verify:
- data was written correctly
- current status changed correctly
- frontend matches database state
- no sensitive or real environment was touched by accident

## Project reference
Main rules:
`MUBER - 2/contexto/reglas-operativas-muber.md`
