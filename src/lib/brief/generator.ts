import { ReviewerBrief, StaticAnalysis, CommitAnalysis, WorkStyleAnalysis, Decision, RepoGuide } from '../types'
import { callLLM, getLLMProvider } from '../llm/provider'
import {
  buildTaskInferencePrompt,
  buildWorkStylePrompt,
  buildDecisionsPrompt,
  buildRepoGuidePrompt,
  parseDecisionsResponse,
  parseRepoGuideResponse,
  SYSTEM_PROMPT,
} from '../llm/prompts'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getAllFiles } from '../ingestion/fileTree'
import { scoreFileImportance } from '../analysis/staticAnalysis'
import { computeMetrics } from '../analysis/metricsAnalysis'

async function buildKeyFileExcerpts(
  repoPath: string,
  filePaths: string[],
  maxFiles: number = 8,
  maxCharsPerFile: number = 1400
): Promise<Array<{ path: string; excerpt: string }>> {
  const excerpts: Array<{ path: string; excerpt: string }> = []

  for (const filePath of filePaths.slice(0, maxFiles)) {
    try {
      const fullPath = path.join(repoPath, filePath)
      const buf = await fs.readFile(fullPath)

      // Skip likely-binary files
      if (buf.includes(0)) continue

      const text = buf.toString('utf-8')

      // Skip extremely sparse or unreadable content
      if (!text.trim()) continue

      const excerpt = text.length > maxCharsPerFile ? `${text.slice(0, maxCharsPerFile)}\n...` : text
      excerpts.push({
        path: filePath,
        excerpt,
      })
    } catch {
      // Ignore unreadable files
      continue
    }
  }

  return excerpts
}

export interface BriefGenerationInput {
  staticAnalysis: StaticAnalysis
  commitAnalysis: CommitAnalysis
  readmeContent?: string
  chatExport?: string
  reflections?: string
  githubUrl?: string
  videoLink?: string
  repoPath: string
}

export async function generateBrief(
  input: BriefGenerationInput,
  submissionId: string
): Promise<ReviewerBrief> {
  const startTime = Date.now()
  const llmProvider = getLLMProvider()
  let hasPartialData = false

  // Get file list for repo guide
  const allFiles = await getAllFiles(input.repoPath)
  const sortedFiles = allFiles.sort((a, b) => {
    const scoreA = scoreFileImportance(a, input.staticAnalysis)
    const scoreB = scoreFileImportance(b, input.staticAnalysis)
    return scoreB - scoreA
  })

  // Generate TL;DR section
  let taskDescription: string | undefined
  let deliveredDescription: string | undefined
  
  try {
    const keyFiles = sortedFiles.slice(0, 25)
    const keyFileExcerpts = await buildKeyFileExcerpts(input.repoPath, keyFiles)
    const taskPrompt = buildTaskInferencePrompt(
      input.staticAnalysis,
      input.readmeContent,
      keyFiles,
      keyFileExcerpts
    )
    taskDescription = await callLLM(taskPrompt, SYSTEM_PROMPT, 300, llmProvider)
  } catch (error) {
    console.error('Failed to generate task description:', error)
    hasPartialData = true
    taskDescription = 'Task description unavailable - analysis failed'
  }

  // Estimate review time based on file count and complexity
  const estimatedReviewTime = estimateReviewTime(input.staticAnalysis)

  // Build stack list
  const stack: string[] = []
  if (input.staticAnalysis.framework) {
    stack.push(input.staticAnalysis.framework)
  }
  const languages = Object.keys(input.staticAnalysis.languageBreakdown)
    .sort((a, b) => input.staticAnalysis.languageBreakdown[b] - input.staticAnalysis.languageBreakdown[a])
    .slice(0, 3)
  stack.push(...languages)

  // Generate work style analysis
  let workStyle: WorkStyleAnalysis = {
    iterationPattern: input.commitAnalysis.iterationPattern,
    confidence: input.commitAnalysis.hasGitHistory ? 'high' : 'low',
  }

  try {
    const workStylePrompt = buildWorkStylePrompt(input.commitAnalysis, input.chatExport)
    const workStyleResponse = await callLLM(workStylePrompt, SYSTEM_PROMPT, 500, llmProvider)
    
    // Parse work style response
    const aiCollaborationMatch = workStyleResponse.match(/AI Collaboration Style[:\s]+(.+?)(?:\n|$)/i)
    if (aiCollaborationMatch) {
      workStyle.aiCollaborationStyle = aiCollaborationMatch[1].trim()
    }

    const manualInterventionMatch = workStyleResponse.match(/Manual Intervention[:\s]+(.+?)(?:\n|$)/i)
    if (manualInterventionMatch) {
      workStyle.manualIntervention = manualInterventionMatch[1]
        .split(/[,;]/)
        .map(item => item.trim())
        .filter(Boolean)
    }
  } catch (error) {
    console.error('Failed to generate work style analysis:', error)
    hasPartialData = true
    workStyle.confidence = 'low'
  }

  // Generate decisions
  let decisions: Decision[] = []
  try {
    const decisionsPrompt = buildDecisionsPrompt(
      input.staticAnalysis,
      input.readmeContent,
      input.reflections,
      input.chatExport
    )
    const decisionsResponse = await callLLM(decisionsPrompt, SYSTEM_PROMPT, 1000, llmProvider)
    decisions = parseDecisionsResponse(decisionsResponse)
  } catch (error) {
    console.error('Failed to generate decisions:', error)
    hasPartialData = true
  }

  // Generate repo guide
  let repoGuide: RepoGuide = {
    startHere: input.staticAnalysis.entryPoints[0] || 'Unknown',
    keyFiles: [],
    skipFiles: ['node_modules', '.git', 'dist', 'build', '.next'],
  }

  try {
    const repoGuidePrompt = buildRepoGuidePrompt(input.staticAnalysis, sortedFiles)
    const repoGuideResponse = await callLLM(repoGuidePrompt, SYSTEM_PROMPT, 800, llmProvider)
    repoGuide = parseRepoGuideResponse(repoGuideResponse)
  } catch (error) {
    console.error('Failed to generate repo guide:', error)
    hasPartialData = true
    // Fallback: use top scored files
    repoGuide.keyFiles = sortedFiles.slice(0, 5).map(file => ({
      path: file,
      description: 'Important file',
    }))
  }

  // Build delivered description from static analysis
  if (!deliveredDescription) {
    deliveredDescription = buildDeliveredDescription(input.staticAnalysis)
  }

  // Compute quantifiable metrics
  let metrics
  try {
    metrics = await computeMetrics(
      input.staticAnalysis,
      input.commitAnalysis,
      input.repoPath,
      input.readmeContent
    )
  } catch (error) {
    console.error('Failed to compute metrics:', error)
    hasPartialData = true
    // Metrics are optional, so we continue without them
  }

  const analysisDuration = Date.now() - startTime

  return {
    id: submissionId,
    tldr: {
      task: taskDescription,
      delivered: deliveredDescription,
      estimatedReviewTime,
      stack,
    },
    workStyle,
    decisions,
    repoGuide,
    metrics,
    artifacts: {
      githubUrl: input.githubUrl,
      videoLink: input.videoLink,
      chatExport: input.chatExport,
    },
    metadata: {
      analyzedAt: new Date(),
      analysisDuration,
      llmProvider,
      hasPartialData,
    },
  }
}

function estimateReviewTime(staticAnalysis: StaticAnalysis): string {
  const fileCount = staticAnalysis.fileCount
  const totalLines = staticAnalysis.totalLines

  // Rough estimation: ~100 lines per minute for code review
  const minutes = Math.ceil(totalLines / 100)
  
  if (minutes < 5) return '~5 min'
  if (minutes < 10) return '~10 min'
  if (minutes < 20) return '~15 min'
  if (minutes < 30) return '~25 min'
  return '~30+ min'
}

function buildDeliveredDescription(staticAnalysis: StaticAnalysis): string {
  const parts: string[] = []

  if (staticAnalysis.framework) {
    parts.push(staticAnalysis.framework)
  }

  const languages = Object.keys(staticAnalysis.languageBreakdown)
    .sort((a, b) => staticAnalysis.languageBreakdown[b] - staticAnalysis.languageBreakdown[a])
    .slice(0, 2)
  
  if (languages.length > 0) {
    parts.push(languages.join(' + '))
  }

  if (staticAnalysis.entryPoints.length > 0) {
    parts.push(`with ${staticAnalysis.entryPoints.length} entry point(s)`)
  }

  return parts.length > 0 ? parts.join(' ') : 'Code submission'
}

