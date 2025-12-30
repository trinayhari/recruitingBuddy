import { Decision } from '@/lib/types'

interface DecisionsSectionProps {
  decisions: Decision[]
}

export default function DecisionsSection({ decisions }: DecisionsSectionProps) {
  if (decisions.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Key Decisions & Tradeoffs</h2>
        <p className="text-gray-500 italic">No clear decisions could be inferred from the available information.</p>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b">Key Decisions & Tradeoffs</h2>
      <ul className="space-y-3">
        {decisions.map((decision, index) => (
          <li key={index} className="flex flex-col">
            <span className="font-medium">• {decision.decision}</span>
            {decision.rationale && (
              <span className="text-sm text-gray-600 ml-4">{decision.rationale}</span>
            )}
            <span className="text-xs text-gray-400 ml-4">(Source: {decision.source})</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

