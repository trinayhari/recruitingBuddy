import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { cloneRepository, cleanupRepository } from '@/lib/ingestion/github'
import { extractZipFile, cleanupExtractedFiles } from '@/lib/ingestion/zipHandler'
import { performStaticAnalysis } from '@/lib/analysis/staticAnalysis'
import { analyzeCommits } from '@/lib/analysis/commitAnalysis'
import { findAndReadReadme } from '@/lib/analysis/readmeParser'
import { generateBrief, BriefGenerationInput } from '@/lib/brief/generator'
import { briefsStore } from '@/lib/store'
import { appendFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE CALLED ===', Date.now());
  // #region agent log
  try {
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    const logEntry = JSON.stringify({location:'route.ts:16',message:'POST handler called',data:{timestamp:Date.now(),cwd:process.cwd(),logPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n';
    await appendFile(logPath, logEntry);
    console.log('=== LOG WRITTEN ===', logPath);
  } catch (logError) {
    console.error('=== LOG ERROR ===', logError);
  }
  // #endregion
  try {
    const formData = await request.formData()
    
    const githubUrl = formData.get('githubUrl') as string | null
    const zipFile = formData.get('zipFile') as File | null
    const videoLink = formData.get('videoLink') as string | null
    const chatExport = formData.get('chatExport') as string | null
    const reflections = formData.get('reflections') as string | null

    // Validate input
    if (!githubUrl && !zipFile) {
      return NextResponse.json(
        { error: 'Either GitHub URL or zip file is required' },
        { status: 400 }
      )
    }

    // Generate submission ID
    const submissionId = uuidv4()
    let repoPath: string | null = null

    try {
      // Step 1: Ingest repository
      if (githubUrl) {
        repoPath = await cloneRepository(githubUrl, submissionId)
      } else if (zipFile) {
        const arrayBuffer = await zipFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        repoPath = await extractZipFile(buffer, submissionId)
      }

      if (!repoPath) {
        throw new Error('Failed to ingest repository')
      }

      // Step 2: Perform static analysis
      const staticAnalysis = await performStaticAnalysis(repoPath)

      // Step 3: Analyze commits
      const commitAnalysis = await analyzeCommits(repoPath)

      // Step 4: Read README
      const readmeContent = await findAndReadReadme(repoPath)

      // Step 5: Generate brief
      const briefInput: BriefGenerationInput = {
        staticAnalysis,
        commitAnalysis,
        readmeContent,
        chatExport: chatExport || undefined,
        reflections: reflections || undefined,
        githubUrl: githubUrl || undefined,
        videoLink: videoLink || undefined,
        repoPath,
      }

      let brief
      try {
        brief = await generateBrief(briefInput, submissionId)
      } catch (briefError) {
        console.error('Brief generation error:', briefError)
        // Create a minimal brief with static analysis only
        brief = {
          id: submissionId,
          tldr: {
            delivered: `Code submission with ${staticAnalysis.fileCount} files`,
            stack: Object.keys(staticAnalysis.languageBreakdown).slice(0, 3),
          },
          workStyle: {
            iterationPattern: commitAnalysis.iterationPattern,
            confidence: (commitAnalysis.hasGitHistory ? 'high' : 'low') as 'low' | 'medium' | 'high',
          },
          decisions: [],
          repoGuide: {
            startHere: staticAnalysis.entryPoints[0] || 'Unknown',
            keyFiles: [],
            skipFiles: ['node_modules', '.git', 'dist', 'build'],
          },
          artifacts: {
            githubUrl: githubUrl || undefined,
            videoLink: videoLink || undefined,
          },
          metadata: {
            analyzedAt: new Date(),
            analysisDuration: 0,
            llmProvider: 'none',
            hasPartialData: true,
          },
        }
      }

      // Store brief in file-based store
      // #region agent log
      const logPath2 = join(process.cwd(), '.cursor', 'debug.log');
      const storeKeysBefore = await briefsStore.keys();
      const storeSizeBefore = await briefsStore.size();
      const logEntry2 = JSON.stringify({location:'route.ts:110',message:'Before storing brief',data:{submissionId,storeSize:storeSizeBefore,storeKeys:storeKeysBefore},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
      appendFile(logPath2, logEntry2).catch(()=>{});
      // #endregion
      await briefsStore.set(submissionId, brief)
      // #region agent log
      const logPath3 = join(process.cwd(), '.cursor', 'debug.log');
      const storeKeysAfter = await briefsStore.keys();
      const storeSizeAfter = await briefsStore.size();
      const hasBrief = await briefsStore.has(submissionId);
      const logEntry3 = JSON.stringify({location:'route.ts:112',message:'After storing brief',data:{submissionId,storeSize:storeSizeAfter,storeKeys:storeKeysAfter,hasBrief},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n';
      appendFile(logPath3, logEntry3).catch(()=>{});
      // #endregion
      console.log('Brief stored with ID:', submissionId)
      console.log('Total briefs in store:', await briefsStore.size())

      // Cleanup repository files (async, don't wait)
      if (githubUrl) {
        cleanupRepository(repoPath).catch(console.error)
      } else {
        cleanupExtractedFiles(repoPath).catch(console.error)
      }

      // #region agent log
      const logPath4 = join(process.cwd(), '.cursor', 'debug.log');
      const finalStoreKeys = await briefsStore.keys();
      const finalStoreSize = await briefsStore.size();
      const finalHasBrief = await briefsStore.has(submissionId);
      const logEntry4 = JSON.stringify({location:'route.ts:127',message:'Returning response with ID',data:{submissionId,storeSize:finalStoreSize,storeKeys:finalStoreKeys,hasBrief:finalHasBrief},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n';
      appendFile(logPath4, logEntry4).catch(()=>{});
      // #endregion
      return NextResponse.json({ id: submissionId })
    } catch (error) {
      // Cleanup on error
      if (repoPath) {
        if (githubUrl) {
          cleanupRepository(repoPath).catch(console.error)
        } else {
          cleanupExtractedFiles(repoPath).catch(console.error)
        }
      }

      throw error
    }
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    )
  }
}

