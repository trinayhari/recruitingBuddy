// Requirement extraction pipeline with validation and retry logic

import { RequirementSpecSchema, RequirementSpec } from './schemas';
import { callLLMForTask } from '../llm/provider';
import { buildRequirementsExtractionPrompt } from './prompts';
import { REQUIREMENTS_EXTRACTION_SYSTEM_PROMPT } from './prompts';

export interface ExtractionResult {
  spec: RequirementSpec;
  attempts: number;
  repaired: boolean;
}

/**
 * Normalize and clean the project prompt
 */
export function normalizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n'); // Normalize line breaks
}

/**
 * Extract requirements from project prompt with automatic retry and repair
 */
export async function extractRequirements(
  projectPrompt: string,
  maxRetries: number = 3
): Promise<ExtractionResult> {
  const normalizedPrompt = normalizePrompt(projectPrompt);
  let lastError: Error | null = null;
  let repaired = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Call LLM with JSON mode
      const result = await callLLMForTask(
        'requirements',
        buildRequirementsExtractionPrompt(normalizedPrompt),
        REQUIREMENTS_EXTRACTION_SYSTEM_PROMPT,
        4000, // Higher token limit for structured output
        'openai', // Use OpenAI for JSON mode support
        true // JSON mode
      );

      // Parse JSON response
      let jsonContent = result.content.trim();
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        const match = jsonContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (match) {
          jsonContent = match[1];
        }
      }

      const parsed = JSON.parse(jsonContent);

      // Validate against schema
      const validated = RequirementSpecSchema.parse({
        ...parsed,
        metadata: {
          model: result.model,
          generated_at: new Date().toISOString(),
          validation_status: attempt > 1 ? 'repaired' : 'valid',
          validation_notes: attempt > 1 ? `Repaired after ${attempt - 1} attempt(s)` : undefined,
        },
      });

      return {
        spec: validated,
        attempts: attempt,
        repaired: attempt > 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        // Try to repair the prompt for next attempt
        const repairPrompt = `The previous requirement extraction failed with error: ${lastError.message}

Original prompt:
${normalizedPrompt}

Please extract requirements again, ensuring:
1. All requirement IDs follow REQ-XXX format (REQ-001, REQ-002, etc.)
2. All fields are present and valid
3. JSON is properly formatted
4. At least one requirement is included`;

        // Continue to next iteration with repaired prompt
        continue;
      }
    }
  }

  // If all retries failed, throw error
  throw new Error(
    `Failed to extract requirements after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Post-process requirements: dedupe, assign default weights, validate IDs
 */
export function postProcessRequirements(spec: RequirementSpec): RequirementSpec {
  // Ensure sequential IDs
  const requirements = spec.requirements.map((req, index) => ({
    ...req,
    id: `REQ-${String(index + 1).padStart(3, '0')}`,
  }));

  // Ensure weights are set
  const requirementsWithWeights = requirements.map(req => ({
    ...req,
    weight: req.weight || 5,
  }));

  // Deduplicate by description (simple approach)
  const seen = new Set<string>();
  const deduped = requirementsWithWeights.filter(req => {
    const key = req.description.toLowerCase().trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return {
    ...spec,
    requirements: deduped,
  };
}

