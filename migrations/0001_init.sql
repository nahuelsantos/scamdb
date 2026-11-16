-- scamdb D1 schema (phase 2): private reports, API keys, usage and abuse counters.
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  country TEXT NOT NULL,
  channel TEXT,
  text TEXT,
  what_happened TEXT,
  contact TEXT,
  source TEXT NOT NULL,
  key_id TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'promoted', 'rejected'))
);
CREATE INDEX IF NOT EXISTS reports_status_created ON reports (status, created_at);
CREATE TABLE IF NOT EXISTS keys (
  id TEXT PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,
  prefix TEXT NOT NULL,
  github_id INTEGER UNIQUE NOT NULL,
  github_login TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS usage (
  key_id TEXT NOT NULL,
  day TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_id, day, endpoint)
);
CREATE TABLE IF NOT EXISTS hits (
  bucket TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, day)
);
