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
  type VocabularyPartOfSpeech,
} from '@/features/catalog/types';
import {
  adjectiveTypeLabels,
  partOfSpeechLabels,
  themeLabels,
  transitivityLabels,
  verbGroupLabels,
} from '@/features/catalog/vocabulary-taxonomy';
import { saveEditorialContent } from '@/features/editor/actions';
import type { EditorContentFormData } from '@/features/editor/queries';

const TYPE_LABELS = {
  vocabulary: 'Kosakata',
  kanji: 'Kanji',
  grammar: 'Tata bahasa',
} as const;

const fieldClass =
  'rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-primary';

export function EditorialContentForm({
  initial,
}: {
  initial: EditorContentFormData;
}) {
  const [contentType, setContentType] = useState<ContentType>(initial.type);
  const [partsOfSpeech, setPartsOfSpeech] = useState<VocabularyPartOfSpeech[]>(
    initial.partsOfSpeech,
  );
  const isEditing = Boolean(initial.id);

  return (
    <form action={saveEditorialContent} className="grid gap-6">
      <input name="content_item_id" type="hidden" value={initial.id ?? ''} />
      {isEditing ? (
        <input name="content_type" type="hidden" value={contentType} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Jenis materi
          <select
            className={fieldClass}
            disabled={isEditing}
            name={isEditing ? undefined : 'content_type'}
            onChange={(event) => setContentType(event.target.value as ContentType)}
            value={contentType}
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Level JLPT
          <select className={fieldClass} defaultValue={initial.level} name="level">
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          {contentType === 'kanji'
            ? 'Karakter'
            : contentType === 'grammar'
              ? 'Pola'
              : 'Kata'}
          <input
            className={fieldClass}
            defaultValue={initial.title}
            maxLength={200}
            name="title"
            required
          />
        </label>
        {contentType === 'vocabulary' ? (
          <label className="grid gap-2 text-sm font-semibold">
            Cara baca
            <input
              className={fieldClass}
              defaultValue={initial.reading}
              maxLength={200}
              name="reading"
            />
          </label>
        ) : (
          <input name="reading" type="hidden" value={initial.reading} />
        )}
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Makna
        <textarea
          className={`${fieldClass} min-h-28`}
          defaultValue={initial.meanings}
          name="meanings"
          placeholder="Satu makna per baris"
          required
        />
      </label>

      {contentType === 'vocabulary' ? (
        <section className="grid gap-5 rounded-2xl border border-border bg-background p-5">
          <div>
            <p className="font-serif text-xl font-bold">Klasifikasi kosakata</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Kelas kata dapat lebih dari satu. Detail verba dan adjektiva hanya diisi
              bila kelas katanya sesuai.
            </p>
          </div>
          <CheckGroup
            initial={initial.partsOfSpeech}
            label="Kelas kata"
            name="parts_of_speech"
            onChange={(values) =>
              setPartsOfSpeech(values as VocabularyPartOfSpeech[])
            }
            options={VOCABULARY_PARTS_OF_SPEECH.map((value) => ({
              value,
              label: partOfSpeechLabels[value],
            }))}
          />
          {partsOfSpeech.includes('verb') ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <CheckGroup
                initial={initial.verbGroups}
                label="Kelompok kata kerja"
                name="verb_groups"
                options={VOCABULARY_VERB_GROUPS.map((value) => ({
                  value,
                  label: verbGroupLabels[value],
                }))}
              />
              <CheckGroup
                initial={initial.transitivities}
                label="Transitivitas"
                name="transitivities"
                options={VOCABULARY_TRANSITIVITIES.map((value) => ({
                  value,
                  label: transitivityLabels[value],
                }))}
              />
            </div>
          ) : null}
          {partsOfSpeech.includes('adjective') ? (
            <CheckGroup
              initial={initial.adjectiveTypes}
              label="Jenis kata sifat"
              name="adjective_types"
              options={VOCABULARY_ADJECTIVE_TYPES.map((value) => ({
                value,
                label: adjectiveTypeLabels[value],
              }))}
            />
          ) : null}
          <CheckGroup
            initial={initial.themes}
            label="Tema"
            name="themes"
            options={VOCABULARY_THEMES.map((value) => ({
              value,
              label: themeLabels[value],
            }))}
          />
        </section>
      ) : null}

      {contentType === 'kanji' ? (
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              On&apos;yomi
              <input className={fieldClass} defaultValue={initial.onyomi} name="onyomi" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Kun&apos;yomi
              <input className={fieldClass} defaultValue={initial.kunyomi} name="kunyomi" />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              ['strokes', 'Jumlah goresan', initial.strokes],
              ['grade', 'Grade', initial.grade],
              ['frequency', 'Frekuensi', initial.frequency],
            ].map(([name, label, value]) => (
              <label className="grid gap-2 text-sm font-semibold" key={name}>
                {label}
                <input
                  className={fieldClass}
                  defaultValue={value}
                  min={1}
                  name={name}
                  type="number"
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <>
          <input name="onyomi" type="hidden" value="" />
          <input name="kunyomi" type="hidden" value="" />
          <input name="strokes" type="hidden" value="" />
          <input name="grade" type="hidden" value="" />
          <input name="frequency" type="hidden" value="" />
        </>
      )}

      {contentType === 'grammar' ? (
        <>
          <label className="grid gap-2 text-sm font-semibold">
            Formation
            <textarea
              className={`${fieldClass} min-h-24`}
              defaultValue={initial.formation}
              name="formation"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Tags
            <input
              className={fieldClass}
              defaultValue={initial.tags}
              name="tags"
              placeholder="particle, verb"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Catatan
            <textarea
              className={`${fieldClass} min-h-28`}
              defaultValue={initial.notes}
              name="notes"
            />
          </label>
        </>
      ) : (
        <>
          <input name="formation" type="hidden" value="" />
          <input name="tags" type="hidden" value="" />
          <input name="notes" type="hidden" value="" />
        </>
      )}

      {contentType !== 'kanji' ? (
        <label className="grid gap-2 text-sm font-semibold">
          Contoh kalimat
          <textarea
            className={`${fieldClass} min-h-32`}
            defaultValue={initial.examples}
            name="examples"
            placeholder="日本語の文 | English translation"
          />
          <span className="text-xs font-normal text-muted-foreground">
            Satu contoh per baris, pisahkan bahasa Jepang dan terjemahan dengan tanda |.
          </span>
        </label>
      ) : (
        <input name="examples" type="hidden" value="" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <p className="text-xs leading-5 text-muted-foreground">
          {initial.origin === 'openjlpt'
            ? 'Perubahan disimpan sebagai override; data OpenJLPT asli tetap utuh.'
            : 'Materi ini dibuat oleh tim editorial.'}
        </p>
        <SubmitButton pendingLabel="Menyimpan materi…">
          {isEditing ? 'Simpan perubahan' : 'Buat materi'}
        </SubmitButton>
      </div>
    </form>
  );
}

function CheckGroup({
  initial,
  label,
  name,
  onChange,
  options,
}: {
  initial: readonly string[];
  label: string;
  name: string;
  onChange?: (values: string[]) => void;
  options: { value: string; label: string }[];
}) {
  const [selected, setSelected] = useState(() => new Set(initial));

  function toggle(value: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    setSelected(next);
    onChange?.([...next]);
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary"
            key={option.value}
          >
            <input
              checked={selected.has(option.value)}
              className="accent-primary"
              name={name}
              onChange={(event) => toggle(option.value, event.target.checked)}
              type="checkbox"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
