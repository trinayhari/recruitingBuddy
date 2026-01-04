import { ReviewerBrief } from '@/lib/types'

interface TLDRSectionProps {
  tldr: ReviewerBrief['tldr']
  metrics?: ReviewerBrief['metrics']
}

import MetricBar from '../MetricBar'

export default function TLDRSection({ tldr, metrics }: TLDRSectionProps) {
  return (
    <section className="border-l-[3px] border-l-neutral-200 pl-5 -ml-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-h1 font-semibold text-neutral-900">Summary</h2>
        <span className="text-caption text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">AI Analysis</span>
      </div>
      <div className="space-y-4">
        {tldr.task && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600">Task: </span>
            <span className="text-body text-neutral-900">{tldr.task}</span>
          </div>
        )}
        {tldr.delivered && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600">Delivered: </span>
            <span className="text-body text-neutral-900">{tldr.delivered}</span>
          </div>
        )}
        {tldr.estimatedReviewTime && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600">Estimated Review Time: </span>
            <span className="text-body text-neutral-900">{tldr.estimatedReviewTime}</span>
          </div>
        )}
        {tldr.stack && tldr.stack.length > 0 && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600">Stack: </span>
            <span className="text-body text-neutral-900">{tldr.stack.join(', ')}</span>
          </div>
        )}
        {metrics && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="text-body-sm font-medium text-neutral-600 mb-4">Key Metrics</div>
            <div className="space-y-4">
              <MetricBar value={metrics.overallHireSignal} label="Hire Signal" size="medium" />
              <MetricBar value={metrics.codeOrganizationScore} label="Code Organization" size="medium" />
              <div className="text-body-sm text-neutral-600">
                <span className="font-medium">Tests: </span>
                {metrics.testPresence.hasTests ? `${metrics.testPresence.testFileCount} files` : 'None'}
              </div>
              <div className="text-body-sm text-neutral-600">
                <span className="font-medium">Type Safety: </span>
                {metrics.typeSafetyRatio}% TypeScript
              </div>
              {metrics.redFlags.length > 0 && (
                <div className="text-body-sm text-signal-low font-medium">
                  {metrics.redFlags.length} red flag{metrics.redFlags.length !== 1 ? 's' : ''} detected
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

