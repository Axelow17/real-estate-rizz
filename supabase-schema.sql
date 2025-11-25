-- RealEstate Rizz Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  fid INTEGER PRIMARY KEY,
  username TEXT,
  pfp_url TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
  fid INTEGER PRIMARY KEY REFERENCES players(fid) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  base_rizz INTEGER DEFAULT 0 CHECK (base_rizz >= 0),  -- claimed points only (mining progress calculated server-side)
  mining_rate INTEGER DEFAULT 8 CHECK (mining_rate >= 0),  -- points per hour
  last_tick TIMESTAMPTZ DEFAULT NOW(),  -- when mining was last calculated
  total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table (one vote per voter per day)
CREATE TABLE IF NOT EXISTS votes (
  voter_fid INTEGER REFERENCES players(fid) ON DELETE CASCADE,
  host_fid INTEGER REFERENCES houses(fid) ON DELETE CASCADE,
  voted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (voter_fid, voted_at)
);

-- Stays table
CREATE TABLE IF NOT EXISTS stays (
  id SERIAL PRIMARY KEY,
  guest_fid INTEGER REFERENCES players(fid) ON DELETE CASCADE,
  host_fid INTEGER REFERENCES houses(fid) ON DELETE CASCADE,
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  CHECK (end_at IS NULL OR end_at >= start_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players(last_seen);
CREATE INDEX IF NOT EXISTS idx_houses_fid ON houses(fid); -- For real-time subscriptions
CREATE INDEX IF NOT EXISTS idx_houses_level ON houses(level);
CREATE INDEX IF NOT EXISTS idx_houses_base_rizz ON houses(base_rizz);
CREATE INDEX IF NOT EXISTS idx_houses_updated_at ON houses(updated_at DESC); -- For real-time ordering
CREATE INDEX IF NOT EXISTS idx_votes_host_fid_voted_at ON votes(host_fid, voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_voted_at ON votes(voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_stays_guest_fid_end_at ON stays(guest_fid, end_at) WHERE end_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stays_host_fid_start_at ON stays(host_fid, start_at DESC); -- For ordering stays
CREATE INDEX IF NOT EXISTS idx_stays_start_at ON stays(start_at DESC); -- For real-time stays queries

-- Function to update updated_at on houses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON houses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_seen on players
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players SET last_seen = NOW() WHERE fid = NEW.fid;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_last_seen_on_house_change
    AFTER INSERT OR UPDATE ON houses
    FOR EACH ROW EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER update_player_last_seen_on_vote
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER update_player_last_seen_on_stay
    AFTER INSERT ON stays
    FOR EACH ROW EXECUTE FUNCTION update_last_seen();

-- Additional constraints for data integrity
ALTER TABLE houses ADD CONSTRAINT houses_level_max CHECK (level <= 10);
ALTER TABLE houses ADD CONSTRAINT houses_base_rizz_positive CHECK (base_rizz >= 0);
ALTER TABLE votes ADD CONSTRAINT votes_not_self_vote CHECK (voter_fid != host_fid);
ALTER TABLE stays ADD CONSTRAINT stays_not_self_stay CHECK (guest_fid != host_fid);
-- Data migration for existing houses (run after schema creation if upgrading)
-- Only run this if upgrading from old schema with rizz_point column
-- For fresh installs, skip this section

-- Check if old columns exist before migrating
DO $$
BEGIN
    -- Only migrate if rizz_point column exists (upgrading from old schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'houses' AND column_name = 'rizz_point'
    ) THEN
        -- Migrate existing rizz_point to base_rizz and set proper mining_rate
        UPDATE houses
        SET
          base_rizz = COALESCE(rizz_point, 0),
          mining_rate = 8 + FLOOR(level * 1.5),  -- Calculate mining rate based on level
          last_tick = COALESCE(last_claim, updated_at, created_at, NOW())
        WHERE base_rizz = 0 OR base_rizz IS NULL;

        -- Drop old columns after successful migration
        ALTER TABLE houses DROP COLUMN IF EXISTS rizz_point;
        ALTER TABLE houses DROP COLUMN IF EXISTS last_claim;
    ELSE
        -- Fresh install - just set mining_rate for existing houses
        UPDATE houses
        SET mining_rate = 8 + FLOOR(level * 1.5)
        WHERE mining_rate = 8; -- Only update default values
    END IF;
END $$;

-- Performance optimizations
-- Enable Row Level Security (RLS) for better security (optional)
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- Vacuum and analyze for optimal performance (run periodically)
-- VACUUM ANALYZE players, houses, votes, stays;

-- Schema ready for production use
-- Run this entire script in Supabase SQL Editor to set up the database