import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

let client: OpenAI | null = null

if (apiKey) {
  client = new OpenAI({
    apiKey,
  })
}

export async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000
): Promise<string> {
  if (!client) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3, // Lower temperature for more deterministic outputs
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    return content
  } catch (error) {
    throw new Error(
      `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

