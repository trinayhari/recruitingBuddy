'use client'

import { OverallScore } from '@/lib/requirements/types';

interface ScoreCardProps {
  score: OverallScore;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
      <h3 className="text-body-lg font-semibold text-neutral-900 mb-4">
        Overall Score
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Requirements Met */}
        <div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">
            {score.requirements_met}/{score.total_requirements}
          </div>
          <div className="text-body-sm text-neutral-600">Requirements Met</div>
        </div>

        {/* Percentage Score */}
        <div>
          <div className={`text-3xl font-bold mb-1 ${getScoreColor(score.percentage)}`}>
            {score.percentage.toFixed(1)}%
          </div>
          <div className="text-body-sm text-neutral-600">Overall Score</div>
        </div>

        {/* Weighted Score */}
        <div>
          <div className={`text-3xl font-bold mb-1 ${getScoreColor(score.weighted_score)}`}>
            {score.weighted_score.toFixed(1)}/100
          </div>
          <div className="text-body-sm text-neutral-600">Weighted Score</div>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-sm font-medium text-neutral-700">
            Confidence Score
          </span>
          <span className="text-body-sm text-neutral-600">
            {getConfidenceLabel(score.confidence_score)}
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              score.confidence_score >= 80
                ? 'bg-green-600'
                : score.confidence_score >= 60
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${score.confidence_score}%` }}
          />
        </div>
        <p className="text-body-xs text-neutral-500 mt-1">
          Based on test coverage breadth and quality
        </p>
      </div>

      {/* Breakdown by Type */}
      <div>
        <h4 className="text-body-sm font-medium text-neutral-900 mb-3">
          Breakdown by Type
        </h4>
        <div className="space-y-2">
          {Object.entries(score.breakdown).map(([type, data]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-body-sm text-neutral-700 capitalize">
                {type}
              </span>
              <span className="text-body-sm text-neutral-600">
                {data.passed}/{data.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

