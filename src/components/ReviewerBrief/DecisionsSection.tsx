import { Decision } from '@/lib/types'

interface DecisionsSectionProps {
  decisions: Decision[]
}

export default function DecisionsSection({ decisions }: DecisionsSectionProps) {
  if (decisions.length === 0) {
    return (
      <section className="border-l-[3px] border-l-neutral-200 pl-5 -ml-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-h1 font-semibold text-neutral-900">Key Decisions & Tradeoffs</h2>
          <span className="text-caption text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">AI Analysis</span>
        </div>
        <p className="text-body text-neutral-500">No clear decisions could be inferred from the available information.</p>
      </section>
    )
  }

  return (
    <section className="border-l-3 border-l-neutral-200 pl-5 -ml-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-h1 font-semibold text-neutral-900">Key Decisions & Tradeoffs</h2>
        <span className="text-caption text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">AI Analysis</span>
      </div>
      <ul className="space-y-4">
        {decisions.map((decision, index) => (
          <li key={index} className="flex flex-col">
            <span className="text-body font-medium text-neutral-900">{decision.decision}</span>
            {decision.rationale && (
              <span className="text-body-sm text-neutral-600 mt-1 ml-4">{decision.rationale}</span>
            )}
            <span className="text-caption text-neutral-500 mt-1 ml-4">(Source: {decision.source})</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

