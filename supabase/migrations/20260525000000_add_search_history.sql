CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, query)
);

CREATE INDEX search_history_session_idx ON public.search_history (session_id, searched_at DESC);
