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
    <section>
      <h2 className="text-h1 font-semibold mb-4 text-neutral-900">Raw Artifacts</h2>
      <div className="space-y-3">
        {artifacts.githubUrl && (
          <div>
            <a
              href={artifacts.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body text-primary-600 hover:text-primary-700 font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
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
              className="text-body text-primary-600 hover:text-primary-700 font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
            >
              Demo Video →
            </a>
          </div>
        )}
        {artifacts.chatExport && (
          <div>
            <span className="text-body-sm text-neutral-600">AI Chat Export: </span>
            <span className="text-body-sm text-neutral-900">Available (see analysis above)</span>
          </div>
        )}
      </div>
    </section>
  )
}

