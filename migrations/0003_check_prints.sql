-- Probe detection: a 64-bit SimHash of each check's text (not the text), per key or daily IP hash, kept 2 days.
CREATE TABLE IF NOT EXISTS check_prints (
  subject TEXT NOT NULL,
  day TEXT NOT NULL,
  print TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS check_prints_subject_day ON check_prints (subject, day);
