// Zod schemas for validating requirement specifications and test suites

import { z } from 'zod';

export const RequirementSchema = z.object({
  id: z.string().regex(/^REQ-\d{3}$/, 'Requirement ID must match REQ-XXX format'),
  type: z.enum(['functional', 'nonfunctional', 'io', 'constraint']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  acceptance_criteria: z.array(z.string().min(5)).min(1, 'At least one acceptance criterion required'),
  weight: z.number().int().min(1).max(10).default(5),
  testable: z.boolean().default(true),
});

export const ConstraintSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(5),
});

export const RequirementSpecSchema = z.object({
  requirements: z.array(RequirementSchema).min(1, 'At least one requirement is required'),
  constraints: z.array(ConstraintSchema).default([]),
  edge_cases: z.array(z.string()).default([]),
  metadata: z.object({
    model: z.string(),
    generated_at: z.string(),
    validation_status: z.enum(['valid', 'repaired', 'partial']),
    validation_notes: z.string().optional(),
  }),
});

export const TestFileSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(10),
  requirement_ids: z.array(z.string()).min(1, 'Each test file must cover at least one requirement'),
});

export const GeneratedTestSuiteSchema = z.object({
  id: z.string().uuid(),
  requirement_spec_id: z.string().uuid(),
  language: z.string().min(1),
  framework: z.string().min(1),
  test_files: z.array(TestFileSchema).min(1),
  runner_config: z.record(z.any()),
  metadata: z.object({
    model: z.string(),
    generated_at: z.string(),
    hygiene_status: z.enum(['valid', 'repaired', 'failed']),
    hygiene_errors: z.array(z.string()).optional(),
  }),
});

export const TestResultSchema = z.object({
  test_name: z.string(),
  requirement_ids: z.array(z.string()),
  status: z.enum(['pass', 'fail', 'error', 'timeout']),
  duration_ms: z.number().nonnegative(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  error_message: z.string().optional(),
  stack_trace: z.string().optional(),
});

export const SandboxResultSchema = z.object({
  success: z.boolean(),
  test_results: z.array(TestResultSchema),
  summary: z.object({
    total: z.number().nonnegative(),
    passed: z.number().nonnegative(),
    failed: z.number().nonnegative(),
    errors: z.number().nonnegative(),
    timeouts: z.number().nonnegative(),
  }),
  execution_time_ms: z.number().nonnegative(),
  metadata: z.object({
    container_id: z.string().optional(),
    exit_code: z.number().int(),
    resource_usage: z.object({
      memory_mb: z.number().optional(),
      cpu_percent: z.number().optional(),
    }).optional(),
  }),
});

// Type exports
export type Requirement = z.infer<typeof RequirementSchema>;
export type RequirementSpec = z.infer<typeof RequirementSpecSchema>;
export type TestFile = z.infer<typeof TestFileSchema>;
export type GeneratedTestSuite = z.infer<typeof GeneratedTestSuiteSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;
export type SandboxResult = z.infer<typeof SandboxResultSchema>;

