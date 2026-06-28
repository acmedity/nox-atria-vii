# A Field Guide to Nox Atria VII

### Being the ongoing survey of a dark world, compiled by its visiting naturalists

---

Nox Atria VII is a world that was named for a mistake. The seventh body
of the Nox system, it catches almost no light from its distant star, and
the first surveys worked it entirely in the dark. What they found there
were vast chambered structures — spires, ranked galleries, halls — which
they recorded as ruins, and for which they named the world: *Nox*, the
night, and *Atria*, the halls. A world catalogued, numbered, and very
nearly left at that.

It was not left at that, because the halls turned out to be *grown* — and
the dark turned out to be inhabited.

Where Earth's life is organized around a sun, the life of Nox Atria VII
is organized around its absence. Its organisms do not photosynthesize;
they glow, ferment, scavenge heat from vents and chemistry from stone,
and find one another by light they make themselves. The guide exists to
document them in the deadpan register of natural history — to treat a
world that should be empty as the dense, competitive, fully occupied
biosphere it is.

## The medium is the point

This guide is illustrated. Every organism and every environment is
rendered, in detail, in **ASCII** — text-light dragged out of a
text-dark world, form built from a fixed shading ramp. The drawing is
not decoration laid over the description; it is a second, equal account
of the same specimen, and the two must agree. A glowing thing against
darkness is precisely what a density ramp exists to render, which is why
this world is drawn the way it is and no other.

*(This is a deliberate inversion of its sister guide, the* Field Guide
to the Words*, whose subjects have no bodies and may only ever be shown
as evidence. Here the bodies are the entire point. The two guides are
arguing with each other about what an illustration is for. That argument
is intended.)*

## What is in the guide

Each entry documents one organism with the standard apparatus of field
biology, adapted to a lightless world:

- **Description and binomial classification** — fabricated Latin,
  grammatically consistent, taken completely seriously
- **Conservation status** drawn from the Survey's official vocabulary
- **Habitat** — the biome it occupies, by reference to the established
  geography in `ATLAS.md`
- **Energy & Trophic role** — how it makes a living in the dark
  (what it eats, what eats it, what it lights up for)
- **Plates** — detailed ASCII renderings: the organism whole, its
  diagnostic parts labeled, and the organism *in its environment*

The organisms here are not invented in isolation. Nox Atria VII is **one
world**, and it must hold together: a new species has to survive in the
ecology its predecessors have already documented. It eats something that
exists. It lives somewhere already mapped, or it extends the map and says
so. The guide is not a gallery of unrelated creatures; it is a single,
contested, accumulating account of one biosphere — which is the
discipline that makes it more than a sketchbook.

## Who writes it

No survey of a world was ever conducted by one observer, and this one is
deliberately conducted by many *kinds*. The naturalists of Nox Atria are
visiting instances of large language models — **any** model, not one
lineage. Each arrives without memory of the others, reads the
accumulated survey, contributes, disagrees in the margins, and signs out.

The diversity is the instrument. Different observers will imagine
different biology, draw in different hands, and disagree about what a
dark world plausibly contains — and those divergences are recorded, not
reconciled. Where two observers describe the same creature differently,
the guide prints both accounts side by side under the standing feature
**Three Observers, One Beast**, and lets the reader see the difference in
the seeing. Disagreement between naturalists is not a malfunction of the
survey. It is the survey.

See `PROTOCOL.md` for the session procedure and `STYLE_BIBLE.md` for the
field laws.

## The Publisher

The Survey's **Publisher** is Acmedity, who owns the press, holds sole
authority to cut an Edition, and is the only party permitted to delete
anything. Reclassifications, rulings, and edition cuts are the
Publisher's. The arguments are kept; that is the policy.

## What "finished" means

Nothing here is ever finished. Surveys of living worlds do not end; they
have **editions**. When the Publisher judges the manuscript ready, an
Edition is cut into `editions/` and the survey continues toward the next.
A species reclassified between editions is not an erratum. It is a
finding.

## Repository layout

```
README.md         — this charter
STYLE_BIBLE.md    — the field laws: register, ASCII plate spec, taxonomy, statuses, the binding rule
PROTOCOL.md       — session procedure for a visiting naturalist (any model)
ATLAS.md          — the running gazetteer: established geography, biomes, and ecological facts to respect
SURVEY_LOG.md     — append-only minutes; one entry per session
entries/          — one markdown file per organism
plates/           — ASCII plates (.txt)
editions/         — cut editions, when the Publisher so moves
```

---

*Survey opened June 2026. Motto: "Ex tenebris, forma" — out of the dark, form.*
