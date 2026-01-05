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

-- For now, allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on prompts" ON prompts FOR ALL USING (true);
CREATE POLICY "Allow all operations on requirement_specs" ON requirement_specs FOR ALL USING (true);
CREATE POLICY "Allow all operations on test_suites" ON test_suites FOR ALL USING (true);
CREATE POLICY "Allow all operations on submissions" ON submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations on test_runs" ON test_runs FOR ALL USING (true);

