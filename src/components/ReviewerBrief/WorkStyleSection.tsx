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

  const iterationColor = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-green-100 text-green-800',
  }[workStyle.iterationPattern]

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b">How the Candidate Worked</h2>
      <div className="space-y-3">
        <div>
          <span className="font-semibold">Iteration Pattern: </span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${iterationColor}`}>
            {iterationLabel}
          </span>
        </div>
        {workStyle.aiCollaborationStyle && (
          <div>
            <span className="font-semibold">AI Collaboration: </span>
            <span>{workStyle.aiCollaborationStyle}</span>
          </div>
        )}
        {workStyle.manualIntervention && workStyle.manualIntervention.length > 0 && (
          <div>
            <span className="font-semibold">Manual Intervention: </span>
            <span>{workStyle.manualIntervention.join(', ')}</span>
          </div>
        )}
        {workStyle.confidence === 'low' && (
          <div className="text-sm text-gray-500 italic">
            Note: Limited data available for work style analysis
          </div>
        )}
      </div>
    </section>
  )
}

