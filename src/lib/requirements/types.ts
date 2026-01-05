// Types for requirements-based testing system

export type RequirementType = 'functional' | 'nonfunctional' | 'io' | 'constraint';

export interface Requirement {
  id: string; // e.g., "REQ-001"
  type: RequirementType;
  description: string;
  acceptance_criteria: string[];
  weight: number; // 1-10, default 5
  testable: boolean; // default true
}

export interface Constraint {
  type: string; // 'performance', 'library', 'io_format', 'error_handling', etc.
  description: string;
}

export interface RequirementSpec {
  requirements: Requirement[];
  constraints: Constraint[];
  edge_cases: string[];
  metadata: {
    model: string;
    generated_at: string;
    validation_status: 'valid' | 'repaired' | 'partial';
    validation_notes?: string;
  };
}

export interface TestFile {
  filename: string;
  content: string;
  requirement_ids: string[]; // Which requirements this test file covers
}

export interface GeneratedTestSuite {
  id: string;
  requirement_spec_id: string;
  language: string;
  framework: string;
  test_files: TestFile[];
  runner_config: Record<string, any>; // Framework-specific config
  metadata: {
    model: string;
    generated_at: string;
    hygiene_status: 'valid' | 'repaired' | 'failed';
    hygiene_errors?: string[];
  };
}

export interface TestResult {
  test_name: string;
  requirement_ids: string[];
  status: 'pass' | 'fail' | 'error' | 'timeout';
  duration_ms: number;
  stdout?: string;
  stderr?: string;
  error_message?: string;
  stack_trace?: string;
}

export interface SandboxResult {
  success: boolean;
  test_results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    timeouts: number;
  };
  execution_time_ms: number;
  metadata: {
    container_id?: string;
    exit_code: number;
    resource_usage?: {
      memory_mb?: number;
      cpu_percent?: number;
    };
  };
}

export interface RequirementScore {
  requirement_id: string;
  status: 'pass' | 'fail' | 'partial' | 'untested';
  passing_tests: number;
  total_tests: number;
  failing_tests: TestResult[];
  weight: number;
}

export interface OverallScore {
  requirements_met: number;
  total_requirements: number;
  percentage: number;
  weighted_score: number; // 0-100
  confidence_score: number; // 0-100
  breakdown: {
    functional: { passed: number; total: number };
    nonfunctional: { passed: number; total: number };
    io: { passed: number; total: number };
    constraints: { passed: number; total: number };
  };
}

export interface TestRun {
  id: string;
  submission_id: string;
  test_suite_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: SandboxResult;
  requirement_scores?: RequirementScore[];
  overall_score?: OverallScore;
  execution_metadata?: {
    duration_ms: number;
    started_at: string;
    completed_at?: string;
    error?: string;
  };
}

