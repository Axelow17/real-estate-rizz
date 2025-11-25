-- RealEstate Rizz Production Database Schema
-- Run this in Supabase SQL Editor to set up the production database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Farcaster users identified by fid)
CREATE TABLE IF NOT EXISTS players (
  fid INTEGER PRIMARY KEY,                    -- Farcaster user ID
  username TEXT,                              -- Farcaster username
  pfp_url TEXT,                               -- Profile picture URL
  last_seen TIMESTAMPTZ DEFAULT NOW()         -- Last activity timestamp
);

-- Houses table (each user has one house)
CREATE TABLE IF NOT EXISTS houses (
  fid INTEGER PRIMARY KEY REFERENCES players(fid) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  rizz_point INTEGER DEFAULT 0 CHECK (rizz_point >= 0),
  mining_rate INTEGER DEFAULT 8 CHECK (mining_rate >= 0),
  last_tick TIMESTAMPTZ DEFAULT NOW(),
  total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table (one vote per user per day)
CREATE TABLE IF NOT EXISTS votes (
  voter_fid INTEGER REFERENCES players(fid) ON DELETE CASCADE,
  host_fid INTEGER REFERENCES houses(fid) ON DELETE CASCADE,
  voted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (voter_fid, voted_at)
);

-- Stays table (guests staying at houses)
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
CREATE INDEX IF NOT EXISTS idx_houses_rizz_point ON houses(rizz_point);
CREATE INDEX IF NOT EXISTS idx_houses_updated_at ON houses(updated_at DESC); -- For real-time ordering
CREATE INDEX IF NOT EXISTS idx_houses_total_votes ON houses(total_votes DESC); -- For leaderboard ordering
CREATE INDEX IF NOT EXISTS idx_votes_voter_fid ON votes(voter_fid);
CREATE INDEX IF NOT EXISTS idx_votes_host_fid ON votes(host_fid);
CREATE INDEX IF NOT EXISTS idx_votes_host_fid_voted_at ON votes(host_fid, voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_voted_at ON votes(voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_stays_guest_fid_end_at ON stays(guest_fid, end_at) WHERE end_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stays_host_fid_start_at ON stays(host_fid, start_at DESC); -- For ordering stays
CREATE INDEX IF NOT EXISTS idx_stays_start_at ON stays(start_at DESC); -- For real-time stays queries
CREATE INDEX IF NOT EXISTS idx_stays_guest_fid ON stays(guest_fid); -- For current stay queries
CREATE INDEX IF NOT EXISTS idx_stays_host_fid ON stays(host_fid); -- For guest list queries

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

-- Function to update last_seen on players for houses
CREATE OR REPLACE FUNCTION update_last_seen_houses()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players SET last_seen = NOW() WHERE fid = NEW.fid;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_last_seen_on_house_change
    AFTER INSERT OR UPDATE ON houses
    FOR EACH ROW EXECUTE FUNCTION update_last_seen_houses();

-- Function to update last_seen on players for votes
CREATE OR REPLACE FUNCTION update_last_seen_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players SET last_seen = NOW() WHERE fid = NEW.voter_fid;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_last_seen_on_vote
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION update_last_seen_votes();

-- Function to update last_seen on players for stays
CREATE OR REPLACE FUNCTION update_last_seen_stays()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players SET last_seen = NOW() WHERE fid = NEW.guest_fid;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_last_seen_on_stay
    AFTER INSERT ON stays
    FOR EACH ROW EXECUTE FUNCTION update_last_seen_stays();

-- Function to update total_votes on houses
CREATE OR REPLACE FUNCTION update_house_total_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE houses SET total_votes = total_votes + 1 WHERE fid = NEW.host_fid;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE houses SET total_votes = GREATEST(total_votes - 1, 0) WHERE fid = OLD.host_fid;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_house_votes_on_vote_insert
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION update_house_total_votes();

CREATE TRIGGER update_house_votes_on_vote_delete
    AFTER DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_house_total_votes();

-- Additional constraints for data integrity
ALTER TABLE houses ADD CONSTRAINT houses_level_max CHECK (level <= 10);
ALTER TABLE houses ADD CONSTRAINT houses_rizz_point_positive CHECK (rizz_point >= 0);
ALTER TABLE votes ADD CONSTRAINT votes_not_self_vote CHECK (voter_fid != host_fid);
ALTER TABLE stays ADD CONSTRAINT stays_not_self_stay CHECK (guest_fid != host_fid);

-- Performance optimizations
-- Enable Row Level Security (RLS) for better security (optional)
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- Vacuum and analyze for optimal performance (run periodically)
-- VACUUM ANALYZE players, houses, votes, stays;

-- Production schema ready
-- Run this entire script in Supabase SQL Editor