# Take-Home Assessment Review Buddy

An AI-native developer hiring tool that compresses take-home assessment review time by generating Reviewer Briefs that enable hiring managers to understand submissions in under 7 minutes.

## Features

- Analyzes GitHub repositories and zipped code submissions
- Generates structured Reviewer Briefs with:
  - TL;DR summary
  - Work style analysis
  - Key decisions & tradeoffs
  - Repository reading guide
  - Raw artifact links
- Supports multiple LLM providers (OpenAI, Anthropic)
- Graceful degradation for incomplete or messy inputs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Add your LLM API keys to `.env`

4. Run the development server:
```bash
npm run dev
```

## Usage

1. Navigate to the homepage
2. Submit a GitHub repo URL or upload a zip file
3. Optionally add a demo video link, AI chat export, or candidate reflections
4. View the generated Reviewer Brief

