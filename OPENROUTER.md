# OpenRouter Backrooms Import

This repo can use a small model through OpenRouter to convert Lexical Backrooms Nox Atria sessions into reviewable repository file operations.

The safe workflow is:

1. export/save the Backrooms session HTML (`/Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_YYYYMMDD_HHMMSS/conversation_full.html`). You can pass either the session folder or the HTML file.
2. run the distiller with `haiku4.5` or another model
3. review the generated report and validation output
4. dry-run apply
5. apply after Publisher review

Generated responses live under `tmp/`, which is gitignored.

## Setup

```bash
cp .env.example .env
```

Fill in:

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_SITE_URL=
OPENROUTER_APP_NAME=nox-atria-vii
```

Do not commit `.env`.

## Common commands

List model aliases:

```bash
npm run models
```

Convert a solo canonical Backrooms session:

```bash
npm run distill:backrooms -- /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_YYYYMMDD_HHMMSS --model haiku4.5 --mode solo
```

Or target the HTML file directly:

```bash
npm run distill:backrooms -- /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_YYYYMMDD_HHMMSS/conversation_full.html --model haiku4.5 --mode solo
```

Convert a joint/meeting session:

```bash
npm run distill:backrooms -- /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_YYYYMMDD_HHMMSS --model haiku4.5 --mode joint
```

If you omit `--mode`, the script treats sessions with multiple assistant speakers as `joint`, otherwise `solo`.

## Revise a flagged conversion

If Haiku or the validator flags problems, ask for a corrected proposal without
re-running the whole import manually:

```bash
npm run revise:contribution -- tmp/responses/ACTUAL-FILENAME.json --model haiku4.5 \
  --instructions "Fix the validation errors and remove any duplicated plate body from the entry markdown."
```

For longer notes:

```bash
npm run revise:contribution -- tmp/responses/ACTUAL-FILENAME.json --model haiku4.5 --instructions-file notes.txt
```

The revision script saves a new JSON under `tmp/responses/`, reports it, and
validates it. Apply only after review.

## Review/apply

The distiller and revision script print a saved response path under
`tmp/responses/` and run report + validation automatically. To apply manually:

```bash
node scripts/apply-contribution.mjs tmp/responses/ACTUAL-FILENAME.json --dry-run
node scripts/apply-contribution.mjs tmp/responses/ACTUAL-FILENAME.json
```

Use `--apply` on the distiller only when you are comfortable reviewing afterward with `git diff`.

## Safety notes

- Models never receive your API key.
- Models return proposed file operations as JSON; they do not write files directly.
- `create` refuses to overwrite existing files.
- `SURVEY_LOG.md` and `ATLAS.md` are append-only through the validator.
- Existing entries can only be appended to for Marginalia-style updates.
- Canonical plates are text files under `plates/`.
