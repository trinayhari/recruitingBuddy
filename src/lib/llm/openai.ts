import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

let client: OpenAI | null = null

if (apiKey) {
  client = new OpenAI({
    apiKey,
  })
}

export interface LLMCallOptions {
  model?: string;
  temperature?: number;
  jsonMode?: boolean;
  maxTokens?: number;
}

export interface LLMCallResult {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000,
  options?: LLMCallOptions
): Promise<LLMCallResult> {
  if (!client) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }

  const model = options?.model || process.env.MODEL_REQUIREMENTS || process.env.MODEL_TESTGEN || 'gpt-4o';
  const temperature = options?.temperature ?? 0.3;
  const jsonMode = options?.jsonMode ?? false;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      max_tokens: options?.maxTokens || maxTokens,
      temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    return {
      content,
      model,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
    }
  } catch (error) {
    throw new Error(
      `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

