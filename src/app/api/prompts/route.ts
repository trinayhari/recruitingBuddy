// POST /api/prompts - Create a new project prompt

import { NextRequest, NextResponse } from 'next/server';
import { createPrompt } from '@/lib/supabase/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, autoGenerate } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt content is required' },
        { status: 400 }
      );
    }

    const promptId = await createPrompt(content.trim());

    return NextResponse.json({
      id: promptId,
      message: 'Prompt created successfully',
      autoGenerate: autoGenerate || false,
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create prompt',
      },
      { status: 500 }
    );
  }
}

