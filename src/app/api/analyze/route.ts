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
import { createPrompt, saveSubmission, getPromptByToken } from '@/lib/supabase/store'
import { extractRequirements, postProcessRequirements } from '@/lib/requirements/extractor'
import { generateTestSuite } from '@/lib/testing/generator'
import { getUser } from '@/lib/auth/server'

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
    let projectPrompt = formData.get('projectPrompt') as string | null
    const assessmentToken = formData.get('assessmentToken') as string | null
    const autoGenerateTests = formData.get('autoGenerateTests') === 'true'

    // Verify authentication - allow unauthenticated access if assessmentToken is provided
    let user = null
    try {
      user = await getUser()
    } catch (authError) {
      // If auth fails and no assessmentToken, require authentication
      if (!assessmentToken || !assessmentToken.trim()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // If assessmentToken is provided, allow unauthenticated access
    }
    
    // If no assessmentToken and no user, require authentication
    if (!assessmentToken && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      
      // Handle assessment token - if provided, get the prompt_id
      let promptId: string | undefined
      if (assessmentToken && assessmentToken.trim()) {
        try {
          const assessment = await getPromptByToken(assessmentToken.trim())
          if (assessment) {
            promptId = assessment.id
            // Use the assessment content as project prompt if not provided
            if (!projectPrompt) {
              projectPrompt = assessment.content
            }
          }
        } catch (error) {
          console.error('Error fetching assessment:', error)
        }
      }

      // Save submission to Supabase (if configured and user is authenticated)
      if (user) {
        await saveSubmission(submissionId, user.id, {
          promptId,
          githubUrl: githubUrl || undefined,
          videoLink: videoLink || undefined,
          chatExport: chatExport || undefined,
          reflections: reflections || undefined,
          briefData: brief,
        })
      }

      // Handle project prompt and auto-generate requirements/tests if provided
      let requirementSpecId: string | undefined
      let testSuiteId: string | undefined

      if (projectPrompt && projectPrompt.trim() && !promptId && user) {
        try {
          // Create prompt (only if not already set from assessment token and user is authenticated)
          const result = await createPrompt(projectPrompt.trim(), user.id, {})
          promptId = result.id
          
          // Update submission with prompt_id
          await saveSubmission(submissionId, user.id, { promptId })

          if (autoGenerateTests) {
            // Extract requirements
            const extractionResult = await extractRequirements(projectPrompt.trim())
            const processedSpec = postProcessRequirements(extractionResult.spec)
            
            // Save requirement spec
            const { saveRequirementSpec } = await import('@/lib/supabase/store')
            requirementSpecId = await saveRequirementSpec(promptId, processedSpec)

            // Generate test suite
            const testSuite = await generateTestSuite(
              processedSpec,
              requirementSpecId,
              staticAnalysis
            )
            
            // Save test suite
            const { saveTestSuite } = await import('@/lib/supabase/store')
            testSuiteId = await saveTestSuite(testSuite)
          }
        } catch (error) {
          console.error('Error processing project prompt:', error)
          // Continue without failing the whole request
        }
      }

      // #region agent log
      const logPath3 = join(process.cwd(), '.cursor', 'debug.log');
      const storeKeysAfter = await briefsStore.keys();
      const storeSizeAfter = await briefsStore.size();
      const hasBrief = await briefsStore.has(submissionId);
      const logEntry3 = JSON.stringify({location:'route.ts:112',message:'After storing brief',data:{submissionId,storeSize:storeSizeAfter,storeKeys:storeKeysAfter,hasBrief,promptId,requirementSpecId,testSuiteId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n';
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
      const logEntry4 = JSON.stringify({location:'route.ts:127',message:'Returning response with ID',data:{submissionId,storeSize:finalStoreSize,storeKeys:finalStoreKeys,hasBrief:finalHasBrief,promptId,requirementSpecId,testSuiteId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n';
      appendFile(logPath4, logEntry4).catch(()=>{});
      // #endregion
      return NextResponse.json({ 
        id: submissionId,
        prompt_id: promptId,
        requirement_spec_id: requirementSpecId,
        test_suite_id: testSuiteId,
      })
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

