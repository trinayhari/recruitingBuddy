'use client'

import { RedFlag } from '@/lib/types'
import InlineAlert from '../InlineAlert'

interface RedFlagBadgesProps {
  redFlags: RedFlag[]
}

export default function RedFlagBadges({ redFlags }: RedFlagBadgesProps) {
  if (redFlags.length === 0) {
    return (
      <div className="text-body-sm text-neutral-500">
        No red flags detected
      </div>
    )
  }

  const getVariant = (severity: RedFlag['severity']): 'error' | 'warning' => {
    return severity === 'high' ? 'error' : 'warning'
  }

  const getTypeLabel = (type: RedFlag['type']): string => {
    switch (type) {
      case 'hardcoded_secrets':
        return 'Hardcoded Secrets'
      case 'high_todos':
        return 'High TODO Count'
      case 'console_logs':
        return 'Console.logs in Production'
      case 'large_files':
        return 'Large Files'
      case 'no_gitignore':
        return 'No .gitignore'
      default:
        return 'Unknown Issue'
    }
  }

  return (
    <div className="space-y-2">
      {redFlags.map((flag, index) => (
        <InlineAlert key={index} variant={getVariant(flag.severity)}>
          <div>
            <div className="font-medium text-body-sm text-neutral-900 mb-1">
              {getTypeLabel(flag.type)}
            </div>
            <div className="text-body-sm text-neutral-700">{flag.description}</div>
            {flag.count !== undefined && (
              <div className="text-caption text-neutral-600 mt-1">
                Count: {flag.count}
              </div>
            )}
          </div>
        </InlineAlert>
      ))}
    </div>
  )
}

