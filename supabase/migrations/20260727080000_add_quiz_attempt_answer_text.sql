begin;

alter table public.quiz_attempts
  add column answer_text text,
  add constraint quiz_attempts_answer_text_valid check (
    answer_text is null
    or (
      char_length(btrim(answer_text)) between 1 and 500
    )
  );

commit;
