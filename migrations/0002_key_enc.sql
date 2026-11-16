-- Keys are also stored encrypted (AES-GCM, key derived from SESSION_SECRET) so the owner can view theirs again.
-- Lookup still uses key_hash; the plain key is never stored.
ALTER TABLE keys ADD COLUMN key_enc TEXT;
