-- Migration: Relax NOT NULL constraints on columns in backtests table to match data
-- Generated at 2025-04-19T20:19:54+03:00

ALTER TABLE public.backtests
ALTER COLUMN swing_formation_time DROP NOT NULL,
ALTER COLUMN obviousness_rating DROP NOT NULL,
ALTER COLUMN mss_time DROP NOT NULL,
ALTER COLUMN pips_from_swing_low DROP NOT NULL,
ALTER COLUMN pips_from_mss DROP NOT NULL;

-- Add more ALTER COLUMN ... DROP NOT NULL here if further mismatches are found

-- Note: This migration relaxes NOT NULL constraints on columns that have NULLs in your data.
-- Verify after running this migration that all inserts succeed.
