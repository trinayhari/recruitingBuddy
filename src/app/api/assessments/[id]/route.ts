// PUT /api/assessments/[id] - Update an assessment
// DELETE /api/assessments/[id] - Delete an assessment

import { NextRequest, NextResponse } from 'next/server';
import { updatePrompt, deletePrompt, getPrompt } from '@/lib/supabase/store';
import { getUser } from '@/lib/auth/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify authentication
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { title, content } = body;

    // Verify the assessment exists and belongs to the user
    const existing = await getPrompt(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: { title?: string; content?: string } = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Assessment title cannot be empty' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }
    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Assessment content cannot be empty' },
          { status: 400 }
        );
      }
      updates.content = content.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    await updatePrompt(id, user.id, updates);

    return NextResponse.json({
      message: 'Assessment updated successfully',
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update assessment',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify authentication
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Verify the assessment exists and belongs to the user
    const existing = await getPrompt(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    await deletePrompt(id, user.id);

    return NextResponse.json({
      message: 'Assessment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete assessment',
      },
      { status: 500 }
    );
  }
}

