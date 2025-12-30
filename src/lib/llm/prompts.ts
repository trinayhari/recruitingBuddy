import { StaticAnalysis, CommitAnalysis, Decision } from '../types'

const SYSTEM_PROMPT = `You are an expert code reviewer helping hiring managers quickly understand take-home assessment submissions. 
Your goal is to provide honest, neutral, and actionable insights. If you're uncertain about something, explicitly state that uncertainty.
Do not score or judge the candidate - focus on understanding what was built and how they worked.`

export function buildTaskInferencePrompt(
  staticAnalysis: StaticAnalysis,
  readmeContent?: string
): string {
  const languages = Object.keys(staticAnalysis.languageBreakdown)
    .map(lang => `${lang} (${staticAnalysis.languageBreakdown[lang]} lines)`)
    .join(', ')

  return `Analyze this code repository and infer what the candidate was asked to build.

Repository Context:
- Framework: ${staticAnalysis.framework || 'Unknown'}
- Languages: ${languages}
- Entry Points: ${staticAnalysis.entryPoints.join(', ') || 'None detected'}
- Architecture: ${staticAnalysis.architecture || 'Unknown'}

${readmeContent ? `README Content:\n${readmeContent}\n` : 'No README found.'}

Based on the code structure, dependencies, and README (if available), what was the candidate likely asked to build?
Provide a concise 2-3 sentence description. If uncertain, state what you can infer and what's unclear.`
}

export function buildWorkStylePrompt(
  commitAnalysis: CommitAnalysis,
  chatExport?: string
): string {
  let prompt = `Analyze how the candidate worked based on their commit history and development patterns.

Commit Analysis:
- Total Commits: ${commitAnalysis.commitCount}
- Iteration Pattern: ${commitAnalysis.iterationPattern.toUpperCase()} (${commitAnalysis.commitFrequency.toFixed(2)} commits/hour)
${commitAnalysis.timeSpan ? `- Time Span: ${commitAnalysis.timeSpan.hours.toFixed(1)} hours` : ''}
- Sample Commit Messages: ${commitAnalysis.commitMessages.slice(0, 10).join('; ')}

`

  if (chatExport) {
    prompt += `AI Chat Export (if available):
${chatExport.substring(0, 2000)}${chatExport.length > 2000 ? '...' : ''}

`
  }

  prompt += `Based on this information, provide insights about:
1. AI Collaboration Style: How did the candidate use AI tools? (e.g., "Used for boilerplate", "Heavy reliance", "Minimal use", "Uncertain - no clear indicators")
2. Manual Intervention: What areas likely required manual work? (e.g., "Auth flow", "Database design", "Business logic", "Uncertain")

Be explicit about uncertainty. If there's not enough information, say so.`

  return prompt
}

export function buildDecisionsPrompt(
  staticAnalysis: StaticAnalysis,
  readmeContent?: string,
  reflections?: string,
  chatExport?: string
): string {
  let prompt = `Extract key technical decisions and tradeoffs made by the candidate.

Repository Context:
- Framework: ${staticAnalysis.framework || 'Unknown'}
- Dependencies: ${JSON.stringify(staticAnalysis.dependencies, null, 2)}

`

  if (readmeContent) {
    prompt += `README (may contain documented decisions):\n${readmeContent.substring(0, 1500)}${readmeContent.length > 1500 ? '...' : ''}\n\n`
  }

  if (reflections) {
    prompt += `Candidate Reflections:\n${reflections}\n\n`
  }

  if (chatExport) {
    prompt += `AI Chat Export (may contain decision discussions):\n${chatExport.substring(0, 1500)}${chatExport.length > 1500 ? '...' : ''}\n\n`
  }

  prompt += `Identify 3-5 key decisions or tradeoffs the candidate made. For each, provide:
- The decision (e.g., "Chose JWT over sessions")
- Rationale if available (e.g., "for stateless auth")
- Source (code/readme/reflections/chat)

If no clear decisions can be inferred, state that explicitly.`

  return prompt
}

export function buildRepoGuidePrompt(
  staticAnalysis: StaticAnalysis,
  fileTree: string[]
): string {
  const topFiles = fileTree.slice(0, 20).join('\n')

  return `Provide guidance on how a reviewer should read this repository.

Repository Structure:
- Total Files: ${staticAnalysis.fileCount}
- Entry Points: ${staticAnalysis.entryPoints.join(', ') || 'None detected'}
- Framework: ${staticAnalysis.framework || 'Unknown'}
- Architecture: ${staticAnalysis.architecture || 'Unknown'}

Sample Files:
${topFiles}

Provide:
1. Where to start: The first file or directory a reviewer should look at
2. Key files: 3-5 important files with brief descriptions of why they matter
3. What to skip: Common directories/files that can be ignored (e.g., node_modules, build artifacts)

Be specific with file paths. If the structure is unclear, state that.`
}

export function parseDecisionsResponse(response: string): Decision[] {
  const decisions: Decision[] = []
  
  // Try to parse structured format (bullet points or numbered list)
  const lines = response.split('\n').filter(line => line.trim())
  
  for (const line of lines) {
    // Match patterns like "- Decision: ..." or "1. Decision: ..."
    const match = line.match(/^[-*•]\s*(.+?)(?:\s*\(source:\s*(\w+)\))?$/i) ||
                  line.match(/^\d+\.\s*(.+?)(?:\s*\(source:\s*(\w+)\))?$/i)
    
    if (match) {
      const decisionText = match[1].trim()
      const source = (match[2]?.toLowerCase() || 'code') as Decision['source']
      
      // Try to extract rationale if present
      const rationaleMatch = decisionText.match(/^(.+?)\s*-\s*(.+)$/)
      if (rationaleMatch) {
        decisions.push({
          decision: rationaleMatch[1].trim(),
          rationale: rationaleMatch[2].trim(),
          source,
        })
      } else {
        decisions.push({
          decision: decisionText,
          source,
        })
      }
    }
  }
  
  // If no structured format found, return the whole response as a single decision
  if (decisions.length === 0 && response.trim()) {
    decisions.push({
      decision: response.trim(),
      source: 'code',
    })
  }
  
  return decisions
}

export function parseRepoGuideResponse(response: string): {
  startHere: string
  keyFiles: Array<{ path: string; description: string }>
  skipFiles: string[]
} {
  const startHereMatch = response.match(/start[:\s]+(.+?)(?:\n|$)/i)
  const startHere = startHereMatch ? startHereMatch[1].trim() : 'Unknown'

  const keyFiles: Array<{ path: string; description: string }> = []
  const keyFilesSection = response.match(/key files?[:\s]*(.+?)(?=skip|what to skip|$)/is)
  if (keyFilesSection) {
    const lines = keyFilesSection[1].split('\n')
    for (const line of lines) {
      const match = line.match(/[-*•]\s*(.+?)\s*[-–]\s*(.+)/i) ||
                    line.match(/[-*•]\s*(.+?)\s*:\s*(.+)/i)
      if (match) {
        keyFiles.push({
          path: match[1].trim(),
          description: match[2].trim(),
        })
      }
    }
  }

  const skipFiles: string[] = []
  const skipSection = response.match(/(?:skip|what to skip)[:\s]*(.+?)$/is)
  if (skipSection) {
    const lines = skipSection[1].split(/[,;]/)
    skipFiles.push(...lines.map(l => l.trim()).filter(Boolean))
  } else {
    // Default skip patterns
    skipFiles.push('node_modules', '.git', 'dist', 'build', '.next')
  }

  return {
    startHere,
    keyFiles,
    skipFiles,
  }
}

export { SYSTEM_PROMPT }

