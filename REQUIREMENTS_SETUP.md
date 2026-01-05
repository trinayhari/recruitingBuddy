# Requirements-Based Testing System Setup Guide

This guide explains how to set up and use the new requirements-based scoring and automated test generation feature.

## Overview

The system enables:
1. **Requirement Extraction**: Convert project prompts into structured, testable requirements
2. **Test Generation**: Automatically generate test suites from requirements
3. **Sandboxed Execution**: Run tests safely in Docker containers
4. **Scoring**: Calculate requirement-level and overall scores based on test results

## Prerequisites

1. **Docker Desktop**: Required for sandboxed test execution
   - Install from https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before executing tests

2. **Supabase Account** (optional but recommended):
   - Sign up at https://supabase.com
   - Create a new project
   - Note your project URL and API keys

3. **LLM API Keys**:
   - OpenAI API key (recommended for JSON mode support)
   - Or Anthropic API key

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Configure your `.env.local`:
```bash
# Required: LLM Provider
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here

# Optional: Supabase (for persistent storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Model overrides
MODEL_REQUIREMENTS=gpt-4o
MODEL_TESTGEN=gpt-4o
```

## Supabase Setup (Optional)

If you want to use Supabase for persistent storage:

1. **Create a Supabase project** at https://supabase.com

2. **Run the schema migration**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `src/lib/supabase/schema.sql`
   - Execute the SQL

3. **Create storage buckets** (optional, for test artifacts):
   - Go to Storage in Supabase dashboard
   - Create buckets: `test-artifacts`, `test-outputs`, `submissions`

4. **Configure Row Level Security** (if needed):
   - The schema includes basic RLS policies
   - Adjust based on your authentication needs

## Usage

### Basic Flow

1. **Submit a submission with project prompt**:
   - Go to the homepage
   - Upload a GitHub repo or zip file
   - Paste the project prompt/requirements in the "Project Prompt" field
   - Check "Auto-generate tests after analysis" if you want immediate test generation
   - Submit

2. **View requirements** (if auto-generation was enabled):
   - Navigate to the dashboard
   - Select your submission
   - View extracted requirements and generated tests

3. **Run tests**:
   - Use the API endpoint: `POST /api/submissions/:id/run-tests`
   - Or integrate into your UI

### API Endpoints

#### Create Prompt
```bash
POST /api/prompts
Content-Type: application/json

{
  "content": "Build a REST API with user CRUD operations...",
  "autoGenerate": false
}
```

#### Generate Requirements
```bash
POST /api/prompts/:promptId/requirements
```

#### Generate Test Suite
```bash
POST /api/prompts/:promptId/testsuite
Content-Type: application/json

{
  "language": "python",
  "submissionPath": "/path/to/submission"
}
```

#### Run Tests
```bash
POST /api/submissions/:submissionId/run-tests
Content-Type: application/json

{
  "test_suite_id": "uuid",
  "submission_path": "/path/to/submission"
}
```

#### Get Test Results
```bash
GET /api/submissions/:submissionId/run-tests?runId=uuid
```

## Architecture

### Components

1. **Requirement Extraction** (`src/lib/requirements/`)
   - Extracts atomic requirements from project prompts
   - Validates and repairs using Zod schemas
   - Uses GPT-4o with JSON mode

2. **Test Generation** (`src/lib/testing/`)
   - Generates executable test code
   - Supports Python (pytest) and JavaScript/TypeScript (vitest)
   - Includes hygiene checks and auto-repair

3. **Sandbox Execution** (`src/lib/sandbox/`)
   - Docker-based isolation
   - Security controls (no network, memory limits, timeouts)
   - Captures stdout/stderr and exit codes

4. **Scoring Engine** (`src/lib/scoring/`)
   - Requirement-level pass/fail
   - Weighted overall score
   - Confidence score based on test coverage

5. **Supabase Integration** (`src/lib/supabase/`)
   - Stores prompts, requirements, test suites, and results
   - Falls back to file-based storage if not configured

## File Structure

```
src/
├── lib/
│   ├── requirements/
│   │   ├── types.ts          # TypeScript types
│   │   ├── schemas.ts        # Zod validation schemas
│   │   ├── extractor.ts      # Requirement extraction logic
│   │   └── prompts.ts         # LLM prompts
│   ├── testing/
│   │   ├── generator.ts      # Test generation
│   │   └── frameworks/
│   │       └── python.ts     # Python/pytest helpers
│   ├── sandbox/
│   │   ├── docker.ts         # Docker execution
│   │   ├── runner.ts         # Main runner interface
│   │   └── config.ts         # Configuration types
│   ├── scoring/
│   │   └── calculator.ts    # Score calculation
│   └── supabase/
│       ├── client.ts         # Supabase client
│       ├── store.ts           # CRUD operations
│       └── schema.sql         # Database schema
├── app/
│   └── api/
│       ├── prompts/           # Prompt endpoints
│       └── submissions/       # Test execution endpoints
└── components/
    ├── Requirements/          # Requirement UI components
    └── Testing/               # Test results UI
```

## Troubleshooting

### Docker Not Available
- Ensure Docker Desktop is installed and running
- Check with: `docker --version`
- The system will show an error if Docker is unavailable

### Supabase Not Configured
- The system will work without Supabase using file-based fallback
- Some features (like persistent requirement specs) require Supabase
- Check logs for Supabase connection errors

### Test Generation Fails
- Check LLM API key is valid
- Ensure you have sufficient API credits
- Check logs for specific error messages
- The system will attempt to repair failed test generation

### Test Execution Fails
- Verify Docker is running
- Check submission path is valid
- Review test suite metadata for errors
- Check container logs in Docker Desktop

## Next Steps

1. **Add more language support**: Extend `src/lib/testing/frameworks/` for other languages
2. **Enhance security**: Review Docker security settings in `src/lib/sandbox/docker.ts`
3. **Add authentication**: Update Supabase RLS policies for multi-user support
4. **Improve test parsing**: Enhance result parsing for better test output analysis
5. **Add job queue**: Use a proper job queue (e.g., BullMQ) for async test execution

## Support

For issues or questions, check:
- Logs in `.cursor/debug.log`
- Docker container logs
- Supabase dashboard for database issues
- Browser console for UI errors

