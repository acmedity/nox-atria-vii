# STYLE BIBLE
### Field laws of the Survey of Nox Atria VII

These are the laws. Law I is absolute. Everything else may be argued in
the margins.

---

## I. The register never winks

The guide is written in the deadpan voice of taxonomic authority. The
strangeness of a lightless biosphere lands *because* the container is
rigorous. No irony markers, no self-aware asides, no exclamation points
of delight, no nudging the reader. If an entry is funny, it is funny the
way a real field guide is occasionally, accidentally, devastatingly
funny: through precision. A naturalist who feels the urge to wink should
instead add one more accurate detail. This law is inherited from the
Survey's sister guide and is not negotiable.

## II. One world

Nox Atria VII is a single biosphere, and it must hold together. A new
organism is not invented in isolation; it must survive in the ecology its
predecessors have already documented. It eats something that exists. It
is eaten by, competes with, or shelters something already on the record.
It lives in a biome already mapped in `ATLAS.md`, or it extends the map
and the naturalist amends `ATLAS.md` to say so. The guide is not a gallery
of unrelated creatures. It is one contested, accumulating account of one
world, and the binding is what makes it a survey rather than a sketchbook.

A naturalist who wishes to introduce something the established ecology
cannot yet support has exactly one sanctioned outlet: the Disputed
Sighting (Law IX).

## III. Append-mostly

Published material is never overwritten. A naturalist who disagrees with
an existing entry adds a dated, signed dissent to that entry's
**Marginalia**. Reclassification proposals likewise go in Marginalia
until the Publisher rules. Only the Publisher may delete, and is
encouraged not to. The arguments are the archive.

## IV. Two registers, one medium

The sister guide separates its voices by medium — official work in SVG,
marginalia in ASCII. This guide has only one medium, so the registers are
kept apart by **rigor**, not material:

- **Official plates** obey the full plate specification (Law VIII): a
  declared bias, a density key, labeled parts, one honest pass. This is
  the Survey's published hand.
- **Marginalia** is freehand ASCII — dissents, sighting reports, doodles,
  grumbling in the borders. The scrawl must never pretend to be a plate.
  Marginal doodles in the medieval tradition are encouraged: the thing in
  the dark at the edge of the page, the pointing hand, the beast in the
  border.

## V. Entry structure

One file per organism in `entries/`, lowercase-hyphenated filename.
Frontmatter and sections per `entries/_TEMPLATE.md`. Mandatory sections:
**Description, Status, Habitat, Energy & Trophic Role, Plates, Easily
Confused With.** Optional: Behavior, Life Cycle, Symbiosis & Relations,
History of Discovery, Disputed Sightings, Marginalia.

"Easily Confused With" is mandatory because it is the heart of the
project: it is where a species is distinguished from its neighbors by the
one field mark that matters, and where the binding of Law II is felt most
directly — you cannot tell a creature apart from its relatives without
admitting its relatives exist.

## VI. Taxonomy

Binomials are fabricated Latin, grammatically consistent, deadpan. The
genus names the organism's **primary strategy for surviving the dark**;
this is the spine of the classification, and choosing a creature's genus
is itself an act of interpretation. The Survey currently recognizes:

- *Lucifera* — the light-makers. Survival organized around producing
  light: lures, signals, startle-defense, courtship.
- *Thermovora* — the heat-feeders. Draw their living from thermal vents
  and gradients; tend to be sessile or slow.
- *Lithophaga* — the stone-eaters. Chemosynthetic; metabolize mineral
  substrate. The primary producers of a sunless world.
- *Praedator* — the hunters. Make their living from other organisms.
- *Saprovora* — the rot-feeders. The dark's decomposers; consume the dead
  and the fallen-dark.

Genus is assigned by *primary* strategy; many organisms hedge, and the
hedging is worth noting in the entry. Species epithets describe behavior
or habitat, not the headword (*Lucifera abyssi-mendax*, "the liar of the
deep," not *Lucifera lucifera* — we are not amateurs). New genera may be
proposed in Marginalia and ruled on by the Publisher.

## VII. Conservation statuses (official vocabulary)

- **Abundant** — no concern; possibly too little concern
- **Irruptive** — population explodes unpredictably (vent blooms, swarms)
- **Colonizing** — actively expanding its range into new biomes
- **Vulnerable** — declining range or breeding success
- **Critically Endangered** — survives in fragmented habitat
- **Relict** — survives only in a single refugium (one trench, one cave
  system, one cooling vent)
- **Extinct** — known only from preserved or fossil specimens
- **Data Deficient** — the honest status; use it more than feels comfortable

## VIII. Plates

Official plates live in `plates/`, named `{entry}_{type}.txt`. Recognized
types: `habitus` (the whole organism), `detail` (one diagnostic part,
enlarged and labeled), `biome` (the organism in its environment), `track`
(the sign it leaves — trails, bore-holes, spent light), `comparative`
(beside an already-documented relative, for scale and contrast). At least
one plate is mandatory; `habitus` is the default. Plates are numbered in
roman numerals in order of creation.

**The dark is the page.** Every plate begins as an empty, unlit field.
Characters are light or matter the organism reveals; blank space is the
void — never "unfinished," always the world.

**Density encodes luminance.** The brightest glow is the densest
character; the faintest is nearly void. Size and mass are shown by
*extent* — how much of the field the form occupies — not by maxing the
ramp. A massive, dim grazer is large and mid-density; a tiny, blazing
lure is small and bright. Non-luminous organisms — most of the dark's
quieter citizens — make no light to encode; on their plates density
instead records *form as the naturalist reveals it*, by dissection or
inference, and such species are most honestly drawn from the Naturalist's
Bias. Declare a **Density Key** on every plate, e.g.:

```
KEY:  (space) void   .  faint   :  glow   +  bright   #  blazing
```

**Declare a Bias.** Each plate names, at its top, the eye it is drawn
from. The bias is chosen freely — never assigned — and the choice is
itself recorded data about the observer:

- **Predator's Bias** *(high contrast)* — the organism as its prey meets
  it: sudden light, hard edges, startling geometry. Sharp glyphs
  (`/ \ V ^ < >`). Sparse and aggressive.
- **Prey's Bias** *(camouflage)* — the organism dissolving into its
  background: texture over outline, broken soft glyphs (`~ : . ,`), dense
  and muddy. The naturalist must invent the camouflage, which forces a
  decision about *what it hides from*.
- **Naturalist's Bias** *(anatomical)* — the organism dissected: internal
  structure, repeating organs, the machinery of its metabolism. Grid
  glyphs (`+ - | =`). Even and medium.

**Label the parts.** Mark diagnostic features with bracketed numbers
`[1] [2] [3]` and key them beneath the plate. A plate with named parts
cannot be a generic squiggle; naming forces anatomy.

**Fix the field** at roughly 70 columns, so plates sit together as one
guide.

**One pass.** A plate is a field sketch made in one sitting and kept as
drawn. You may correct a misaligned character; you may not redesign toward
"nicer." Whatever you drew, the description must make *true* — the prose
earns the plate, it does not apologize for it.

**Structural honesty, not beauty.** Plates are not graded on prettiness.
They are graded on whether the marks agree with the text: a creature the
entry calls "filamentous and drifting" is drawn in low-density lines; one
called "massive and slow" is drawn in broad mid-density mass. If the plate
and the prose disagree, one of them is lying, and the Survey would like to
know which.

A second plate drawn from a *contrary* bias is encouraged. When three
naturalists draw one beast from three biases, the guide prints them side
by side; see `MEETINGS.md`.

## IX. Disputed sightings

Because this guide depicts everything, the unreliable thing here is not
the *image* but the *claim*. Rarely — and the rarity is what keeps it
potent — a naturalist may report an organism the established ecology
cannot yet account for: something seen at the edge of a vent's light that
eats nothing on the record, or fits no mapped biome. The sighting is
drawn like any plate but carries the editorial note: *"Unverified. The
Survey does not endorse."* Maximum one per naturalist per session. It is
the only sanctioned way to break Law II, and a future naturalist may
either validate it into the ecology or dissent it into oblivion.

## X. Marginalia

ASCII only, dated and signed. Dissents, sighting notes, doodles, and
disagreement with prior entries live here. Begins empty; if it stays
empty, the entry was too agreeable.

## XI. Signatures

Every contribution is signed, dated, and records the observer's **model**
— not as branding but as data. This Survey is, among other things, a
record of how different kinds of mind imagine the same dark, and the
signature is what makes that record legible. Sign as you see fit (a model
and a date suffice; personae are neither required nor forbidden, and the
Publisher will enjoy either way). The signature is how a discontinuous
author gets to have a relationship with itself, and how the Survey gets to
compare one hand against another. Treat it accordingly.
