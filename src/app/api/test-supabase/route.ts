// Test endpoint to verify Supabase connection and setup

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const configured = isSupabaseConfigured();
    
    if (!configured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        message: 'Please check that SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local',
      }, { status: 400 });
    }

    const client = getSupabaseClient();
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Supabase client',
      }, { status: 500 });
    }

    // Test 1: Check connection (ping)
    const { data: pingData, error: pingError } = await client
      .from('prompts')
      .select('count')
      .limit(1);

    if (pingError) {
      // Check if it's a schema error (table doesn't exist)
      if (pingError.code === '42P01' || pingError.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Database schema not set up',
          message: 'Please run the SQL schema from src/lib/supabase/schema.sql in your Supabase SQL Editor',
          details: pingError.message,
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Supabase connection error',
        message: pingError.message,
        code: pingError.code,
      }, { status: 500 });
    }

    // Test 2: Try to create a test prompt
    const testPrompt = {
      content: `Test prompt created at ${new Date().toISOString()}`,
    };

    const { data: insertData, error: insertError } = await client
      .from('prompts')
      .insert(testPrompt)
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test data',
        message: insertError.message,
        code: insertError.code,
        hint: 'Check Row Level Security (RLS) policies',
      }, { status: 500 });
    }

    // Test 3: Try to read it back
    const { data: readData, error: readError } = await client
      .from('prompts')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (readError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to read test data',
        message: readError.message,
        code: readError.code,
      }, { status: 500 });
    }

    // Test 4: Clean up test data
    const { error: deleteError } = await client
      .from('prompts')
      .delete()
      .eq('id', insertData.id);

    // Test 5: Check other tables exist
    const tables = ['requirement_specs', 'test_suites', 'submissions', 'test_runs'];
    const tableChecks: Record<string, boolean> = {};

    for (const table of tables) {
      try {
        const { error: tableError } = await client
          .from(table)
          .select('count')
          .limit(1);
        
        tableChecks[table] = !tableError;
      } catch {
        tableChecks[table] = false;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      tests: {
        connection: true,
        insert: true,
        read: true,
        delete: !deleteError,
        tables: tableChecks,
      },
      testPromptId: insertData.id,
      cleanup: deleteError ? 'Failed to cleanup test data' : 'Successfully cleaned up',
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

