-- Cover the composite session/user foreign key in its declared column order.
create index learning_session_items_session_user_idx
  on public.learning_session_items (session_id, user_id);
