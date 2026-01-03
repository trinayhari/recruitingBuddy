import OpenAI from 'openai'

const apiKey = process.env.OPENROUTER_API_KEY
const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

let client: OpenAI | null = null

if (apiKey) {
  client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  })
}

export async function callOpenRouter(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000
): Promise<string> {
  if (!client) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables')
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenRouter response')
    }

    return content
  } catch (error) {
    throw new Error(
      `OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
