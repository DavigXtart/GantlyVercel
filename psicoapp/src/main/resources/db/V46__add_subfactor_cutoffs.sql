-- Add cutoffs JSON field to subfactors for clinical interpretation levels
ALTER TABLE subfactors ADD COLUMN IF NOT EXISTS cutoffs TEXT;

-- Widen subfactor code field to support longer codes
ALTER TABLE subfactors ALTER COLUMN code TYPE VARCHAR(30);
