-- Migration: Add return_date to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_date DATE;
