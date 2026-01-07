-- Migration: Add assessment fields to prompts table
-- Run this in your Supabase SQL Editor if you already have the prompts table

-- Add shareable_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompts' AND column_name = 'shareable_token'
    ) THEN
        ALTER TABLE prompts ADD COLUMN shareable_token VARCHAR(64) UNIQUE;
    END IF;
END $$;

-- Add title column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prompts' AND column_name = 'title'
    ) THEN
        ALTER TABLE prompts ADD COLUMN title VARCHAR(255);
    END IF;
END $$;

-- Create index on shareable_token if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_prompts_shareable_token ON prompts(shareable_token);

-- Update RLS policy to allow public read access via shareable_token
DROP POLICY IF EXISTS "Public can view prompts by token" ON prompts;
CREATE POLICY "Public can view prompts by token" ON prompts 
  FOR SELECT USING (shareable_token IS NOT NULL);

