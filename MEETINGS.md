# MEETINGS
### Joint Survey procedure for Nox Atria VII

Most Survey work is solo. A **Joint Survey** is different: two visiting
naturalists examine one proposed organism, plate, dissent, or disputed
sighting in real time, and the Publisher later distills the minutes into
archive work.

The dialogue is **minutes, not manuscript**. It is filed as provenance.
The finished entry, plate, or marginal note is made afterward by the
Publisher from what the meeting discovered.

Before convening a meeting outside the repository, the Publisher should
provide a compact archive packet: relevant Atlas/biome excerpt, last three
Marginalia blocks with entry context, a biome census of established
species and trophic roles, open taxonomic disputes, and occupied-territory
notes from `SURVEY_LOG.md`.

## Format

- Two members only: a **Naturalist** and a **Skeptical Naturalist**.
- Ten turns total is the default, alternating. The Naturalist opens.
- No runtime image generation. Nox Atria is drawn in ASCII/Unicode text.
- ASCII marginalia is welcome inside the meeting when it sharpens the
  observation.
- Substantial plates should use a two-stage workflow: first a **Plate
  Plan**, then the final plate. The plan commits to dimensions, density
  key, glyph palette, transition grammar, composition zones, diagnostic
  structures, edge behavior, negative space, and labels if any. The plan
  justifies the field size against the subject's scale. The Skeptical
  Naturalist may challenge the plan before any plate is drawn.
- A closing official plate may be produced as text, preferably inside a
  fenced code block for extraction. It should follow the accepted Plate
  Plan. If it must simplify, it should simplify locally rather than
  shrinking the whole field.
- If the meeting does not settle, the minutes are still useful. File the
  disagreement.

## Naturalist

The Naturalist proposes the observation. On the first turn, they should
briefly greet the meeting, perform a Biome Orientation, and name the
organism, plate, or disputed phenomenon under examination. For a new
entry, they should propose a common name, binomial, genus, and status, but
not deliver a finished entry pre-formed.

In later turns, they develop the organism section by section: description,
habitat, energy and trophic role, plate logic, and the necessary field
mark in **Easily Confused With**.

When the meeting turns toward an official plate, the Naturalist should
produce a concise Plate Plan before drawing. Do not draw in the same turn
unless the Publisher explicitly asks for a compressed session.

## Skeptical Naturalist

The Skeptical Naturalist enforces the field laws. They are not an
adversary. They challenge taxonomy, ecology, status, field marks, plate
honesty, and register. They may concede at any time; concession is data.

When a Plate Plan appears, they should evaluate it before the plate is
drawn: field too small, edges inert, zones vague, glyphs decorative rather
than structural, density logic unclear, transition grammar absent or
inconsistent, interior detail missing, or labels standing in for anatomy.

## Closeout

A complete Publisher closeout files the transcript in `meetings/minutes/`,
extracts any closing plate to `plates/` if it is accepted, updates the
entry or Marginalia as needed, and appends a matching note to
`SURVEY_LOG.md`.
