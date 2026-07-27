-- Remote migration version: 20260727035001
-- OpenJLPT can contain the same word, character, or pattern at different JLPT levels.
-- Composite identity and uniqueness are enforced by content_items, where level is included.
begin;

alter table public.vocab
  drop constraint vocab_snapshot_identity_unique;

alter table public.kanji
  drop constraint kanji_snapshot_identity_unique;

alter table public.grammar
  drop constraint grammar_snapshot_identity_unique;

commit;
