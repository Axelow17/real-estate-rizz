-- RealEstate Rizz Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE players (
  fid INTEGER PRIMARY KEY,
  username TEXT,
  pfp_url TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Houses table
CREATE TABLE houses (
  fid INTEGER PRIMARY KEY REFERENCES players(fid) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  rizz_point INTEGER DEFAULT 0 CHECK (rizz_point >= 0),
  last_claim TIMESTAMPTZ,
  total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table (one vote per voter per day)
CREATE TABLE votes (
  voter_fid INTEGER REFERENCES players(fid) ON DELETE CASCADE,
  host_fid INTEGER REFERENCES houses(fid) ON DELETE CASCADE,
  voted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (voter_fid, voted_at)
);

-- Stays table
CREATE TABLE stays (
  id SERIAL PRIMARY KEY,
  guest_fid INTEGER REFERENCES players(fid) ON DELETE CASCADE,
  host_fid INTEGER REFERENCES houses(fid) ON DELETE CASCADE,
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  CHECK (end_at IS NULL OR end_at >= start_at)
);

-- Indexes for performance
CREATE INDEX idx_players_last_seen ON players(last_seen);
CREATE INDEX idx_houses_level ON houses(level);
CREATE INDEX idx_houses_rizz_point ON houses(rizz_point);
CREATE INDEX idx_votes_host_fid_voted_at ON votes(host_fid, voted_at DESC);
CREATE INDEX idx_votes_voted_at ON votes(voted_at DESC);
CREATE INDEX idx_stays_guest_fid_end_at ON stays(guest_fid, end_at) WHERE end_at IS NULL;
CREATE INDEX idx_stays_host_fid_start_at ON stays(host_fid, start_at DESC);

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