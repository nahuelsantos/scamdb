-- Organisation feed access: the owner approves a key for the feed (tools/orgs.mjs) and names its organisation.
ALTER TABLE keys ADD COLUMN org TEXT;
ALTER TABLE keys ADD COLUMN feed INTEGER NOT NULL DEFAULT 0;
