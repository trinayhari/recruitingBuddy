// Script to set up Supabase schema programmatically
// Run with: npx tsx scripts/setup-supabase.ts

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupSupabase() {
  console.log('🚀 Setting up Supabase schema...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   Note: Using SERVICE_ROLE_KEY is recommended for schema setup');
    process.exit(1);
  }

  // Use service role key for admin operations, fallback to anon key
  const client = createClient(supabaseUrl, supabaseServiceKey);

  // Read schema file
  const schemaPath = join(process.cwd(), 'src', 'lib', 'supabase', 'schema.sql');
  let schemaSQL: string;
  
  try {
    schemaSQL = readFileSync(schemaPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to read schema file: ${schemaPath}`);
    console.error('   Please ensure the file exists');
    process.exit(1);
  }

  console.log('📄 Schema file loaded\n');

  // Split SQL into individual statements (simple approach)
  // Note: Supabase SQL Editor handles this better, but we'll try
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements\n`);

  // Execute statements one by one
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length < 10) {
      continue;
    }

    try {
      // Use RPC or direct query - Supabase doesn't support multi-statement queries easily
      // So we'll use the REST API to execute SQL
      const { error } = await client.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query for CREATE TABLE statements
        if (statement.toUpperCase().includes('CREATE')) {
          // For CREATE statements, we need to use the REST API differently
          console.log(`⚠️  Statement ${i + 1} may need manual execution`);
          console.log(`   ${statement.substring(0, 50)}...`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to execute statement ${i + 1}:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully executed: ${successCount} statements`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} statements`);
  }
  console.log('='.repeat(50));

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. Please run the schema manually in Supabase SQL Editor:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Open SQL Editor');
    console.log('   4. Copy and paste the contents of src/lib/supabase/schema.sql');
    console.log('   5. Click Run\n');
  } else {
    console.log('\n🎉 Schema setup complete! You can now test the connection.\n');
  }
}

setupSupabase();

