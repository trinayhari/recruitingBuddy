// Test generation pipeline

import { v4 as uuidv4 } from 'uuid';
import { RequirementSpec } from '../requirements/schemas';
import { TestFile, GeneratedTestSuite } from '../requirements/types';
import { callLLMForTask } from '../llm/provider';
import { buildTestGenerationPrompt, TEST_GENERATION_SYSTEM_PROMPT } from '../requirements/prompts';
import { StaticAnalysis } from '../types';

export interface TestGenerationOptions {
  language?: string;
  framework?: string;
  timeout?: number;
}

/**
 * Detect language from static analysis
 */
export function detectLanguage(staticAnalysis: StaticAnalysis): string {
  const languages = Object.keys(staticAnalysis.languageBreakdown);
  if (languages.length === 0) {
    return 'python'; // Default
  }
  
  // Prioritize Python or JavaScript/TypeScript
  if (languages.includes('python')) return 'python';
  if (languages.includes('typescript') || languages.includes('javascript')) {
    return staticAnalysis.languageBreakdown['typescript'] > staticAnalysis.languageBreakdown['javascript']
      ? 'typescript'
      : 'javascript';
  }
  
  return languages[0];
}

/**
 * Select test framework based on language
 */
export function selectTestFramework(language: string): { framework: string; runner: string } {
  switch (language.toLowerCase()) {
    case 'python':
      return { framework: 'pytest', runner: 'pytest' };
    case 'typescript':
    case 'javascript':
      return { framework: 'vitest', runner: 'vitest' };
    default:
      return { framework: 'pytest', runner: 'pytest' }; // Default to pytest
  }
}

/**
 * Generate test suite from requirement spec
 */
export async function generateTestSuite(
  requirementSpec: RequirementSpec,
  requirementSpecId: string,
  staticAnalysis?: StaticAnalysis,
  options: TestGenerationOptions = {}
): Promise<GeneratedTestSuite> {
  const language = options.language || (staticAnalysis ? detectLanguage(staticAnalysis) : 'python');
  const frameworkInfo = selectTestFramework(language);
  const framework = options.framework || frameworkInfo.framework;

  // Call LLM to generate tests
  const result = await callLLMForTask(
    'test_generation',
    buildTestGenerationPrompt(requirementSpec, language, framework),
    TEST_GENERATION_SYSTEM_PROMPT,
    8000, // Higher token limit for test code
    'openai',
    true // JSON mode
  );

  // Parse JSON response
  let jsonContent = result.content.trim();
  if (jsonContent.startsWith('```')) {
    const match = jsonContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (match) {
      jsonContent = match[1];
    }
  }

  const parsed = JSON.parse(jsonContent);

  // Validate and structure test files
  const testFiles: TestFile[] = parsed.test_files.map((tf: any) => ({
    filename: tf.filename,
    content: tf.content,
    requirement_ids: Array.isArray(tf.requirement_ids) ? tf.requirement_ids : [],
  }));

  // Run hygiene check
  const hygieneResult = await runTestHygiene(testFiles, language, framework);
  
  let finalTestFiles = testFiles;
  if (!hygieneResult.valid && hygieneResult.errors.length > 0) {
    // Attempt to repair tests
    try {
      finalTestFiles = await repairTests(testFiles, hygieneResult.errors, language, framework);
    } catch (repairError) {
      console.warn('Test repair failed:', repairError);
    }
  }

  return {
    id: uuidv4(),
    requirement_spec_id: requirementSpecId,
    language,
    framework,
    test_files: finalTestFiles,
    runner_config: {
      ...parsed.runner_config,
      framework,
      timeout: options.timeout || parsed.runner_config?.timeout || 30,
    },
    metadata: {
      model: result.model,
      generated_at: new Date().toISOString(),
      hygiene_status: hygieneResult.valid ? 'valid' : (finalTestFiles !== testFiles ? 'repaired' : 'failed'),
      hygiene_errors: hygieneResult.valid ? undefined : hygieneResult.errors,
    },
  };
}

/**
 * Run basic hygiene checks on generated tests
 */
export async function runTestHygiene(
  testFiles: TestFile[],
  language: string,
  framework: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const testFile of testFiles) {
    // Check for requirement IDs in comments
    const hasRequirementIds = testFile.content.includes('@requirement') || 
                               testFile.content.match(/REQ-\d{3}/);
    
    if (!hasRequirementIds && testFile.requirement_ids.length === 0) {
      errors.push(`Test file ${testFile.filename} has no requirement IDs mapped`);
    }

    // Language-specific checks
    if (language === 'python') {
      if (!testFile.content.includes('import pytest') && !testFile.content.includes('from pytest')) {
        errors.push(`Test file ${testFile.filename} missing pytest import`);
      }
      if (!testFile.content.match(/def test_/)) {
        errors.push(`Test file ${testFile.filename} has no test functions (def test_*)`);
      }
    } else if (language === 'typescript' || language === 'javascript') {
      if (!testFile.content.includes('import') && !testFile.content.includes('require')) {
        errors.push(`Test file ${testFile.filename} missing imports`);
      }
      if (!testFile.content.match(/(it|test)\(/)) {
        errors.push(`Test file ${testFile.filename} has no test cases`);
      }
    }

    // Check for basic syntax issues
    if (testFile.content.length < 50) {
      errors.push(`Test file ${testFile.filename} seems too short to be valid`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Attempt to repair tests using LLM
 */
async function repairTests(
  testFiles: TestFile[],
  errors: string[],
  language: string,
  framework: string
): Promise<TestFile[]> {
  const repairPrompt = `The following test files have errors. Please fix them:

Errors:
${errors.join('\n')}

Test Files:
${JSON.stringify(testFiles, null, 2)}

Language: ${language}
Framework: ${framework}

Fix all errors and return the corrected test files in the same JSON format.`;

  const result = await callLLMForTask(
    'test_generation',
    repairPrompt,
    TEST_GENERATION_SYSTEM_PROMPT,
    8000,
    'openai',
    true
  );

  let jsonContent = result.content.trim();
  if (jsonContent.startsWith('```')) {
    const match = jsonContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (match) {
      jsonContent = match[1];
    }
  }

  const parsed = JSON.parse(jsonContent);
  return parsed.test_files.map((tf: any) => ({
    filename: tf.filename,
    content: tf.content,
    requirement_ids: Array.isArray(tf.requirement_ids) ? tf.requirement_ids : [],
  }));
}

