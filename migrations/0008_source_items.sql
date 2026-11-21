-- Review queue for the source collector (docs/sources.md). Separate from reports on purpose: nothing in the API,
-- the matcher, the evals or the fusion weights reads this table. Only the owner's review page does.
CREATE TABLE source_items (
  id INTEGER PRIMARY KEY,
  source TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  text TEXT,
  lang TEXT,
  country TEXT,
  published_at TEXT,
  collected_at TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'useful', 'skip')),
  note TEXT,
  reviewed_at TEXT
);
CREATE INDEX source_items_queue ON source_items (status, collected_at);
