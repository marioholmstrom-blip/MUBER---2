# MUBER repository instructions

## Core rules
- Supabase is the real backend.
- Notion is operations and backoffice, not backend.
- GitHub is structure, documentation and traceability.
- Keep TEST and REAL strictly separated.
- Do not touch REAL by default.
- Do not use mocks as the main system basis.
- Do not move critical business logic into the frontend.
- Prefer real, verifiable operational flows over decorative architecture.

## Working style
- Read repository context before changing code.
- Respect existing docs and project rules.
- Avoid large refactors unless explicitly requested.
- Every relevant change should be verifiable.
- Flag security or operational risks clearly.

## Source of truth
Primary rules live in:
`MUBER - 2/contexto/reglas-operativas-muber.md`
