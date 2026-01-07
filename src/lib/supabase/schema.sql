-- Supabase schema for requirements-based testing system

-- Prompts (project requirements)
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shareable_token VARCHAR(64) UNIQUE,
  title VARCHAR(255),
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- User-specific indexes
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_shareable_token ON prompts(shareable_token);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_created ON submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_prompt_id ON submissions(prompt_id);

-- Storage buckets (to be created in Supabase dashboard)
-- test-artifacts: Generated test files, runner configs
-- test-outputs: stdout, stderr, logs from test runs
-- submissions: Uploaded zip files (optional)

-- Row Level Security (RLS) policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on prompts" ON prompts;
DROP POLICY IF EXISTS "Allow all operations on requirement_specs" ON requirement_specs;
DROP POLICY IF EXISTS "Allow all operations on test_suites" ON test_suites;
DROP POLICY IF EXISTS "Allow all operations on submissions" ON submissions;
DROP POLICY IF EXISTS "Allow all operations on test_runs" ON test_runs;

-- Prompts: Users can only access their own
CREATE POLICY "Users can view own prompts" ON prompts 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prompts" ON prompts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON prompts 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON prompts 
  FOR DELETE USING (auth.uid() = user_id);

-- Submissions: Users can access their own OR submissions to their assessments
CREATE POLICY "Users can view own submissions" ON submissions 
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = submissions.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own submissions" ON submissions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON submissions 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own submissions" ON submissions 
  FOR DELETE USING (auth.uid() = user_id);

-- Prompts: Allow public read access via shareable_token (for submission page)
CREATE POLICY "Public can view prompts by token" ON prompts 
  FOR SELECT USING (shareable_token IS NOT NULL);

-- Requirement specs: Users can access if they own the parent prompt
CREATE POLICY "Users can view own requirement_specs" ON requirement_specs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = requirement_specs.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own requirement_specs" ON requirement_specs 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompts 
      WHERE prompts.id = requirement_specs.prompt_id 
      AND prompts.user_id = auth.uid()
    )
  );

-- Test suites: Users can access if they own the parent requirement spec
CREATE POLICY "Users can view own test_suites" ON test_suites 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requirement_specs rs
      JOIN prompts p ON p.id = rs.prompt_id
      WHERE rs.id = test_suites.requirement_spec_id 
      AND p.user_id = auth.uid()
    )
  );

-- Test runs: Users can access if they own the parent submission
CREATE POLICY "Users can view own test_runs" ON test_runs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions 
      WHERE submissions.id = test_runs.submission_id 
      AND submissions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own test_runs" ON test_runs 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions 
      WHERE submissions.id = test_runs.submission_id 
      AND submissions.user_id = auth.uid()
    )
  );

