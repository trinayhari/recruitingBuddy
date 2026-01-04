import { RepoGuide } from '@/lib/types'

interface RepoGuideSectionProps {
  repoGuide: RepoGuide
}

export default function RepoGuideSection({ repoGuide }: RepoGuideSectionProps) {
  return (
    <section className="border-l-[3px] border-l-neutral-200 pl-5 -ml-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-h1 font-semibold text-neutral-900">How to Read This Repo</h2>
        <span className="text-caption text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">AI Analysis</span>
      </div>
      <div className="space-y-4">
        <div>
          <span className="text-body-sm font-medium text-neutral-600">Start here: </span>
          <code className="bg-neutral-100 px-2 py-1 rounded text-body-sm font-mono text-neutral-900">{repoGuide.startHere}</code>
        </div>
        
        {repoGuide.keyFiles.length > 0 && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600 block mb-2">Key files:</span>
            <ul className="space-y-2 ml-4">
              {repoGuide.keyFiles.map((file, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-body-sm text-neutral-400">•</span>
                  <div>
                    <code className="bg-neutral-100 px-2 py-1 rounded text-body-sm font-mono text-neutral-900">{file.path}</code>
                    {file.description && (
                      <span className="text-body-sm text-neutral-600 ml-2">- {file.description}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {repoGuide.skipFiles.length > 0 && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600 block mb-2">Skip:</span>
            <span className="text-body text-neutral-600">{repoGuide.skipFiles.join(', ')}</span>
          </div>
        )}
      </div>
    </section>
  )
}

