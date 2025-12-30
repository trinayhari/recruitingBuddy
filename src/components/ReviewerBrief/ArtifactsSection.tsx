import { ReviewerBrief } from '@/lib/types'

interface ArtifactsSectionProps {
  artifacts: ReviewerBrief['artifacts']
}

export default function ArtifactsSection({ artifacts }: ArtifactsSectionProps) {
  const hasArtifacts = artifacts.githubUrl || artifacts.videoLink || artifacts.chatExport

  if (!hasArtifacts) {
    return null
  }

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Raw Artifacts</h2>
      <div className="space-y-2">
        {artifacts.githubUrl && (
          <div>
            <a
              href={artifacts.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Repo →
            </a>
          </div>
        )}
        {artifacts.videoLink && (
          <div>
            <a
              href={artifacts.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Demo Video →
            </a>
          </div>
        )}
        {artifacts.chatExport && (
          <div>
            <span className="text-gray-600">AI Chat Export: </span>
            <span className="text-sm">Available (see analysis above)</span>
          </div>
        )}
      </div>
    </section>
  )
}

