import Link from 'next/link'
import { briefsStore } from '@/lib/store'
import DashboardClient from '@/components/Dashboard/DashboardClient'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { selected?: string }
}) {
  const ids = await briefsStore.keys()
  const briefs = await Promise.all(
    ids.map(async (id) => {
      const brief = await briefsStore.get(id)
      return brief || null
    })
  )

  const items = briefs
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .sort((a, b) => b.metadata.analyzedAt.getTime() - a.metadata.analyzedAt.getTime())

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">Select a submission to view analysis and try the project.</p>
          </div>
          <Link href="/" className="text-blue-600 hover:underline">
            Analyze another submission
          </Link>
        </div>

        <DashboardClient briefs={items} initialSelectedId={searchParams?.selected || null} />
      </div>
    </main>
  )
}
