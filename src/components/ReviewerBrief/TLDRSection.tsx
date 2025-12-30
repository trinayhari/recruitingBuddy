import { ReviewerBrief } from '@/lib/types'

interface TLDRSectionProps {
  tldr: ReviewerBrief['tldr']
}

export default function TLDRSection({ tldr }: TLDRSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b">TL;DR</h2>
      <div className="space-y-3">
        {tldr.task && (
          <div>
            <span className="font-semibold">Task: </span>
            <span>{tldr.task}</span>
          </div>
        )}
        {tldr.delivered && (
          <div>
            <span className="font-semibold">Delivered: </span>
            <span>{tldr.delivered}</span>
          </div>
        )}
        {tldr.estimatedReviewTime && (
          <div>
            <span className="font-semibold">Estimated Review Time: </span>
            <span>{tldr.estimatedReviewTime}</span>
          </div>
        )}
        {tldr.stack && tldr.stack.length > 0 && (
          <div>
            <span className="font-semibold">Stack: </span>
            <span>{tldr.stack.join(', ')}</span>
          </div>
        )}
      </div>
    </section>
  )
}

