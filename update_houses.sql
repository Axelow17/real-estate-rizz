-- Update existing houses to have last_claim set if null
-- This fixes the NaN timer issue for houses created before the last_claim field was properly initialized

UPDATE houses
SET last_claim = COALESCE(updated_at, created_at, NOW()::timestamp)
WHERE last_claim IS NULL;

-- Optional: Also ensure all houses have updated_at set
UPDATE houses
SET updated_at = COALESCE(updated_at, created_at, NOW()::timestamp)
WHERE updated_at IS NULL;