import { notFound } from 'next/navigation'
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
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6 pb-4 border-b">
            <h1 className="text-3xl font-bold">Take-Home Review Buddy</h1>
            <p className="text-gray-600 mt-1">
              Reviewer Brief • {brief.metadata.analyzedAt.toLocaleString()}
            </p>
            {brief.metadata.hasPartialData && (
              <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
                ⚠️ Some analysis data is incomplete or unavailable
              </div>
            )}
          </div>

          <TLDRSection tldr={brief.tldr} />
          <WorkStyleSection workStyle={brief.workStyle} />
          <DecisionsSection decisions={brief.decisions} />
          <RepoGuideSection repoGuide={brief.repoGuide} />
          <ArtifactsSection artifacts={brief.artifacts} />

          <div className="mt-8 pt-4 border-t text-xs text-gray-400">
            Analysis completed in {brief.metadata.analysisDuration}ms using {brief.metadata.llmProvider}
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6">
            <Link
              href="/"
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              ← Analyze another submission
            </Link>

            <Link
              href="/dashboard"
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

