'use client';

import { useState } from 'react';

import { SubmitButton } from '@/components/auth/submit-button';
import {
  CONTENT_TYPES,
  LEVELS,
  VOCABULARY_ADJECTIVE_TYPES,
  VOCABULARY_PARTS_OF_SPEECH,
  VOCABULARY_THEMES,
  VOCABULARY_TRANSITIVITIES,
  VOCABULARY_VERB_GROUPS,
  type ContentType,
  type Level,
} from '@/features/catalog/types';
import {
  adjectiveTypeLabels,
  partOfSpeechLabels,
  themeLabels,
  transitivityLabels,
  verbGroupLabels,
} from '@/features/catalog/vocabulary-taxonomy';
import { createLearningSession } from '@/features/learning/actions';
import { SESSION_ITEM_COUNTS } from '@/features/learning/session-schema';

const contentTypeLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

export function LearningSessionForm({
  defaultItemCount,
  decks = [],
  targetLevel,
}: {
  defaultItemCount: (typeof SESSION_ITEM_COUNTS)[number];
  decks?: { id: string; title: string; kind: 'official' | 'user' }[];
  targetLevel: Level;
}) {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([...CONTENT_TYPES]);

  function toggleContentType(type: ContentType, checked: boolean) {
    setContentTypes((current) =>
      checked
        ? [...new Set([...current, type])]
        : current.filter((value) => value !== type),
    );
  }

  return (
    <form action={createLearningSession} className="mt-10 grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="grid gap-3 rounded-3xl border border-border bg-surface p-6 font-semibold shadow-card sm:p-8">
          1. Deck
          <select
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
            name="deck_id"
            required
          >
            <option value="">Pilih deck</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.kind === 'official' ? 'Kotomichi · ' : ''}{deck.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-3 rounded-3xl border border-border bg-surface p-6 font-semibold shadow-card sm:p-8">
          2. Arah kartu
          <select
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
            defaultValue="recognition"
            name="study_direction"
          >
            <option value="recognition">Recognition · Jepang → makna</option>
            <option value="production">Production · Indonesia → Jepang</option>
            <option value="mixed">Mixed · bergantian</option>
          </select>
        </label>
      </div>
      <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <legend className="px-2 text-lg font-semibold">3. Level</legend>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {LEVELS.map((level) => (
            <label className="cursor-pointer" key={level}>
              <input
                className="peer sr-only"
                defaultChecked={targetLevel === level}
                name="level"
                type="radio"
                value={level}
              />
              <span className="grid min-h-16 place-items-center rounded-xl border border-border bg-background font-bold transition peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2">
                {level}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 md:grid-cols-2">
        <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <legend className="px-2 text-lg font-semibold">4. Jenis materi</legend>
          <div className="mt-4 grid gap-3">
            {CONTENT_TYPES.map((type) => (
              <label className="cursor-pointer" key={type}>
                <input
                  checked={contentTypes.includes(type)}
                  className="peer sr-only"
                  name="content_type"
                  onChange={(event) => toggleContentType(type, event.target.checked)}
                  type="checkbox"
                  value={type}
                />
                <span className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 font-semibold transition peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2">
                  {contentTypeLabels[type]}
                  <span aria-hidden="true">✓</span>
                </span>
              </label>
            ))}
          </div>

          {contentTypes.includes('vocabulary') ? (
            <fieldset className="mt-5 grid gap-3 border-t border-border pt-5">
              <legend className="text-sm font-bold">Subkategori vocabulary</legend>
              <p className="text-xs leading-5 text-muted-foreground">
                Opsional dan tersedia untuk materi N5/N4.
              </p>
              <LearningTaxonomySelect
                label="Kelas kata"
                name="vocabulary_pos"
                options={VOCABULARY_PARTS_OF_SPEECH.map((value) => ({
                  value,
                  label: partOfSpeechLabels[value],
                }))}
              />
              <LearningTaxonomySelect
                label="Kelompok verba"
                name="vocabulary_verb_group"
                options={VOCABULARY_VERB_GROUPS.map((value) => ({
                  value,
                  label: verbGroupLabels[value],
                }))}
              />
              <LearningTaxonomySelect
                label="Transitivitas"
                name="vocabulary_transitivity"
                options={VOCABULARY_TRANSITIVITIES.map((value) => ({
                  value,
                  label: transitivityLabels[value],
                }))}
              />
              <LearningTaxonomySelect
                label="Jenis adjektiva"
                name="vocabulary_adjective_type"
                options={VOCABULARY_ADJECTIVE_TYPES.map((value) => ({
                  value,
                  label: adjectiveTypeLabels[value],
                }))}
              />
              <LearningTaxonomySelect
                label="Tema"
                name="vocabulary_theme"
                options={VOCABULARY_THEMES.map((value) => ({
                  value,
                  label: themeLabels[value],
                }))}
              />
            </fieldset>
          ) : null}
        </fieldset>

        <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <legend className="px-2 text-lg font-semibold">5. Jumlah flashcard</legend>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {SESSION_ITEM_COUNTS.map((count) => (
              <label className="cursor-pointer" key={count}>
                <input
                  className="peer sr-only"
                  defaultChecked={defaultItemCount === count}
                  name="item_count"
                  type="radio"
                  value={count}
                />
                <span className="grid min-h-20 place-items-center rounded-xl border border-border bg-background text-xl font-bold transition peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <SubmitButton pendingLabel="Menyiapkan sesi…" disabled={!decks.length}>
          {decks.length ? 'Mulai sesi belajar' : 'Belum ada deck tersedia'}
        </SubmitButton>
      </div>
    </form>
  );
}

function LearningTaxonomySelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold">
      {label}
      <select
        className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary"
        defaultValue="all"
        name={name}
      >
        <option value="all">Semua</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
