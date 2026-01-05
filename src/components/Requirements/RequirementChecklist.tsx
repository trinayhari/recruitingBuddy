'use client'

import { RequirementScore, Requirement } from '@/lib/requirements/types';

interface RequirementChecklistProps {
  requirements: Requirement[];
  scores: RequirementScore[];
  onRequirementClick?: (requirementId: string) => void;
}

export default function RequirementChecklist({
  requirements,
  scores,
  onRequirementClick,
}: RequirementChecklistProps) {
  const getStatusColor = (status: RequirementScore['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'untested':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: RequirementScore['status']) => {
    switch (status) {
      case 'pass':
        return '✓';
      case 'fail':
        return '✗';
      case 'partial':
        return '~';
      case 'untested':
        return '?';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-body-lg font-semibold text-neutral-900 mb-4">
        Requirements Checklist
      </h3>
      {requirements.map((requirement) => {
        const score = scores.find((s) => s.requirement_id === requirement.id);
        const status = score?.status || 'untested';
        const testCount = score ? `${score.passing_tests}/${score.total_tests}` : '0/0';

        return (
          <div
            key={requirement.id}
            className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
              onRequirementClick ? 'cursor-pointer' : ''
            } ${getStatusColor(status)}`}
            onClick={() => onRequirementClick?.(requirement.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-body-sm font-semibold">
                    {requirement.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-body-xs font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {getStatusIcon(status)} {status.toUpperCase()}
                  </span>
                  <span className="text-body-xs text-neutral-600">
                    Weight: {requirement.weight}/10
                  </span>
                </div>
                <p className="text-body-sm text-neutral-900 mb-2">
                  {requirement.description}
                </p>
                {requirement.acceptance_criteria.length > 0 && (
                  <ul className="list-disc list-inside text-body-xs text-neutral-700 space-y-1">
                    {requirement.acceptance_criteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                )}
                {score && score.total_tests > 0 && (
                  <div className="mt-2 text-body-xs text-neutral-600">
                    Tests: {testCount} passing
                  </div>
                )}
                {score && score.failing_tests.length > 0 && (
                  <div className="mt-2 text-body-xs text-red-700">
                    {score.failing_tests.length} test(s) failed
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

