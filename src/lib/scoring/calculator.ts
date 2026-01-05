// Scoring calculator for requirement-based testing

import { Requirement, RequirementScore, OverallScore, TestResult, GeneratedTestSuite } from '../requirements/types';

/**
 * Calculate requirement-level scores from test results
 */
export function calculateRequirementScores(
  testResults: TestResult[],
  requirements: Requirement[],
  passThreshold: number = 1.0 // 1.0 = all tests must pass, 0.8 = 80% must pass
): RequirementScore[] {
  const requirementMap = new Map<string, Requirement>();
  requirements.forEach(req => requirementMap.set(req.id, req));

  const scores: RequirementScore[] = [];

  for (const requirement of requirements) {
    // Find all tests that map to this requirement
    const relevantTests = testResults.filter(test =>
      test.requirement_ids.includes(requirement.id)
    );

    const passingTests = relevantTests.filter(test => test.status === 'pass');
    const failingTests = relevantTests.filter(test => test.status === 'fail' || test.status === 'error');

    const totalTests = relevantTests.length;
    const passingCount = passingTests.length;

    let status: 'pass' | 'fail' | 'partial' | 'untested';
    
    if (totalTests === 0) {
      status = 'untested';
    } else if (passingCount / totalTests >= passThreshold) {
      status = 'pass';
    } else if (passingCount > 0) {
      status = 'partial';
    } else {
      status = 'fail';
    }

    scores.push({
      requirement_id: requirement.id,
      status,
      passing_tests: passingCount,
      total_tests: totalTests,
      failing_tests: failingTests,
      weight: requirement.weight,
    });
  }

  return scores;
}

/**
 * Calculate overall score from requirement scores
 */
export function calculateOverallScore(
  requirementScores: RequirementScore[],
  requirements: Requirement[]
): OverallScore {
  const totalRequirements = requirements.length;
  const passedRequirements = requirementScores.filter(score => score.status === 'pass').length;
  const percentage = totalRequirements > 0 ? (passedRequirements / totalRequirements) * 100 : 0;

  // Calculate weighted score
  let totalWeight = 0;
  let weightedSum = 0;

  for (const score of requirementScores) {
    const weight = score.weight;
    totalWeight += weight;
    
    if (score.status === 'pass') {
      weightedSum += weight;
    } else if (score.status === 'partial') {
      // Partial credit: 50% of weight
      weightedSum += weight * 0.5;
    }
  }

  const weightedScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  // Calculate breakdown by type
  const breakdown = {
    functional: { passed: 0, total: 0 },
    nonfunctional: { passed: 0, total: 0 },
    io: { passed: 0, total: 0 },
    constraints: { passed: 0, total: 0 },
  };

  for (const requirement of requirements) {
    const score = requirementScores.find(s => s.requirement_id === requirement.id);
    const type = requirement.type as keyof typeof breakdown;
    
    if (type in breakdown) {
      breakdown[type].total++;
      if (score?.status === 'pass') {
        breakdown[type].passed++;
      }
    }
  }

  return {
    requirements_met: passedRequirements,
    total_requirements: totalRequirements,
    percentage: Math.round(percentage * 100) / 100,
    weighted_score: Math.round(weightedScore * 100) / 100,
    confidence_score: 0, // Will be calculated separately
    breakdown,
  };
}

/**
 * Calculate confidence score based on test coverage and quality
 */
export function calculateConfidenceScore(
  requirementScores: RequirementScore[],
  testSuite: GeneratedTestSuite
): number {
  let confidence = 50; // Base score

  // Increase confidence for requirements with multiple tests
  const requirementsWithMultipleTests = requirementScores.filter(
    score => score.total_tests >= 2
  ).length;
  confidence += Math.min(requirementsWithMultipleTests * 2, 20);

  // Increase confidence if we have negative/boundary tests
  const hasNegativeTests = testSuite.test_files.some(file =>
    file.content.toLowerCase().includes('negative') ||
    file.content.toLowerCase().includes('error') ||
    file.content.toLowerCase().includes('invalid') ||
    file.content.toLowerCase().includes('boundary')
  );
  if (hasNegativeTests) {
    confidence += 15;
  }

  // Increase confidence if we have property-based tests
  const hasPropertyTests = testSuite.test_files.some(file =>
    file.content.includes('hypothesis') ||
    file.content.includes('@given') ||
    file.content.includes('property')
  );
  if (hasPropertyTests) {
    confidence += 10;
  }

  // Decrease confidence if too many requirements have only 1 test
  const singleTestRequirements = requirementScores.filter(score => score.total_tests === 1).length;
  const singleTestRatio = requirementScores.length > 0 
    ? singleTestRequirements / requirementScores.length 
    : 0;
  
  if (singleTestRatio > 0.3) {
    confidence -= 20;
  }

  // Decrease confidence if any requirements are untested
  const untestedCount = requirementScores.filter(score => score.status === 'untested').length;
  if (untestedCount > 0) {
    confidence -= 15;
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Generate failure analysis and suggestions
 */
export function generateFailureAnalysis(
  requirementScores: RequirementScore[],
  requirements: Requirement[]
): Array<{
  requirement_id: string;
  requirement_description: string;
  failing_tests: TestResult[];
  suggestions: string[];
}> {
  const failures = requirementScores.filter(score => score.status === 'fail' || score.status === 'partial');
  
  return failures.map(score => {
    const requirement = requirements.find(r => r.id === score.requirement_id);
    const suggestions: string[] = [];

    // Analyze failing tests to generate suggestions
    for (const test of score.failing_tests) {
      if (test.status === 'error') {
        suggestions.push(`Test "${test.test_name}" errored: ${test.error_message || 'Unknown error'}`);
      } else if (test.status === 'timeout') {
        suggestions.push(`Test "${test.test_name}" timed out - check for infinite loops or slow operations`);
      } else if (test.error_message) {
        suggestions.push(`Test "${test.test_name}" failed: ${test.error_message}`);
      }
    }

    // Add general suggestions based on requirement type
    if (requirement) {
      if (requirement.type === 'io') {
        suggestions.push('Check input/output format and data validation');
      } else if (requirement.type === 'constraint') {
        suggestions.push('Verify that constraints are properly enforced');
      } else if (requirement.type === 'nonfunctional') {
        suggestions.push('Check performance, security, or other non-functional aspects');
      }
    }

    return {
      requirement_id: score.requirement_id,
      requirement_description: requirement?.description || 'Unknown requirement',
      failing_tests: score.failing_tests,
      suggestions: [...new Set(suggestions)], // Deduplicate
    };
  });
}

