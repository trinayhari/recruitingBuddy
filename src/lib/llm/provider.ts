import { callOpenAI, LLMCallOptions, LLMCallResult } from './openai'
import { callAnthropic } from './anthropic'
import { callOpenRouter } from './openrouter'

export type LLMProvider = 'openai' | 'anthropic' | 'openrouter'
export type LLMTask = 'requirements' | 'test_generation' | 'analysis' | 'default'

const DEFAULT_PROVIDER: LLMProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'openai'

// Model selection based on task
function getModelForTask(task: LLMTask): string | undefined {
  if (task === 'requirements') {
    return process.env.MODEL_REQUIREMENTS || undefined; // Falls back to default
  }
  if (task === 'test_generation') {
    return process.env.MODEL_TESTGEN || undefined;
  }
  return undefined; // Use default model
}

export async function callLLM(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000,
  provider: LLMProvider = DEFAULT_PROVIDER,
  options?: LLMCallOptions
): Promise<string> {
  const result = await callLLMWithMetadata(prompt, systemPrompt, maxTokens, provider, options);
  return result.content;
}

export async function callLLMWithMetadata(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000,
  provider: LLMProvider = DEFAULT_PROVIDER,
  options?: LLMCallOptions
): Promise<LLMCallResult> {
  try {
    if (provider === 'openai') {
      return await callOpenAI(prompt, systemPrompt, maxTokens, options)
    } else if (provider === 'anthropic') {
      // Anthropic doesn't support JSON mode yet, but we can still use it
      const content = await callAnthropic(prompt, systemPrompt, maxTokens)
      return {
        content,
        model: 'claude-3-5-sonnet-20241022',
      }
    } else if (provider === 'openrouter') {
      const content = await callOpenRouter(prompt, systemPrompt, maxTokens)
      return {
        content,
        model: 'openrouter',
      }
    } else {
      throw new Error(`Unknown LLM provider: ${provider}`)
    }
  } catch (error) {
    // Re-throw with context
    throw new Error(
      `LLM call failed (${provider}): ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function callLLMForTask(
  task: LLMTask,
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000,
  provider: LLMProvider = DEFAULT_PROVIDER,
  jsonMode: boolean = false
): Promise<LLMCallResult> {
  const model = getModelForTask(task);
  const options: LLMCallOptions = {
    model,
    jsonMode,
    maxTokens,
    temperature: task === 'requirements' || task === 'test_generation' ? 0.2 : 0.3, // Lower temp for structured outputs
  };

  const result = await callLLMWithMetadata(prompt, systemPrompt, maxTokens, provider, options);
  
  // Log the call for debugging
  if (typeof window === 'undefined') {
    console.log(`[LLM] Task: ${task}, Model: ${result.model}, Tokens: ${result.usage?.total_tokens || 'unknown'}`);
  }

  return result;
}

export function getLLMProvider(): LLMProvider {
  return DEFAULT_PROVIDER
}

