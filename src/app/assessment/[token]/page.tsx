import { redirect } from 'next/navigation'
import AssessmentSubmissionForm from '@/components/Assessment/AssessmentSubmissionForm'
import { getPromptByToken } from '@/lib/supabase/store'

export default async function AssessmentPage({
  params,
}: {
  params: { token: string }
}) {
  const { token } = params

  if (!token) {
    redirect('/')
  }

  // Fetch assessment details
  const assessment = await getPromptByToken(token)

  if (!assessment) {
    return (
      <main className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-neutral-50 border border-neutral-900 rounded-lg shadow-sm p-6 lg:p-8">
            <h1 className="text-display font-semibold mb-2 text-neutral-900">Assessment Not Found</h1>
            <p className="text-body-lg text-neutral-600">
              The assessment link you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 py-12">
      <AssessmentSubmissionForm assessment={assessment} token={token} />
    </main>
  )
}

