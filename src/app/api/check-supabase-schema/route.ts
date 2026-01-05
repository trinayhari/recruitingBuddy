// Diagnostic endpoint to check Supabase schema setup

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local',
      }, { status: 400 });
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Supabase client',
      }, { status: 500 });
    }

    // Check each table individually
    const requiredTables = [
      'prompts',
      'requirement_specs',
      'test_suites',
      'submissions',
      'test_runs',
    ];

    const tableStatus: Record<string, { exists: boolean; error?: string }> = {};

    for (const table of requiredTables) {
      try {
        const { error } = await client
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          tableStatus[table] = {
            exists: false,
            error: error.message,
          };
        } else {
          tableStatus[table] = {
            exists: true,
          };
        }
      } catch (err) {
        tableStatus[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }

    const missingTables = requiredTables.filter(
      (table) => !tableStatus[table]?.exists
    );

    const allExist = missingTables.length === 0;

    return NextResponse.json({
      success: allExist,
      message: allExist
        ? 'All tables exist! Schema is set up correctly.'
        : `${missingTables.length} table(s) are missing. Please run the schema.sql file.`,
      tables: tableStatus,
      missingTables,
      instructions: missingTables.length > 0 ? {
        step1: 'Go to https://supabase.com/dashboard',
        step2: 'Select your project',
        step3: 'Click "SQL Editor" in the left sidebar',
        step4: 'Click "New query"',
        step5: 'Open src/lib/supabase/schema.sql in your code editor',
        step6: 'Copy ALL contents and paste into Supabase SQL Editor',
        step7: 'Click "Run" button (or Cmd/Ctrl + Enter)',
        step8: 'Wait for success message, then refresh this page',
      } : undefined,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

