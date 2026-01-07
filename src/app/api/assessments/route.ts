// POST /api/assessments - Create a new assessment with shareable link

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
    const { content, title } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Assessment content is required' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Assessment title is required' },
        { status: 400 }
      );
    }

    const result = await createPrompt(content.trim(), user.id, { 
      title: title.trim(),
      shareable: true 
    });

    if (!result.shareableToken) {
      return NextResponse.json(
        { error: 'Failed to generate shareable token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: result.id,
      shareableToken: result.shareableToken,
      shareableLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assessment/${result.shareableToken}`,
      message: 'Assessment created successfully',
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create assessment',
      },
      { status: 500 }
    );
  }
}

