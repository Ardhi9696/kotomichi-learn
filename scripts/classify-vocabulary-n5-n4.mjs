#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_JMDICT = '/tmp/jmdict-eng-3.6.2.json';
const OPENJLPT_FILES = {
  N5: '/tmp/openjlpt-n5.json',
  N4: '/tmp/openjlpt-n4.json',
};
const OUTPUT = resolve(
  ROOT,
  'supabase/migrations/20260727083000_seed_vocabulary_taxonomy_n5_n4.sql',
);

const IRREGULAR_VERB_TAGS = new Set([
  'vk',
  'vn',
  'vr',
  'vs',
  'vs-c',
  'vs-i',
  'vs-s',
  'vz',
]);

const THEME_RULES = [
  [
    'numbers_units',
    /\b(number|zero|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|amount|count|counter|unit|meter|metre|centimeter|centimetre|kilometer|kilometre|gram|kilogram|liter|litre|yen|money|price|cost|half|quarter|percent|degree|pair|piece)\b/i,
  ],
  [
    'self_family',
    /\b(self|oneself|person|people|man|woman|boy|girl|child|children|baby|family|parent|father|mother|dad|mom|son|daughter|brother|sister|husband|wife|grandfather|grandmother|grandparent|uncle|aunt|cousin|relative|friend|name|age)\b/i,
  ],
  [
    'time_weather',
    /\b(time|hour|minute|second|day|week|month|year|today|tomorrow|yesterday|morning|noon|afternoon|evening|night|midnight|spring|summer|autumn|fall|winter|season|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|weather|rain|snow|wind|cloud|sunny|cloudy|temperature|warm|cool|cold|hot)\b/i,
  ],
  [
    'daily_life',
    /\b(home|house|room|door|window|table|chair|bed|bath|toilet|kitchen|garden|clothes|shirt|coat|skirt|shoe|hat|bag|umbrella|watch|clock|key|book|paper|pen|pencil|letter|picture|photo|telephone|phone|television|radio|computer|clean|wash|cook|sleep|wake|wear|use|make|buy|sell)\b/i,
  ],
  [
    'food_drink',
    /\b(food|meal|breakfast|lunch|dinner|rice|bread|meat|fish|egg|vegetable|fruit|apple|orange|tea|coffee|milk|water|juice|beer|sake|drink|eat|taste|sweet|salty|restaurant|chopstick|spoon|plate|cup)\b/i,
  ],
  [
    'school_work',
    /\b(school|university|college|class|lesson|student|teacher|study|learn|teach|exam|test|question|answer|homework|office|company|work|job|business|employee|president|meeting|factory|library|dictionary)\b/i,
  ],
  [
    'travel_places',
    /\b(travel|trip|station|train|bus|car|taxi|bicycle|airplane|plane|airport|ship|boat|road|street|bridge|map|ticket|hotel|inn|country|city|town|village|place|park|shop|store|department store|bank|post office|hospital|temple|shrine|north|south|east|west|left|right|front|back|inside|outside|near|far|arrive|depart|ride|drive|walk)\b/i,
  ],
  [
    'nature_health',
    /\b(nature|mountain|river|sea|ocean|lake|sky|tree|flower|grass|animal|dog|cat|bird|horse|cow|insect|body|head|face|eye|ear|mouth|hand|arm|leg|foot|heart|health|ill|sick|disease|medicine|doctor|pain|hurt|die|alive)\b/i,
  ],
  [
    'communication_feelings',
    /\b(say|speak|talk|tell|ask|answer|hear|listen|read|write|word|language|Japanese|English|voice|sound|think|know|understand|remember|forget|feel|feeling|love|like|dislike|happy|sad|angry|afraid|fear|kind|interesting|fun|beautiful|good|bad|easy|difficult|important)\b/i,
  ],
];

function normalize(value) {
  return value.normalize('NFKC').trim();
}

function normalizeEnglish(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim();
}

function wordTokens(values) {
  return new Set(
    values
      .flatMap((value) => normalizeEnglish(value).split(' '))
      .filter((token) => token.length > 1),
  );
}

function overlapScore(left, right) {
  const a = wordTokens(left);
  const b = wordTokens(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  return overlap / Math.max(a.size, b.size);
}

function applies(values, candidate) {
  return values.includes('*') || values.includes(candidate);
}

function relevantSenses(entry, word, reading) {
  return entry.sense.filter((sense) => {
    const kanjiApplies =
      !entry.kanji.some((form) => form.text === word) ||
      applies(sense.appliesToKanji, word);
    const kana = reading || word;
    const kanaApplies = applies(sense.appliesToKana, kana);
    return kanjiApplies && kanaApplies;
  });
}

function buildIndex(words) {
  const index = new Map();
  for (const entry of words) {
    for (const form of [...entry.kanji, ...entry.kana]) {
      const key = normalize(form.text);
      const bucket = index.get(key) ?? [];
      bucket.push(entry);
      index.set(key, bucket);
    }
  }
  return index;
}

function rankCandidate(entry, item) {
  const reading = normalize(item.reading);
  const exactReading =
    !reading || entry.kana.some((form) => normalize(form.text) === reading);
  if (!exactReading) return null;

  const senses = relevantSenses(entry, normalize(item.word), reading);
  const applicableSenses = senses.length ? senses : entry.sense;
  const meaningMatchedSenses = applicableSenses.filter((sense) => {
    const glosses = sense.gloss
      .filter((gloss) => gloss.lang === 'eng')
      .map((gloss) => gloss.text);
    return overlapScore(item.meanings, glosses) > 0;
  });
  const selectedSenses = meaningMatchedSenses.length
    ? meaningMatchedSenses
    : applicableSenses;
  const glosses = selectedSenses.flatMap((sense) =>
    sense.gloss.filter((gloss) => gloss.lang === 'eng').map((gloss) => gloss.text),
  );
  const common =
    entry.kanji.some((form) => form.text === item.word && form.common) ||
    entry.kana.some((form) => form.text === (reading || item.word) && form.common);
  return {
    entry,
    senses: selectedSenses,
    glosses,
    score: overlapScore(item.meanings, glosses) + (common ? 0.05 : 0),
  };
}

function classifyGrammar(tags) {
  const verbTags = tags.filter(
    (tag) => /^v[1-5]/.test(tag) || IRREGULAR_VERB_TAGS.has(tag),
  );
  const partsOfSpeech = [];
  if (tags.some((tag) => tag === 'n' || tag.startsWith('n-') || tag === 'num')) {
    partsOfSpeech.push('noun');
  }
  if (verbTags.length) partsOfSpeech.push('verb');
  if (tags.some((tag) => tag.startsWith('adj-'))) partsOfSpeech.push('adjective');
  if (!partsOfSpeech.length) partsOfSpeech.push('other');

  const verbGroups = [];
  if (verbTags.some((tag) => tag === 'v1' || tag === 'v1-s')) {
    verbGroups.push('ichidan');
  }
  if (verbTags.some((tag) => tag.startsWith('v5'))) verbGroups.push('godan');
  if (verbTags.some((tag) => IRREGULAR_VERB_TAGS.has(tag))) {
    verbGroups.push('irregular');
  }

  const transitivities = [];
  if (tags.includes('vt')) transitivities.push('transitive');
  if (tags.includes('vi')) transitivities.push('intransitive');

  const adjectiveTypes = [];
  if (tags.includes('adj-i') || tags.includes('adj-ix')) adjectiveTypes.push('i');
  if (tags.includes('adj-na')) adjectiveTypes.push('na');

  return { partsOfSpeech, verbGroups, transitivities, adjectiveTypes };
}

function classifyThemes(meanings) {
  const text = meanings.join(' ');
  return THEME_RULES.filter(([, pattern]) => pattern.test(text)).map(([theme]) => theme);
}

function classifyItem(item, index) {
  const candidates = (index.get(normalize(item.word)) ?? [])
    .map((entry) => rankCandidate(entry, item))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  const selected = candidates[0];

  if (!selected) {
    return {
      level: item.level,
      word: item.word,
      reading: item.reading,
      partsOfSpeech: ['other'],
      verbGroups: [],
      transitivities: [],
      adjectiveTypes: [],
      themes: classifyThemes(item.meanings),
      sourceReference: null,
      confidence: 0,
      needsReview: true,
    };
  }

  const tags = [...new Set(selected.senses.flatMap((sense) => sense.partOfSpeech))];
  const grammar = classifyGrammar(tags);
  const ambiguous =
    candidates.length > 1 &&
    Math.abs(selected.score - candidates[1].score) < 0.05 &&
    selected.entry.id !== candidates[1].entry.id;

  return {
    level: item.level,
    word: item.word,
    reading: item.reading,
    ...grammar,
    themes: classifyThemes(item.meanings),
    sourceReference: selected.entry.id,
    confidence: ambiguous ? 0.7 : selected.score > 0 ? 0.95 : 0.85,
    needsReview: ambiguous,
  };
}

function sqlFor(rows, jmdictVersion) {
  const payload = JSON.stringify(rows).replaceAll('$taxonomy$', '$ taxonomy $');
  return `begin;

-- Generated by scripts/classify-vocabulary-n5-n4.mjs.
-- Grammar metadata comes from JMdict ${jmdictVersion}; themes use reviewed,
-- deterministic Kotomichi keyword rules. This seed intentionally covers N5/N4 only.
with seed as (
  select *
  from jsonb_to_recordset($taxonomy$${payload}$taxonomy$::jsonb) as record (
    level public.jlpt_level,
    word text,
    reading text,
    "partsOfSpeech" jsonb,
    "verbGroups" jsonb,
    transitivities jsonb,
    "adjectiveTypes" jsonb,
    themes jsonb,
    "sourceReference" text,
    confidence numeric,
    "needsReview" boolean
  )
),
classified as (
  select
    content.id as content_item_id,
    array(
      select value::public.vocabulary_part_of_speech
      from jsonb_array_elements_text(seed."partsOfSpeech")
    ) as parts_of_speech,
    array(
      select value::public.vocabulary_verb_group
      from jsonb_array_elements_text(seed."verbGroups")
    ) as verb_groups,
    array(
      select value::public.vocabulary_transitivity
      from jsonb_array_elements_text(seed.transitivities)
    ) as transitivities,
    array(
      select value::public.vocabulary_adjective_type
      from jsonb_array_elements_text(seed."adjectiveTypes")
    ) as adjective_types,
    array(
      select value::public.vocabulary_theme
      from jsonb_array_elements_text(seed.themes)
    ) as themes,
    seed."sourceReference" as source_reference,
    seed.confidence,
    seed."needsReview" as needs_review
  from seed
  join public.content_items as content
    on content.content_type = 'vocabulary'
    and content.level = seed.level
    and content.word = seed.word
    and coalesce(content.reading, '') = seed.reading
)
insert into public.vocabulary_taxonomy (
  content_item_id,
  parts_of_speech,
  verb_groups,
  transitivities,
  adjective_types,
  themes,
  classification_source,
  source_reference,
  confidence,
  needs_review
)
select
  content_item_id,
  parts_of_speech,
  verb_groups,
  transitivities,
  adjective_types,
  themes,
  'jmdict+kotomichi-rules',
  source_reference,
  confidence,
  needs_review
from classified
on conflict (content_item_id)
do update set
  parts_of_speech = excluded.parts_of_speech,
  verb_groups = excluded.verb_groups,
  transitivities = excluded.transitivities,
  adjective_types = excluded.adjective_types,
  themes = excluded.themes,
  classification_source = excluded.classification_source,
  source_reference = excluded.source_reference,
  confidence = excluded.confidence,
  needs_review = excluded.needs_review,
  updated_at = now()
where vocabulary_taxonomy.classification_source <> 'editorial';

do $$
declare
  expected_count integer := ${rows.length};
  actual_count integer;
begin
  select count(*)
  into actual_count
  from public.vocabulary_taxonomy as taxonomy
  join public.content_items as content on content.id = taxonomy.content_item_id
  where content.level in ('N5', 'N4');

  if actual_count <> expected_count then
    raise exception
      'N5/N4 vocabulary taxonomy count mismatch: expected %, got %',
      expected_count,
      actual_count;
  end if;
end;
$$;

commit;
`;
}

async function main() {
  const jmdictPath = process.argv[2] ?? DEFAULT_JMDICT;
  const [jmdict, ...datasets] = await Promise.all([
    readFile(jmdictPath, 'utf8').then(JSON.parse),
    ...Object.values(OPENJLPT_FILES).map((path) =>
      readFile(path, 'utf8').then(JSON.parse),
    ),
  ]);
  const items = datasets.flat();
  const index = buildIndex(jmdict.words);
  const rows = items.map((item) => classifyItem(item, index));
  await writeFile(OUTPUT, sqlFor(rows, jmdict.version), 'utf8');

  const counts = {
    total: rows.length,
    matched: rows.filter((row) => row.sourceReference).length,
    needsReview: rows.filter((row) => row.needsReview).length,
    themed: rows.filter((row) => row.themes.length).length,
    nouns: rows.filter((row) => row.partsOfSpeech.includes('noun')).length,
    verbs: rows.filter((row) => row.partsOfSpeech.includes('verb')).length,
    adjectives: rows.filter((row) => row.partsOfSpeech.includes('adjective')).length,
    other: rows.filter((row) => row.partsOfSpeech.includes('other')).length,
  };
  console.log(JSON.stringify(counts, null, 2));
  console.log(`Wrote ${OUTPUT}`);
}

await main();
