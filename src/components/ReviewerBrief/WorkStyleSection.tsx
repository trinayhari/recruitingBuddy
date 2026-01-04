import { WorkStyleAnalysis } from '@/lib/types'

interface WorkStyleSectionProps {
  workStyle: WorkStyleAnalysis
}

export default function WorkStyleSection({ workStyle }: WorkStyleSectionProps) {
  const iterationLabel = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
  }[workStyle.iterationPattern]

  return (
    <section className="border-l-[3px] border-l-neutral-200 pl-5 -ml-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-h1 font-semibold text-neutral-900">How the Candidate Worked</h2>
        <span className="text-caption text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">AI Analysis</span>
      </div>
      <div className="space-y-4">
        <div>
          <span className="text-body-sm font-medium text-neutral-600">Iteration Pattern: </span>
          <span className="text-body text-neutral-900 font-medium">
            {iterationLabel}
          </span>
        </div>
        {workStyle.aiCollaborationStyle && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600">AI Collaboration: </span>
            <span className="text-body text-neutral-900">{workStyle.aiCollaborationStyle}</span>
          </div>
        )}
        {workStyle.manualIntervention && workStyle.manualIntervention.length > 0 && (
          <div>
            <span className="text-body-sm font-medium text-neutral-600">Manual Intervention: </span>
            <span className="text-body text-neutral-900">{workStyle.manualIntervention.join(', ')}</span>
          </div>
        )}
        {workStyle.confidence === 'low' && (
          <div className="text-body-sm text-neutral-500">
            Note: Limited data available for work style analysis
          </div>
        )}
      </div>
    </section>
  )
}

