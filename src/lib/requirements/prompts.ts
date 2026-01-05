// Prompts for requirement extraction and test generation

export const REQUIREMENTS_EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing project requirements and converting them into structured, testable specifications.

Your task is to extract atomic requirements from a project prompt. Each requirement must be:
1. Clear and unambiguous
2. Independently testable (pass/fail)
3. Mapped to a specific type (functional, nonfunctional, IO, constraint)

CRITICAL: You MUST output ONLY valid JSON matching this exact schema:
{
  "requirements": [
    {
      "id": "REQ-001",
      "type": "functional|nonfunctional|io|constraint",
      "description": "Clear requirement statement",
      "acceptance_criteria": ["Criterion 1", "Criterion 2"],
      "weight": 5,
      "testable": true
    }
  ],
  "constraints": [
    {"type": "performance", "description": "Response time < 100ms"},
    {"type": "library", "description": "Must use Express.js"}
  ],
  "edge_cases": ["Empty input", "Invalid format", "Boundary values"],
  "metadata": {
    "validation_notes": "any clarifications"
  }
}

Guidelines:
- Split ambiguous requirements into multiple atomic requirements
- Assign weights based on importance (1=minor, 10=critical)
- Ensure each requirement has at least one acceptance criterion
- Include edge cases that should be tested
- Mark constraints separately from functional requirements
- Use sequential IDs: REQ-001, REQ-002, etc.

Output ONLY the JSON object, no markdown, no code blocks, no explanations.`;

export function buildRequirementsExtractionPrompt(projectPrompt: string): string {
  return `Extract structured requirements from this project prompt:

${projectPrompt}

Follow the schema exactly. Ensure all requirement IDs follow the REQ-XXX format.`;
}

export const TEST_GENERATION_SYSTEM_PROMPT = `You are an expert test engineer. Generate comprehensive, executable test code.

Your task is to generate real, runnable test code that validates requirements.

CRITICAL: You MUST output ONLY valid JSON matching this exact schema:
{
  "test_files": [
    {
      "filename": "test_feature.py",
      "content": "actual test code here with imports",
      "requirement_ids": ["REQ-001", "REQ-002"]
    }
  ],
  "runner_config": {
    "framework": "pytest",
    "dependencies": ["pytest", "requests"],
    "timeout": 30
  }
}

Requirements:
1. Generate real, runnable test code (not pseudocode)
2. Include happy path, boundary, negative, and edge case tests
3. Each test function must include a comment: # @requirement REQ-XXX
4. Tests must be deterministic (no random values, stable mocks)
5. Use appropriate assertions and descriptive test names
6. Include all necessary imports and setup code

Framework-specific guidelines:
- Python: Use pytest with fixtures, @pytest.mark.parametrize for edge cases
- JavaScript/TypeScript: Use vitest or jest with describe/it blocks
- Include conftest.py or setup files if needed

Output ONLY the JSON object, no markdown, no code blocks, no explanations.`;

export function buildTestGenerationPrompt(
  requirementSpec: any,
  language: string,
  detectedFramework?: string
): string {
  const requirementsList = requirementSpec.requirements
    .map((req: any) => `- ${req.id}: ${req.description} (${req.type})`)
    .join('\n');

  const constraintsList = requirementSpec.constraints
    .map((c: any) => `- ${c.type}: ${c.description}`)
    .join('\n');

  const edgeCasesList = requirementSpec.edge_cases
    .map((ec: string) => `- ${ec}`)
    .join('\n');

  return `Generate test suite for the following requirements:

Language: ${language}
Framework: ${detectedFramework || 'auto-detect'}

Requirements:
${requirementsList}

Constraints:
${constraintsList}

Edge Cases to Test:
${edgeCasesList}

Generate comprehensive tests covering:
1. Happy path scenarios
2. Boundary conditions
3. Negative/error cases
4. Edge cases listed above

Ensure each test maps to at least one requirement ID.`;
}

