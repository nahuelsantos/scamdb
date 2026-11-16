-- Reports: the matcher's top catalogue match and the brands named (for the organisation feed's counts), and private
-- indicators: link domains and salted hashes of phone numbers (never the number). Deleted with their report.
ALTER TABLE reports ADD COLUMN scam_id TEXT;
ALTER TABLE reports ADD COLUMN brands TEXT;
CREATE INDEX IF NOT EXISTS reports_created ON reports (created_at);
CREATE TABLE IF NOT EXISTS report_indicators (
  report_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('domain', 'phone')),
  value TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS report_indicators_kind_value ON report_indicators (kind, value);
CREATE INDEX IF NOT EXISTS report_indicators_report ON report_indicators (report_id);
