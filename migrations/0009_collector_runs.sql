-- One row per collector run (docs/sources.md): what each source returned, for the review page's Runs and Sources tabs.
-- Like source_items, nothing in the API, the matcher, the evals or the fusion weights reads it.
CREATE TABLE collector_runs (
  id INTEGER PRIMARY KEY,
  received_at TEXT NOT NULL,
  started_at TEXT,
  host TEXT,
  ok INTEGER NOT NULL,
  candidates INTEGER NOT NULL DEFAULT 0,
  added INTEGER NOT NULL DEFAULT 0,
  known INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  sources TEXT NOT NULL
);
CREATE INDEX collector_runs_time ON collector_runs (received_at);
