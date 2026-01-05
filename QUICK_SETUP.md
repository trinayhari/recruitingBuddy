# Quick Supabase Setup Guide

## The Error You're Seeing

```
Failed to save submission: Could not find the table 'public.submissions' in the schema cache
```

This means the database tables haven't been created yet. Follow these steps:

## Step-by-Step Setup

### Option 1: Using Supabase Dashboard (Recommended - Easiest)

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Sign in and select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the Schema**
   - Open `src/lib/supabase/schema.sql` in your code editor
   - Copy ALL the contents (Cmd/Ctrl + A, then Cmd/Ctrl + C)

4. **Paste and Run**
   - Paste into the Supabase SQL Editor
   - Click the "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify Tables Were Created**
   - Click "Table Editor" in the left sidebar
   - You should see these tables:
     - `prompts`
     - `requirement_specs`
     - `test_suites`
     - `submissions`
     - `test_runs`

### Option 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Verify Setup

After running the schema, test the connection:

```bash
# Visit in browser or use curl
curl http://localhost:3000/api/test-supabase
```

You should see:
```json
{
  "success": true,
  "message": "Supabase connection successful!",
  "tests": {
    "connection": true,
    "insert": true,
    "read": true,
    "delete": true,
    "tables": {
      "prompts": true,
      "requirement_specs": true,
      "test_suites": true,
      "submissions": true,
      "test_runs": true
    }
  }
}
```

## Troubleshooting

### "Permission denied" or RLS errors
The schema includes permissive RLS policies. If you see permission errors:
1. Check that you ran the entire schema.sql file
2. Verify the RLS policies were created (check in Supabase Dashboard → Authentication → Policies)

### "Table already exists" warnings
This is fine! The schema uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Still seeing errors?
1. Make sure you copied the ENTIRE schema.sql file (including the RLS policies at the end)
2. Check that all 5 tables appear in the Table Editor
3. Restart your Next.js dev server after setting up the schema
4. Try the test endpoint again: `http://localhost:3000/api/test-supabase`

## What the Schema Creates

- **prompts**: Stores project prompts/requirements
- **requirement_specs**: Stores extracted requirement specifications
- **test_suites**: Stores generated test suites
- **submissions**: Stores submission metadata and briefs
- **test_runs**: Stores test execution results and scores

All tables include:
- Proper indexes for performance
- Row Level Security (RLS) enabled
- Permissive policies (allows all operations - adjust for production)

