// POST /api/submissions/:id/run-tests - Execute tests against submission
// GET /api/submissions/:id/run-tests/:runId - Get test run results

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getTestSuite, saveTestRun, getTestRun } from '@/lib/supabase/store';
import { runSandboxedTests } from '@/lib/sandbox/runner';
import {
  calculateRequirementScores,
  calculateOverallScore,
  calculateConfidenceScore,
} from '@/lib/scoring/calculator';
import { getRequirementSpec } from '@/lib/supabase/store';

// POST - Start test execution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;
    const body = await request.json();
    const { test_suite_id, submission_path } = body;

    if (!test_suite_id) {
      return NextResponse.json(
        { error: 'test_suite_id is required' },
        { status: 400 }
      );
    }

    if (!submission_path) {
      return NextResponse.json(
        { error: 'submission_path is required' },
        { status: 400 }
      );
    }

    // Get test suite
    const testSuite = await getTestSuite(test_suite_id);
    if (!testSuite) {
      return NextResponse.json(
        { error: 'Test suite not found' },
        { status: 404 }
      );
    }

    // Create test run record
    const runId = uuidv4();
    const testRun = {
      id: runId,
      submission_id: submissionId,
      test_suite_id: test_suite_id,
      status: 'running' as const,
      execution_metadata: {
        started_at: new Date().toISOString(),
      },
    };

    await saveTestRun(testRun);

    // Execute tests asynchronously (in production, use a job queue)
    executeTestsAsync(runId, testSuite, submission_path, submissionId).catch(
      (error) => {
        console.error('Test execution failed:', error);
      }
    );

    return NextResponse.json({
      test_run_id: runId,
      status: 'running',
      message: 'Test execution started',
    });
  } catch (error) {
    console.error('Error starting test execution:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start test execution',
      },
      { status: 500 }
    );
  }
}

// GET - Get test run results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { error: 'runId query parameter is required' },
        { status: 400 }
      );
    }

    const testRun = await getTestRun(runId);
    if (!testRun) {
      return NextResponse.json(
        { error: 'Test run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...testRun,
    });
  } catch (error) {
    console.error('Error fetching test run:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch test run',
      },
      { status: 500 }
    );
  }
}

// Async test execution
async function executeTestsAsync(
  runId: string,
  testSuite: any,
  submissionPath: string,
  submissionId: string
) {
  try {
    // Get requirement spec for scoring
    const requirementSpec = await getRequirementSpec(testSuite.requirement_spec_id);

    // Execute tests in sandbox
    const sandboxResult = await runSandboxedTests({
      testFiles: testSuite.test_files,
      submissionPath,
      language: testSuite.language,
      framework: testSuite.framework,
      timeout: testSuite.runner_config?.timeout || 60,
    });

    // Calculate scores
    let requirementScores;
    let overallScore;

    if (requirementSpec) {
      requirementScores = calculateRequirementScores(
        sandboxResult.test_results,
        requirementSpec.requirements
      );

      overallScore = calculateOverallScore(requirementScores, requirementSpec.requirements);
      overallScore.confidence_score = calculateConfidenceScore(requirementScores, testSuite);
    }

    // Update test run
    const updatedRun = {
      id: runId,
      submission_id: submissionId,
      test_suite_id: testSuite.id,
      status: 'completed' as const,
      results: sandboxResult,
      requirement_scores: requirementScores,
      overall_score: overallScore,
      execution_metadata: {
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: sandboxResult.execution_time_ms,
      },
    };

    await saveTestRun(updatedRun);
  } catch (error) {
    // Update test run with error
    const errorRun = {
      id: runId,
      submission_id: submissionId,
      test_suite_id: testSuite.id,
      status: 'failed' as const,
      execution_metadata: {
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    await saveTestRun(errorRun);
  }
}

