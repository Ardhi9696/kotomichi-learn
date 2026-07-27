create index vocabulary_taxonomy_reviewed_by_idx
  on public.vocabulary_taxonomy (reviewed_by)
  where reviewed_by is not null;
