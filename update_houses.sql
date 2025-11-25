-- Update existing houses to have last_claim set to NOW() if null
-- This allows existing users to claim immediately and fixes the NaN timer issue

UPDATE houses
SET last_claim = NOW()
WHERE last_claim IS NULL;

-- Optional: Also ensure all houses have updated_at set
UPDATE houses
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;