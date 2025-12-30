import { callOpenAI } from './openai'
import { callAnthropic } from './anthropic'

export type LLMProvider = 'openai' | 'anthropic'

const DEFAULT_PROVIDER: LLMProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'openai'

export async function callLLM(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000,
  provider: LLMProvider = DEFAULT_PROVIDER
): Promise<string> {
  try {
    if (provider === 'openai') {
      return await callOpenAI(prompt, systemPrompt, maxTokens)
    } else if (provider === 'anthropic') {
      return await callAnthropic(prompt, systemPrompt, maxTokens)
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

export function getLLMProvider(): LLMProvider {
  return DEFAULT_PROVIDER
}

