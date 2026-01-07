// GET /api/assessments/[token] - Get assessment by shareable token

import { NextRequest, NextResponse } from 'next/server';
import { getPromptByToken } from '@/lib/supabase/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const prompt = await getPromptByToken(token);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: prompt.id,
      content: prompt.content,
      title: prompt.title,
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch assessment',
      },
      { status: 500 }
    );
  }
}

