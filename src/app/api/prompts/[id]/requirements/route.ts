// POST /api/prompts/:id/requirements - Generate requirement spec from prompt

import { NextRequest, NextResponse } from 'next/server';
import { getPrompt, saveRequirementSpec } from '@/lib/supabase/store';
import { extractRequirements, postProcessRequirements } from '@/lib/requirements/extractor';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptId = params.id;

    // Get prompt
    const prompt = await getPrompt(promptId);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Extract requirements
    const extractionResult = await extractRequirements(prompt.content);
    const processedSpec = postProcessRequirements(extractionResult.spec);

    // Save requirement spec
    const specId = await saveRequirementSpec(promptId, processedSpec);

    return NextResponse.json({
      requirement_spec_id: specId,
      spec: processedSpec,
      attempts: extractionResult.attempts,
      repaired: extractionResult.repaired,
    });
  } catch (error) {
    console.error('Error generating requirements:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate requirements',
      },
      { status: 500 }
    );
  }
}

