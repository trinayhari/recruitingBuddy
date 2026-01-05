// Quick Supabase connection test script
// Run with: npx tsx scripts/test-supabase.ts

import { initSupabase, isSupabaseConfigured } from '../src/lib/supabase/client';

async function testSupabase() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check configuration
  console.log('1. Checking environment variables...');
  const configured = isSupabaseConfigured();
  
  if (!configured) {
    console.error('❌ Supabase not configured!');
    console.error('   Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }
  console.log('✅ Environment variables found\n');

  // Initialize client
  console.log('2. Initializing Supabase client...');
  try {
    const client = initSupabase();
    console.log('✅ Client initialized\n');

    // Test connection
    console.log('3. Testing database connection...');
    const { data, error } = await client
      .from('prompts')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.error('❌ Database schema not set up!');
        console.error('   Please run src/lib/supabase/schema.sql in your Supabase SQL Editor');
        console.error(`   Error: ${error.message}`);
        process.exit(1);
      }
      
      console.error('❌ Connection failed!');
      console.error(`   Error: ${error.message}`);
      console.error(`   Code: ${error.code}`);
      process.exit(1);
    }

    console.log('✅ Database connection successful!\n');

    // Test insert
    console.log('4. Testing insert operation...');
    const testPrompt = {
      content: `Test prompt - ${new Date().toISOString()}`,
    };

    const { data: insertData, error: insertError } = await client
      .from('prompts')
      .insert(testPrompt)
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Insert failed!');
      console.error(`   Error: ${insertError.message}`);
      console.error(`   Code: ${insertError.code}`);
      console.error('   Hint: Check Row Level Security (RLS) policies');
      process.exit(1);
    }

    console.log(`✅ Insert successful! Created prompt with ID: ${insertData.id}\n`);

    // Test read
    console.log('5. Testing read operation...');
    const { data: readData, error: readError } = await client
      .from('prompts')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (readError) {
      console.error('❌ Read failed!');
      console.error(`   Error: ${readError.message}`);
      process.exit(1);
    }

    console.log('✅ Read successful!\n');

    // Cleanup
    console.log('6. Cleaning up test data...');
    const { error: deleteError } = await client
      .from('prompts')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn(`⚠️  Cleanup warning: ${deleteError.message}`);
    } else {
      console.log('✅ Cleanup successful!\n');
    }

    // Check tables
    console.log('7. Checking required tables...');
    const tables = ['prompts', 'requirement_specs', 'test_suites', 'submissions', 'test_runs'];
    const tableStatus: Record<string, boolean> = {};

    for (const table of tables) {
      try {
        const { error: tableError } = await client
          .from(table)
          .select('count')
          .limit(1);
        
        tableStatus[table] = !tableError;
        console.log(`   ${tableStatus[table] ? '✅' : '❌'} ${table}`);
      } catch {
        tableStatus[table] = false;
        console.log(`   ❌ ${table}`);
      }
    }

    const allTablesExist = Object.values(tableStatus).every(exists => exists);
    
    console.log('\n' + '='.repeat(50));
    if (allTablesExist) {
      console.log('🎉 All tests passed! Supabase is fully configured.');
    } else {
      console.log('⚠️  Some tables are missing. Please run the schema.sql file.');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testSupabase();

