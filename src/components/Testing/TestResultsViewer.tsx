'use client'

import { useState } from 'react';
import { TestResult } from '@/lib/requirements/types';

interface TestResultsViewerProps {
  results: TestResult[];
  onTestClick?: (test: TestResult) => void;
}

export default function TestResultsViewer({
  results,
  onTestClick,
}: TestResultsViewerProps) {
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail' | 'error'>('all');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const filteredResults =
    filter === 'all'
      ? results
      : results.filter((r) => r.status === filter);

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'timeout':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    errors: results.filter((r) => r.status === 'error').length,
    timeouts: results.filter((r) => r.status === 'timeout').length,
  };

  return (
    <div className="bg-neutral-50 border border-neutral-900 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-body-lg font-semibold text-neutral-900">
          Test Results
        </h3>
        <div className="flex gap-2">
          {(['all', 'pass', 'fail', 'error'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-body-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} (
              {f === 'all'
                ? summary.total
                : summary[f as keyof typeof summary] || 0}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900">{summary.total}</div>
          <div className="text-body-xs text-neutral-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
          <div className="text-body-xs text-neutral-600">Passed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
          <div className="text-body-xs text-neutral-600">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{summary.errors}</div>
          <div className="text-body-xs text-neutral-600">Errors</div>
        </div>
      </div>

      {/* Test List */}
      <div className="space-y-2">
        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No tests match the selected filter
          </div>
        ) : (
          filteredResults.map((test, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
                test.status
              )}`}
              onClick={() => {
                setExpandedTest(expandedTest === test.test_name ? null : test.test_name);
                onTestClick?.(test);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-mono text-body-sm font-medium mb-1">
                    {test.test_name}
                  </div>
                  {test.requirement_ids.length > 0 && (
                    <div className="text-body-xs text-neutral-600 mb-1">
                      Requirements: {test.requirement_ids.join(', ')}
                    </div>
                  )}
                  {test.duration_ms > 0 && (
                    <div className="text-body-xs text-neutral-600">
                      Duration: {test.duration_ms}ms
                    </div>
                  )}
                </div>
                <div
                  className={`px-2 py-1 rounded text-body-xs font-medium ${getStatusColor(
                    test.status
                  )}`}
                >
                  {test.status.toUpperCase()}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTest === test.test_name && (
                <div className="mt-3 pt-3 border-t border-neutral-300">
                  {test.error_message && (
                    <div className="mb-2">
                      <div className="text-body-xs font-medium text-neutral-700 mb-1">
                        Error:
                      </div>
                      <div className="text-body-xs text-red-700 font-mono bg-red-50 p-2 rounded">
                        {test.error_message}
                      </div>
                    </div>
                  )}
                  {test.stderr && (
                    <div className="mb-2">
                      <div className="text-body-xs font-medium text-neutral-700 mb-1">
                        Stderr:
                      </div>
                      <pre className="text-body-xs text-neutral-700 font-mono bg-neutral-50 p-2 rounded overflow-x-auto max-h-40">
                        {test.stderr}
                      </pre>
                    </div>
                  )}
                  {test.stdout && (
                    <div>
                      <div className="text-body-xs font-medium text-neutral-700 mb-1">
                        Stdout:
                      </div>
                      <pre className="text-body-xs text-neutral-700 font-mono bg-neutral-50 p-2 rounded overflow-x-auto max-h-40">
                        {test.stdout}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

