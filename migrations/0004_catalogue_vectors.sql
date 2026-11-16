-- The catalogue's embeddings for the AI scorer, one row per catalogue version (only the latest is kept).
CREATE TABLE IF NOT EXISTS catalogue_vectors (
  version TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
