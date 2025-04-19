-- Migration: Add day_of_the_week column to backtests table

ALTER TABLE public.backtests
ADD COLUMN day_of_the_week TEXT;
