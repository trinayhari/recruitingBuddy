import { RepoGuide } from '@/lib/types'

interface RepoGuideSectionProps {
  repoGuide: RepoGuide
}

export default function RepoGuideSection({ repoGuide }: RepoGuideSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b">How to Read This Repo</h2>
      <div className="space-y-4">
        <div>
          <span className="font-semibold">Start here: </span>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{repoGuide.startHere}</code>
        </div>
        
        {repoGuide.keyFiles.length > 0 && (
          <div>
            <span className="font-semibold block mb-2">Key files:</span>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {repoGuide.keyFiles.map((file, index) => (
                <li key={index}>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{file.path}</code>
                  {file.description && (
                    <span className="text-gray-600 ml-2">- {file.description}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {repoGuide.skipFiles.length > 0 && (
          <div>
            <span className="font-semibold block mb-2">Skip:</span>
            <span className="text-gray-600">{repoGuide.skipFiles.join(', ')}</span>
          </div>
        )}
      </div>
    </section>
  )
}

