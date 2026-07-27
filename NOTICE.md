# NOTICE — Data Sources & Attribution

Kotomichi Learn uses a validated serving copy of the **OpenJLPT** dataset in Supabase.
The dataset is not bundled in this repository. OpenJLPT is a derived work assembled from
the open sources below and distributed under **CC BY-SA 4.0**.

When redistributing or adapting the learning material, you must:

1. Give appropriate credit to OpenJLPT **and** the upstream sources listed here.
2. Provide a link to the CC BY-SA 4.0 license.
3. Distribute any derivative dataset under CC BY-SA 4.0 (ShareAlike).

## Sources

| Source | Used for | License | Link |
|---|---|---|---|
| **JMdict / EDICT** — Electronic Dictionary Research and Development Group (EDRDG) | Vocabulary readings & glosses (via Waller's decks, which build on EDICT) | CC BY-SA 4.0 | https://www.edrdg.org/ |
| **KANJIDIC2** — EDRDG | Kanji readings, meanings, stroke counts, grade, frequency | CC BY-SA 4.0 | https://www.edrdg.org/wiki/KANJIDIC_Project.html |
| **Jonathan Waller's JLPT Resources** (tanos.co.uk) | The **N5–N1 level assignments** for vocabulary and kanji | CC BY | https://www.tanos.co.uk/jlpt/ |
| **Tatoeba** | Example sentences (Japanese + English translations) attached to vocabulary | CC BY 2.0 FR | https://tatoeba.org |

The EDRDG files (JMdict, KANJIDIC2) are the property of the Electronic Dictionary Research
and Development Group, and are used in conformance with the Group's
[licence](https://www.edrdg.org/edrdg/licence.html).

Example sentences come from [Tatoeba](https://tatoeba.org) and are licensed
[CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/); combining CC BY material
into this CC BY-SA 4.0 dataset is permitted, and attribution to Tatoeba is given here.

## Important note on JLPT levels

The Japan Foundation / JLPT organisation does **not** publish official N5–N1 vocabulary or
kanji lists. The current N5–N1 groupings in this project are derived from **Jonathan
Waller's community-standard lists**. They are widely used and reliable, but are
*unofficial approximations* of the real (undisclosed) test content. KANJIDIC2's own `jlpt`
field refers to the **pre-2010 four-level system (1–4)** and is intentionally **not** used
for level assignment here.

## Data freshness

Per the EDRDG license, projects redistributing this data should keep it reasonably current.
Kotomichi Learn treats OpenJLPT as the canonical upstream source. Material updates must be
imported from a validated OpenJLPT release or commit while retaining this attribution.
