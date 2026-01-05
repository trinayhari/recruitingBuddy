# Supabase Schema Setup - Step by Step

## Current Error
```
Could not find the table 'public.prompts' in the schema cache
```

This means the tables haven't been created yet. Follow these exact steps:

## Step 1: Check What's Missing

First, let's see which tables are missing:

Visit: `http://localhost:3000/api/check-supabase-schema`

This will show you exactly which tables need to be created.

## Step 2: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. **Sign in** to your account
3. **Click on your project** (the one matching your SUPABASE_URL)

## Step 3: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click the **"New query"** button (top right)

## Step 4: Copy the Schema

Copy this ENTIRE SQL block (everything below):

```sql
-- Supabase schema for requirements-based testing system

-- Prompts (project requirements)
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirement specifications
CREATE TABLE IF NOT EXISTS requirement_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  requirements JSONB NOT NULL,
  constraints JSONB DEFAULT '[]'::jsonb,
  edge_cases JSONB DEFAULT '[]'::jsonb,
  weights JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated test suites
CREATE TABLE IF NOT EXISTS test_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_spec_id UUID REFERENCES requirement_specs(id) ON DELETE CASCADE,
  language VARCHAR(50) NOT NULL,
  framework VARCHAR(50) NOT NULL,
  test_files JSONB NOT NULL,
  runner_config JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions (extends existing brief system)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  github_url TEXT,
  video_link TEXT,
  chat_export TEXT,
  reflections TEXT,
  brief_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test execution runs
CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  test_suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  results JSONB,
  requirement_scores JSONB,
  overall_score NUMERIC,
  weighted_score NUMERIC,
  confidence_score NUMERIC,
  execution_metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requirement_specs_prompt_id ON requirement_specs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_requirement_spec_id ON test_suites(requirement_spec_id);
CREATE INDEX IF NOT EXISTS idx_submissions_prompt_id ON submissions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_submission_id ON test_runs(submission_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_test_suite_id ON test_runs(test_suite_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);

-- Row Level Security (RLS) policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on prompts" ON prompts FOR ALL USING (true);
CREATE POLICY "Allow all operations on requirement_specs" ON requirement_specs FOR ALL USING (true);
CREATE POLICY "Allow all operations on test_suites" ON test_suites FOR ALL USING (true);
CREATE POLICY "Allow all operations on submissions" ON submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations on test_runs" ON test_runs FOR ALL USING (true);
```

## Step 5: Paste and Run

1. **Paste** the SQL above into the Supabase SQL Editor
2. **Click the "Run" button** (or press `Cmd+Enter` / `Ctrl+Enter`)
3. **Wait** for the success message (should say "Success. No rows returned")

## Step 6: Verify Tables Were Created

1. In Supabase dashboard, click **"Table Editor"** in the left sidebar
2. You should see these 5 tables:
   - ✅ `prompts`
   - ✅ `requirement_specs`
   - ✅ `test_suites`
   - ✅ `submissions`
   - ✅ `test_runs`

## Step 7: Test the Connection

Visit: `http://localhost:3000/api/check-supabase-schema`

You should now see:
```json
{
  "success": true,
  "message": "All tables exist! Schema is set up correctly.",
  "tables": {
    "prompts": { "exists": true },
    "requirement_specs": { "exists": true },
    "test_suites": { "exists": true },
    "submissions": { "exists": true },
    "test_runs": { "exists": true }
  }
}
```

## Troubleshooting

### "Permission denied" error
- Make sure you copied ALL the SQL, including the RLS policies at the end
- The policies allow all operations, so this shouldn't happen if you ran everything

### "Table already exists" warnings
- This is fine! The schema uses `IF NOT EXISTS`, so it's safe to run multiple times

### Still seeing errors after running?
1. **Restart your Next.js dev server**: Stop it (Ctrl+C) and run `npm run dev` again
2. **Check the Table Editor**: Make sure all 5 tables appear
3. **Try the check endpoint again**: `http://localhost:3000/api/check-supabase-schema`

### Can't find SQL Editor?
- Make sure you're in the correct Supabase project
- Look for "SQL Editor" in the left sidebar (it's usually near the bottom)
- If you don't see it, you might need to upgrade your Supabase plan (free tier includes SQL Editor)

## Quick Test

After setup, try submitting a new submission with a project prompt. It should work now!

