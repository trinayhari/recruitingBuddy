import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import TLDRSection from '@/components/ReviewerBrief/TLDRSection'
import WorkStyleSection from '@/components/ReviewerBrief/WorkStyleSection'
import DecisionsSection from '@/components/ReviewerBrief/DecisionsSection'
import RepoGuideSection from '@/components/ReviewerBrief/RepoGuideSection'
import ArtifactsSection from '@/components/ReviewerBrief/ArtifactsSection'
import { ReviewerBrief } from '@/lib/types'
import { briefsStore } from '@/lib/store'
import { appendFile } from 'fs/promises'
import { join } from 'path'
import { getUser } from '@/lib/auth/server'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function generateStaticParams() {
  return []
}

async function getBrief(id: string): Promise<ReviewerBrief | null> {
  // In production, fetch from database
  // #region agent log
  const logPath = join(process.cwd(), '.cursor', 'debug.log');
  const storeKeys = await briefsStore.keys();
  const storeSize = await briefsStore.size();
  const hasBrief = await briefsStore.has(id);
  const logEntry = JSON.stringify({location:'page.tsx:17',message:'getBrief called',data:{id,storeSize,storeKeys,hasBrief},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
  appendFile(logPath, logEntry).catch(()=>{});
  // #endregion
  const brief = await briefsStore.get(id) || null
  // #region agent log
  const finalStoreKeys = await briefsStore.keys();
  const finalStoreSize = await briefsStore.size();
  const logEntry2 = JSON.stringify({location:'page.tsx:20',message:'getBrief result',data:{id,briefFound:!!brief,storeSize:finalStoreSize,storeKeys:finalStoreKeys},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
  appendFile(logPath, logEntry2).catch(()=>{});
  // #endregion
  return brief
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Handle both Promise and direct params (Next.js 14 compatibility)
  const resolvedParams = await Promise.resolve(params)
  
  // Verify authentication
  const user = await getUser()
  if (!user) {
    redirect(`/login?redirect=/review/${resolvedParams.id}`)
  }

  // Check ownership if submission exists in Supabase
  const client = getSupabaseClient()
  if (client) {
    const { data: submission } = await client
      .from('submissions')
      .select('user_id')
      .eq('id', resolvedParams.id)
      .single()

    if (submission && submission.user_id !== user.id) {
      notFound() // Return 404 instead of 403 to avoid leaking existence
    }
  }

  // #region agent log
  const logPath = join(process.cwd(), '.cursor', 'debug.log');
  const storeKeys = await briefsStore.keys();
  const storeSize = await briefsStore.size();
  const logEntry = JSON.stringify({location:'page.tsx:25',message:'ReviewPage called',data:{id:resolvedParams.id,storeSize,storeKeys},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
  appendFile(logPath, logEntry).catch(()=>{});
  // #endregion
  const brief = await getBrief(resolvedParams.id)

  if (!brief) {
    console.log('Brief not found for ID:', resolvedParams.id)
    console.log('Available briefs:', await briefsStore.keys())
    notFound()
  }

  return (
    <main className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-neutral-100 border border-neutral-400 rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-display font-semibold text-neutral-900">Take-Home Review Buddy</h1>
            <p className="text-body-lg text-neutral-600 mt-1">
              Reviewer Brief • {brief.metadata.analyzedAt.toLocaleString()}
            </p>
            {brief.metadata.hasPartialData && (
              <div className="mt-3 text-body-sm text-signal-moderate bg-neutral-50 border-l-[3px] border-l-signal-moderate px-4 py-2.5 rounded-r-md">
                Some analysis data is incomplete or unavailable
              </div>
            )}
          </div>

          <div className="space-y-12">
            <TLDRSection tldr={brief.tldr} metrics={brief.metrics} />
            <WorkStyleSection workStyle={brief.workStyle} />
            <DecisionsSection decisions={brief.decisions} />
            <RepoGuideSection repoGuide={brief.repoGuide} />
            <ArtifactsSection artifacts={brief.artifacts} />
          </div>

          <div className="mt-12 pt-6 border-t border-neutral-200 text-caption text-neutral-500">
            Analysis completed in {brief.metadata.analysisDuration}ms using {brief.metadata.llmProvider}
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6">
            <Link
              href="/submit"
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded inline-flex items-center"
            >
              ← Analyze another submission
            </Link>

            <Link
              href="/dashboard"
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded inline-flex items-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

