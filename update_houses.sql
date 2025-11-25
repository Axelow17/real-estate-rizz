-- Update existing houses for the new persistent mining system
-- This script is for manual updates if needed (migration is now built into supabase-schema.sql)

-- Ensure all houses have proper mining_rate set
UPDATE houses
SET mining_rate = 8 + FLOOR(level * 1.5)
WHERE mining_rate IS NULL OR mining_rate = 0;

-- Ensure all houses have last_tick set (for mining calculations)
UPDATE houses
SET last_tick = COALESCE(last_tick, updated_at, created_at, NOW())
WHERE last_tick IS NULL;

-- Optional: Ensure all houses have updated_at set
UPDATE houses
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;