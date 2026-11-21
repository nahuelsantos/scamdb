-- On/off switches flipped on the review page (docs/sources.md). sources/registry.json stays the default; a row here
-- overrides `allowed` for one source. The collector reads these before each run. Nothing else reads this table.
CREATE TABLE source_settings (
  id TEXT PRIMARY KEY,
  allowed INTEGER NOT NULL,
  changed_at TEXT NOT NULL,
  changed_by TEXT
);
