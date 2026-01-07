// POST /api/prompts - Create a new project prompt

import { NextRequest, NextResponse } from 'next/server';
import { createPrompt } from '@/lib/supabase/store';
import { getUser } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  // Verify authentication
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, autoGenerate, title, shareable } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt content is required' },
        { status: 400 }
      );
    }

    const result = await createPrompt(content.trim(), user.id, { title, shareable });

    return NextResponse.json({
      id: result.id,
      shareableToken: result.shareableToken,
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

