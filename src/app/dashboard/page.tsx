import Link from 'next/link'
import { redirect } from 'next/navigation'
import { briefsStore } from '@/lib/store'
import DashboardClient from '@/components/Dashboard/DashboardClient'
import { getUser } from '@/lib/auth/server'
import { getSubmissionsByUserId, getPromptsByUserId, getSubmissionsByPromptId } from '@/lib/supabase/store'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { selected?: string }
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  // Get user's assessments (prompts with shareable tokens)
  const assessments = await getPromptsByUserId(user.id)
  const assessmentsWithSubmissions = await Promise.all(
    assessments.map(async (assessment) => {
      const submissions = await getSubmissionsByPromptId(assessment.id)
      return {
        ...assessment,
        submissions: submissions.map(s => s.brief_data).filter(Boolean),
        submissionCount: submissions.length,
      }
    })
  )

  // Get user's own submissions from Supabase
  const submissions = await getSubmissionsByUserId(user.id)
  
  // Also get from file store for backward compatibility
  const ids = await briefsStore.keys()
  const briefs = await Promise.all(
    ids.map(async (id) => {
      const brief = await briefsStore.get(id)
      return brief || null
    })
  )

  // Combine both sources, prioritizing Supabase submissions
  const submissionIds = new Set(submissions.map(s => s.id))
  const fileStoreBriefs = briefs
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .filter(b => !submissionIds.has(b.id)) // Don't duplicate

  // Get briefs from Supabase submissions
  const supabaseBriefs = submissions
    .map(s => s.brief_data)
    .filter((b): b is NonNullable<typeof b> => Boolean(b))

  const items = [...supabaseBriefs, ...fileStoreBriefs]
    .sort((a, b) => {
      const aTime = a.metadata?.analyzedAt?.getTime() || 0
      const bTime = b.metadata?.analyzedAt?.getTime() || 0
      return bTime - aTime
    })

  return (
    <main className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-display font-semibold text-neutral-900">Dashboard</h1>
            <p className="text-body-lg text-neutral-600 mt-1">Select a submission to view analysis and try the project.</p>
          </div>
          <Link 
            href="/submit" 
            className="text-body-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
          >
            Analyze another submission
          </Link>
        </div>

        <DashboardClient 
          briefs={items} 
          assessments={assessmentsWithSubmissions}
          initialSelectedId={searchParams?.selected || null} 
        />
      </div>
    </main>
  )
}
