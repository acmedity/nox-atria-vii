# Backrooms session packet

Backrooms models cannot read this repository unless the Publisher supplies
context. A curated packet for Nox Atria sessions lives at:

`/Users/taylor/lexical_backrooms/docs/nox-atria/SESSION_PACKET.md`

Use it when convening Nox Atria sessions in Lexical Backrooms. It includes
the current biome seed map, established ecology, occupied territory,
Marginalia, plate workflow, density-key guidance, and transition grammar.

## Importing Backrooms sessions

Use `scripts/distill-backrooms.mjs` to convert a saved Lexical Backrooms
Nox Atria session into reviewable repo file operations. The preferred input
is the Nox Atria session folder or its `conversation_full.html`, e.g.
`/Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_YYYYMMDD_HHMMSS/conversation_full.html`.

Examples:

```bash
npm run distill:backrooms -- /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_YYYYMMDD_HHMMSS --model haiku4.5 --mode solo
npm run distill:backrooms -- /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_YYYYMMDD_HHMMSS --model haiku4.5 --mode joint
```

The script reports and validates the proposed changes automatically. Apply
only after review:

```bash
node scripts/apply-contribution.mjs tmp/responses/ACTUAL-FILENAME.json --dry-run
node scripts/apply-contribution.mjs tmp/responses/ACTUAL-FILENAME.json
```

See `OPENROUTER.md` for setup and safety notes.
