import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY

let client: Anthropic | null = null

if (apiKey) {
  client = new Anthropic({
    apiKey,
  })
}

export async function callAnthropic(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000
): Promise<string> {
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
  }

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature: 0.3, // Lower temperature for more deterministic outputs
      system: systemPrompt || 'You are a helpful assistant that analyzes code repositories.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected content type in Anthropic response')
    }

    return content.text
  } catch (error) {
    throw new Error(
      `Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

