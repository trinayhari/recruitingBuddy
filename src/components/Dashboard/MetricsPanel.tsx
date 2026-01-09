'use client'

import { QuantifiedMetrics } from '@/lib/types'
import MetricBar from '../MetricBar'
import RedFlagBadges from './RedFlagBadges'
import CollapsibleSection from '../CollapsibleSection'

interface MetricsPanelProps {
  metrics?: QuantifiedMetrics
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) {
    return (
      <div className="bg-neutral-50 border border-neutral-900 rounded-lg shadow-sm p-6">
        <h2 className="text-h2 font-medium mb-4 text-neutral-900">Metrics</h2>
        <div className="text-body text-neutral-500">Metrics not available for this submission.</div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-50 border border-neutral-900 rounded-lg shadow-sm p-6">
      <h2 className="text-h2 font-medium mb-6 text-neutral-900">Quantified Metrics</h2>

      {/* Overall Hire Signal - Always visible */}
      <div className="mb-6 pb-6 border-b border-neutral-900">
        <h3 className="text-h2 font-medium mb-4 text-neutral-900">Overall Hire Signal</h3>
        <MetricBar value={metrics.overallHireSignal} label="Hire Signal" size="large" />
      </div>

      {/* Red Flags */}
      {metrics.redFlags.length > 0 && (
        <div className="mb-6 pb-6 border-b border-neutral-900">
          <h3 className="text-h2 font-medium mb-4 text-neutral-900">Red Flags</h3>
          <RedFlagBadges redFlags={metrics.redFlags} />
        </div>
      )}

      {/* Project Development Signals - Collapsed */}
      <CollapsibleSection title="Project Development" defaultOpen={false} className="mb-6">
        <div className="space-y-4">
          <MetricBar value={metrics.codeOrganizationScore} label="Code Organization" size="medium" />
          <MetricBar 
            value={metrics.testPresence.hasTests ? Math.min(100, metrics.testPresence.testRatio * 200) : 0} 
            label="Test Coverage" 
            size="medium" 
          />
          <div className="text-body-sm text-neutral-600 ml-4">
            {metrics.testPresence.testFileCount} test file{metrics.testPresence.testFileCount !== 1 ? 's' : ''}
          </div>
          <MetricBar value={metrics.documentationScore} label="Documentation" size="medium" />
          <MetricBar value={metrics.dependencyHealth} label="Dependency Health" size="medium" />
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
            <div className="text-body-sm text-neutral-600">
              <span className="font-medium">Avg Lines/File: </span>
              {metrics.fileSizeDistribution.averageLinesPerFile}
            </div>
            <div className="text-body-sm text-neutral-600">
              <span className="font-medium">Max File Size: </span>
              {metrics.fileSizeDistribution.maxFileSize} lines
            </div>
            {metrics.fileSizeDistribution.largeFileCount > 0 && (
              <div className="text-body-sm text-signal-moderate">
                <span className="font-medium">Large Files ({'>'}500 lines): </span>
                {metrics.fileSizeDistribution.largeFileCount}
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Software Design Signals - Collapsed */}
      <CollapsibleSection title="Software Design" defaultOpen={false} className="mb-6">
        <div className="space-y-4">
          <MetricBar value={metrics.typeSafetyRatio} label="Type Safety" size="medium" />
          <div className="text-body-sm text-neutral-600 ml-4">
            {metrics.typeSafetyRatio}% TypeScript
          </div>
          <MetricBar value={metrics.modularityIndex} label="Modularity" size="medium" />
          <MetricBar value={metrics.entryPointClarity} label="Entry Points" size="medium" />
          <MetricBar value={metrics.apiStructureScore} label="API Structure" size="medium" />
        </div>
      </CollapsibleSection>

      {/* Work Habit Signals - Collapsed */}
      <CollapsibleSection title="Work Habits" defaultOpen={false}>
        <div className="space-y-4">
          <MetricBar value={metrics.commitQualityScore} label="Commit Quality" size="medium" />
          <MetricBar value={metrics.developmentPatternScore} label="Development Pattern" size="medium" />
          <MetricBar value={metrics.timeInvestment.score} label="Time Investment" size="medium" />
          <div className="text-body-sm text-neutral-600 ml-4">
            {metrics.timeInvestment.hours.toFixed(1)} hours
          </div>
          <MetricBar value={metrics.iterationScore} label="Iteration" size="medium" />
        </div>
      </CollapsibleSection>
    </div>
  )
}

