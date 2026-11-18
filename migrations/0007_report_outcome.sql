-- What the person says the message turned out to be (docs/vision.md: free detection, improved by the labels people give).
ALTER TABLE reports ADD COLUMN outcome TEXT CHECK (outcome IS NULL OR outcome IN ('scam', 'genuine', 'unsure'));
