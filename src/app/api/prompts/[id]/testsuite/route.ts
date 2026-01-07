// POST /api/prompts/:id/testsuite - Generate test suite from requirement spec

import { NextRequest, NextResponse } from 'next/server';
import { getRequirementSpec, getPrompt } from '@/lib/supabase/store';
import { saveTestSuite } from '@/lib/supabase/store';
import { generateTestSuite } from '@/lib/testing/generator';
import { performStaticAnalysis } from '@/lib/analysis/staticAnalysis';
import { getUser } from '@/lib/auth/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify authentication
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const promptId = params.id;
    const body = await request.json();
    const { language, submissionPath } = body;

    // Get prompt to find requirement spec
    const prompt = await getPrompt(promptId);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Get requirement spec (we'll need to query by prompt_id)
    // For now, assume we have a way to get the latest spec for a prompt
    // TODO: Add query method to get requirement spec by prompt_id
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    const client = getSupabaseClient();
    
    let requirementSpec;
    let specId: string;

    if (client) {
      const { data } = await client
        .from('requirement_specs')
        .select('*')
        .eq('prompt_id', promptId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!data) {
        return NextResponse.json(
          { error: 'Requirement spec not found. Please generate requirements first.' },
          { status: 404 }
        );
      }

      requirementSpec = {
        requirements: data.requirements,
        constraints: data.constraints,
        edge_cases: data.edge_cases,
        metadata: data.metadata,
      };
      specId = data.id;
    } else {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get static analysis if submission path provided
    let staticAnalysis;
    if (submissionPath) {
      try {
        staticAnalysis = await performStaticAnalysis(submissionPath);
      } catch (error) {
        console.warn('Failed to perform static analysis:', error);
      }
    }

    // Generate test suite
    const testSuite = await generateTestSuite(
      requirementSpec,
      specId,
      staticAnalysis,
      { language }
    );

    // Save test suite
    await saveTestSuite(testSuite);

    return NextResponse.json({
      test_suite_id: testSuite.id,
      language: testSuite.language,
      framework: testSuite.framework,
      test_files: testSuite.test_files.map(tf => ({
        filename: tf.filename,
        requirement_ids: tf.requirement_ids,
      })),
      metadata: testSuite.metadata,
    });
  } catch (error) {
    console.error('Error generating test suite:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate test suite',
      },
      { status: 500 }
    );
  }
}

