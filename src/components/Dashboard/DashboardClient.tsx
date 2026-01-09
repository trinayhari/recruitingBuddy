'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { ReviewerBrief } from '@/lib/types'
import MetricsPanel from './MetricsPanel'
import MetricBar from '../MetricBar'
import EmptyState from '../EmptyState'
import CreateAssessmentForm from '../Assessment/CreateAssessmentForm'
import RedFlagBadges from './RedFlagBadges'

type SimulatorProvider = 'stackblitz' | 'codesandbox'

function parseGitHubRepo(githubUrl?: string): { owner: string; repo: string } | null {
  if (!githubUrl) return null

  try {
    const url = new URL(githubUrl)
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const owner = parts[0]
    const repo = parts[1].replace(/\.git$/, '')
    if (!owner || !repo) return null

    return { owner, repo }
  } catch {
    return null
  }
}

function getSubmissionTitle(brief: ReviewerBrief): string {
  const repo = parseGitHubRepo(brief.artifacts.githubUrl)
  if (repo) return repo.repo
  return brief.tldr.delivered || 'Submission'
}

function getSubmissionSubtitle(brief: ReviewerBrief): string | null {
  const repo = parseGitHubRepo(brief.artifacts.githubUrl)
  if (repo) return `${repo.owner}/${repo.repo}`
  return null
}

function buildStackBlitzEmbedUrl(githubUrl?: string): string | null {
  const repo = parseGitHubRepo(githubUrl)
  if (!repo) return null

  const base = `https://stackblitz.com/github/${repo.owner}/${repo.repo}`
  const params = new URLSearchParams({
    embed: '1',
    hideExplorer: '0',
    hideNavigation: '1',
    terminalHeight: '30',
    view: 'preview',
  })

  return `${base}?${params.toString()}`
}

function buildCodeSandboxEmbedUrl(githubUrl?: string): string | null {
  const repo = parseGitHubRepo(githubUrl)
  if (!repo) return null

  const base = `https://codesandbox.io/embed/github/${repo.owner}/${repo.repo}`
  const params = new URLSearchParams({
    view: 'preview',
    hidenavigation: '1',
    fontsize: '14',
    codemirror: '1',
  })

  return `${base}?${params.toString()}`
}

type ActiveTab = 'analysis' | 'simulator'
type ViewMode = 'submissions' | 'assessments'
type DashboardWidget =
  | 'summary'
  | 'hire_signal'
  | 'red_flags'
  | 'project_development'
  | 'software_design'
  | 'work_habits'

interface Assessment {
  id: string
  title?: string
  content: string
  shareable_token?: string
  created_at: string
  submissions: ReviewerBrief[]
  submissionCount: number
}

export default function DashboardClient({
  briefs,
  assessments = [],
  initialSelectedId,
}: {
  briefs: ReviewerBrief[]
  assessments?: Assessment[]
  initialSelectedId?: string | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || briefs[0]?.id || null)
  const [provider, setProvider] = useState<SimulatorProvider>('codesandbox')
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('submissions')
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [showCreateAssessment, setShowCreateAssessment] = useState(false)
  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>(assessments)
  const [expandedWidget, setExpandedWidget] = useState<DashboardWidget | null>(null)

  const selected = useMemo(
    () => briefs.find((b) => b.id === selectedId) || null,
    [briefs, selectedId]
  )

  const isLikelyNextProject = useMemo(() => {
    const stack = selected?.tldr.stack || []
    return stack.some((s) => /next/i.test(s))
  }, [selected?.tldr.stack])

  // StackBlitz can fail for some Next.js projects due to turbopack limitations in WASM environments.
  // Default to CodeSandbox for those repos.
  useEffect(() => {
    if (!selected) return
    if (isLikelyNextProject && provider === 'stackblitz') {
      setProvider('codesandbox')
    }
  }, [isLikelyNextProject, provider, selected])

  const stackBlitzUrl = useMemo(
    () => buildStackBlitzEmbedUrl(selected?.artifacts.githubUrl),
    [selected?.artifacts.githubUrl]
  )

  const codeSandboxUrl = useMemo(
    () => buildCodeSandboxEmbedUrl(selected?.artifacts.githubUrl),
    [selected?.artifacts.githubUrl]
  )

  const stackBlitzProjectUrl = useMemo(() => {
    const repo = parseGitHubRepo(selected?.artifacts.githubUrl)
    if (!repo) return null
    return `https://stackblitz.com/github/${repo.owner}/${repo.repo}`
  }, [selected?.artifacts.githubUrl])

  const codeSandboxProjectUrl = useMemo(() => {
    const repo = parseGitHubRepo(selected?.artifacts.githubUrl)
    if (!repo) return null
    return `https://codesandbox.io/s/github/${repo.owner}/${repo.repo}`
  }, [selected?.artifacts.githubUrl])

  const embedUrl = provider === 'stackblitz' ? stackBlitzUrl : codeSandboxUrl

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setActiveTab(activeTab === 'analysis' ? 'simulator' : 'analysis')
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [activeTab, isFullscreen])

  // Fullscreen overlay component
  const FullscreenSimulator = () => {
    if (!isFullscreen || !selected?.artifacts.githubUrl) return null

    const repo = parseGitHubRepo(selected.artifacts.githubUrl)

    return (
      <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-neutral-800 border-b border-neutral-700">
          <div className="flex items-center gap-4">
            <h2 className="text-h2 font-medium text-white">Simulator</h2>
            {repo && (
              <span className="text-body-sm text-neutral-400">
                {repo.owner}/{repo.repo}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Provider Toggle */}
            <div className="flex items-center gap-2 bg-neutral-700 rounded-lg p-1">
              <button
                onClick={() => setProvider('codesandbox')}
                className={`px-3 py-1.5 text-body-sm font-medium rounded transition-colors duration-base ${
                  provider === 'codesandbox'
                    ? 'bg-neutral-600 text-white'
                    : 'text-neutral-300 hover:text-white'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
              >
                CodeSandbox
              </button>
              <button
                onClick={() => setProvider('stackblitz')}
                disabled={isLikelyNextProject}
                className={`px-3 py-1.5 text-body-sm font-medium rounded transition-colors duration-base ${
                  provider === 'stackblitz'
                    ? 'bg-neutral-600 text-white'
                    : 'text-neutral-300 hover:text-white'
                } ${isLikelyNextProject ? 'opacity-50 cursor-not-allowed' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                title={isLikelyNextProject ? 'Not recommended for Next.js projects' : ''}
              >
                StackBlitz
              </button>
            </div>
            {/* External Links */}
            {codeSandboxProjectUrl && (
              <a
                href={codeSandboxProjectUrl}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm text-primary-400 hover:text-primary-300 transition-colors duration-base"
              >
                Open in CodeSandbox →
              </a>
            )}
            {stackBlitzProjectUrl && (
              <a
                href={stackBlitzProjectUrl}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm text-primary-400 hover:text-primary-300 transition-colors duration-base"
              >
                Open in StackBlitz →
              </a>
            )}
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-body-sm font-medium rounded-lg transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Exit Fullscreen (ESC)
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <iframe
            title="Repo Simulator"
            src={embedUrl || ''}
            className="w-full h-full"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        </div>
      </div>
    )
  }

  const selectedAssessment = useMemo(
    () => assessmentsList.find((a) => a.id === selectedAssessmentId) || null,
    [assessmentsList, selectedAssessmentId]
  )

  const handleAssessmentCreated = (assessment: { id: string; shareableToken: string; shareableLink: string }) => {
    // Refresh the page to get updated assessments
    window.location.reload()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <>
      <FullscreenSimulator />
      {!isFullscreen && (
        <div className="flex gap-5 h-[calc(100vh-200px)]">
          {/* Fixed Sidebar - Submissions/Assessments */}
          <aside className="w-[280px] flex-shrink-0 border-r border-neutral-200 pr-5">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 border-b border-neutral-200">
              <button
                onClick={() => {
                  setViewMode('submissions')
                  setSelectedAssessmentId(null)
                  setSelectedId(briefs[0]?.id || null)
                }}
                className={`px-3 py-2 text-body-sm font-medium transition-colors duration-base relative ${
                  viewMode === 'submissions'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2`}
              >
                Submissions
                {viewMode === 'submissions' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 -mb-px" />
                )}
              </button>
              <button
                onClick={() => {
                  setViewMode('assessments')
                  setSelectedId(null)
                  setSelectedAssessmentId(assessmentsList[0]?.id || null)
                }}
                className={`px-3 py-2 text-body-sm font-medium transition-colors duration-base relative ${
                  viewMode === 'assessments'
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2`}
              >
                Assessments
                {viewMode === 'assessments' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 -mb-px" />
                )}
              </button>
            </div>

            {viewMode === 'submissions' ? (
              <>
                {briefs.length === 0 ? (
                  <EmptyState
                    title="No submissions yet"
                    description="Analyze your first take-home assessment to get started."
                    action={{
                      label: 'Analyze Submission',
                      href: '/',
                    }}
                  />
                ) : (
                  <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
                    {briefs.map((brief) => {
                      const isActive = brief.id === selectedId
                      const subtitle = getSubmissionSubtitle(brief)
                      return (
                        <button
                          key={brief.id}
                          onClick={() => setSelectedId(brief.id)}
                          className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-base ${
                            isActive
                              ? 'bg-neutral-50 border-l-[3px] border-l-primary-600 pl-2.5'
                              : 'hover:bg-neutral-50 border-l-[3px] border-l-transparent'
                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2`}
                        >
                          <div className="text-body-lg font-medium truncate text-neutral-900">
                            {getSubmissionTitle(brief)}
                          </div>
                          {subtitle && (
                            <div className="text-body-sm text-neutral-600 truncate mt-0.5">
                              {subtitle}
                            </div>
                          )}
                          <div className="text-caption text-neutral-500 mt-1">
                            {brief.metadata.analyzedAt.toLocaleString()}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {showCreateAssessment ? (
                  <div className="mb-4">
                    <CreateAssessmentForm
                      onSuccess={handleAssessmentCreated}
                      onCancel={() => setShowCreateAssessment(false)}
                    />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowCreateAssessment(true)}
                      className="w-full mb-4 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-body-sm hover:bg-primary-700 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                    >
                      + Create Assessment
                    </button>
                    {assessmentsList.length === 0 ? (
                      <EmptyState
                        title="No assessments yet"
                        description="Create an assessment to get a shareable link for candidates."
                      />
                    ) : (
                      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-300px)]">
                        {assessmentsList.map((assessment) => {
                          const isActive = assessment.id === selectedAssessmentId
                          return (
                            <button
                              key={assessment.id}
                              onClick={() => setSelectedAssessmentId(assessment.id)}
                              className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-base ${
                                isActive
                                  ? 'bg-neutral-50 border-l-[3px] border-l-primary-600 pl-2.5'
                                  : 'hover:bg-neutral-50 border-l-[3px] border-l-transparent'
                              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2`}
                            >
                              <div className="text-body-lg font-medium truncate text-neutral-900">
                                {assessment.title || 'Untitled Assessment'}
                              </div>
                              <div className="text-body-sm text-neutral-600 mt-0.5">
                                {assessment.submissionCount} submission{assessment.submissionCount !== 1 ? 's' : ''}
                              </div>
                              <div className="text-caption text-neutral-500 mt-1">
                                {new Date(assessment.created_at).toLocaleString()}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </aside>

          {/* Main Content Area with Tabs */}
          <main className="flex-1 min-w-0 flex flex-col">
            {/* Tab Bar */}
            {selected && (
              <div className="flex items-center gap-1 mb-4 border-b border-neutral-200">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`px-4 py-2 text-body font-medium transition-colors duration-base relative ${
                    activeTab === 'analysis'
                      ? 'text-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-t`}
                >
                  Analysis
                  {activeTab === 'analysis' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 -mb-px" />
                  )}
                </button>
                {selected.artifacts.githubUrl && (
                  <button
                    onClick={() => setActiveTab('simulator')}
                    className={`px-4 py-2 text-body font-medium transition-colors duration-base relative ${
                      activeTab === 'simulator'
                        ? 'text-primary-600'
                        : 'text-neutral-600 hover:text-neutral-900'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-t`}
                  >
                    Try It Out
                    {activeTab === 'simulator' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 -mb-px" />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-5">
              {viewMode === 'assessments' ? (
                selectedAssessment ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-h1 font-semibold mb-4 text-neutral-900">
                        {selectedAssessment.title || 'Assessment'}
                      </h2>
                      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
                        <h3 className="text-body-sm font-medium text-neutral-900 mb-2">Requirements</h3>
                        <div className="text-body text-neutral-700 whitespace-pre-wrap">
                          {selectedAssessment.content}
                        </div>
                      </div>
                      {selectedAssessment.shareable_token && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                          <h3 className="text-body-sm font-medium text-primary-900 mb-2">Shareable Link</h3>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/assessment/${selectedAssessment.shareable_token}`}
                              className="flex-1 px-3 py-2 border border-neutral-900 rounded-lg bg-neutral-50 text-body text-neutral-900"
                            />
                            <button
                              onClick={() => {
                                const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/assessment/${selectedAssessment.shareable_token}`
                                copyToClipboard(link)
                              }}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-body-sm hover:bg-primary-700 transition-colors duration-base"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <h3 className="text-h2 font-medium mb-4 text-neutral-900">
                          Submissions ({selectedAssessment.submissionCount})
                        </h3>
                        {selectedAssessment.submissions.length === 0 ? (
                          <div className="text-body text-neutral-600 py-8 text-center">
                            No submissions yet. Share the link above with candidates.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedAssessment.submissions.map((brief) => {
                              const subtitle = getSubmissionSubtitle(brief)
                              return (
                                <div
                                  key={brief.id}
                                  className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors duration-base cursor-pointer"
                                  onClick={() => {
                                    setViewMode('submissions')
                                    setSelectedId(brief.id)
                                  }}
                                >
                                  <div className="text-body-lg font-medium text-neutral-900">
                                    {getSubmissionTitle(brief)}
                                  </div>
                                  {subtitle && (
                                    <div className="text-body-sm text-neutral-600 mt-1">
                                      {subtitle}
                                    </div>
                                  )}
                                  {brief.metrics && (
                                    <div className="mt-3">
                                      <MetricBar value={brief.metrics.overallHireSignal} label="" size="small" />
                                    </div>
                                  )}
                                  <div className="text-caption text-neutral-500 mt-2">
                                    {brief.metadata.analyzedAt.toLocaleString()}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-body text-neutral-600 py-12">
                    Select an assessment to view details.
                  </div>
                )
              ) : !selected ? (
                <div className="text-body text-neutral-600 py-12">
                  Select a submission to view details.
                </div>
              ) : activeTab === 'analysis' ? (
                <div className="transition-opacity duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {expandedWidget === 'summary' ? (
                      <div className="md:col-span-2 xl:col-span-3 bg-neutral-50 border border-neutral-900 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-h2 font-medium text-neutral-900">Summary</h3>
                          <button
                            type="button"
                            onClick={() => setExpandedWidget(null)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-900 bg-neutral-50 text-neutral-900 text-body-sm font-medium hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                          >
                            Collapse
                          </button>
                        </div>
                        <dl className="space-y-5">
                          {selected.tldr.task && (
                            <div>
                              <dt className="text-body-sm font-medium text-neutral-600 mb-1">Task</dt>
                              <dd className="text-body text-neutral-900">{selected.tldr.task}</dd>
                            </div>
                          )}
                          {selected.tldr.delivered && (
                            <div>
                              <dt className="text-body-sm font-medium text-neutral-600 mb-1">Delivered</dt>
                              <dd className="text-body text-neutral-900">{selected.tldr.delivered}</dd>
                            </div>
                          )}
                          {selected.tldr.stack && selected.tldr.stack.length > 0 && (
                            <div>
                              <dt className="text-body-sm font-medium text-neutral-600 mb-1">Stack</dt>
                              <dd className="text-body text-neutral-900">{selected.tldr.stack.join(', ')}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedWidget('summary')}
                        className="text-left bg-neutral-50 border border-neutral-900 rounded-lg p-6 hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-h2 font-medium text-neutral-900">Summary</h3>
                          <span className="text-caption text-neutral-600">Expand</span>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="text-body-sm text-neutral-600">Task</div>
                          <div className="text-body text-neutral-900 line-clamp-3">{selected.tldr.task || '—'}</div>
                        </div>
                      </button>
                    )}

                    {expandedWidget === 'hire_signal' ? (
                      <div className="md:col-span-2 xl:col-span-3 bg-neutral-50 border border-neutral-900 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-h2 font-medium text-neutral-900">Hire Signal</h3>
                          <button
                            type="button"
                            onClick={() => setExpandedWidget(null)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-900 bg-neutral-50 text-neutral-900 text-body-sm font-medium hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                          >
                            Collapse
                          </button>
                        </div>
                        {selected.metrics ? (
                          <div>
                            <MetricBar value={selected.metrics.overallHireSignal} label="" size="large" />
                            {selected.metrics.redFlags.length > 0 && (
                              <p className="text-body-sm text-signal-low mt-3">
                                {selected.metrics.redFlags.length} red flag{selected.metrics.redFlags.length !== 1 ? 's' : ''} detected
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-body text-neutral-600">Metrics not available for this submission.</div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedWidget('hire_signal')}
                        className="text-left bg-neutral-50 border border-neutral-900 rounded-lg p-6 hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-h2 font-medium text-neutral-900">Hire Signal</h3>
                          <span className="text-caption text-neutral-600">Expand</span>
                        </div>
                        <div className="mt-4">
                          {selected.metrics ? (
                            <MetricBar value={selected.metrics.overallHireSignal} label="" size="medium" />
                          ) : (
                            <div className="text-body text-neutral-600">—</div>
                          )}
                        </div>
                      </button>
                    )}

                    {/* Links (non-expandable) */}
                    <div className="text-left bg-neutral-50 border border-neutral-900 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-h2 font-medium text-neutral-900">Links</h3>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="text-body-sm font-medium text-neutral-600 mb-1">Reviewer Brief</div>
                          <Link
                            href={`/review/${selected.id}`}
                            className="text-body text-primary-600 hover:text-primary-700 font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
                          >
                            Open full Reviewer Brief →
                          </Link>
                        </div>
                        {selected.artifacts.githubUrl && (
                          <div>
                            <div className="text-body-sm font-medium text-neutral-600 mb-1">GitHub</div>
                            <a
                              href={selected.artifacts.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-body text-primary-600 hover:text-primary-700 break-all transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
                            >
                              {selected.artifacts.githubUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Red Flags */}
                    {expandedWidget === 'red_flags' ? (
                      <div className="md:col-span-2 xl:col-span-3 bg-neutral-50 border border-neutral-900 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-h2 font-medium text-neutral-900">Red Flags</h3>
                          <button
                            type="button"
                            onClick={() => setExpandedWidget(null)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-900 bg-neutral-50 text-neutral-900 text-body-sm font-medium hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                          >
                            Collapse
                          </button>
                        </div>
                        {selected.metrics ? (
                          selected.metrics.redFlags.length > 0 ? (
                            <RedFlagBadges redFlags={selected.metrics.redFlags} />
                          ) : (
                            <div className="text-body text-neutral-600">No red flags detected.</div>
                          )
                        ) : (
                          <div className="text-body text-neutral-600">Metrics not available for this submission.</div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedWidget('red_flags')}
                        className="text-left bg-neutral-50 border border-neutral-900 rounded-lg p-6 hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-h2 font-medium text-neutral-900">Red Flags</h3>
                          <span className="text-caption text-neutral-600">Expand</span>
                        </div>
                        <div className="mt-4 text-body text-neutral-600">
                          {selected.metrics
                            ? `${selected.metrics.redFlags.length} red flag${selected.metrics.redFlags.length !== 1 ? 's' : ''}`
                            : 'Not available'}
                        </div>
                      </button>
                    )}

                    {/* Project Development */}
                    {expandedWidget === 'project_development' ? (
                      <div className="md:col-span-2 xl:col-span-3 bg-neutral-50 border border-neutral-900 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-h2 font-medium text-neutral-900">Project Development</h3>
                          <button
                            type="button"
                            onClick={() => setExpandedWidget(null)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-900 bg-neutral-50 text-neutral-900 text-body-sm font-medium hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                          >
                            Collapse
                          </button>
                        </div>
                        {selected.metrics ? (
                          <div className="space-y-6">
                            <MetricBar value={selected.metrics.codeOrganizationScore} label="Code Organization" size="medium" />
                            <MetricBar
                              value={
                                selected.metrics.testPresence.hasTests
                                  ? Math.min(100, selected.metrics.testPresence.testRatio * 200)
                                  : 0
                              }
                              label="Test Coverage"
                              size="medium"
                            />
                            <div className="text-body-sm text-neutral-600">
                              {selected.metrics.testPresence.testFileCount} test file
                              {selected.metrics.testPresence.testFileCount !== 1 ? 's' : ''}
                            </div>
                            <MetricBar value={selected.metrics.documentationScore} label="Documentation" size="medium" />
                            <MetricBar value={selected.metrics.dependencyHealth} label="Dependency Health" size="medium" />
                          </div>
                        ) : (
                          <div className="text-body text-neutral-600">Metrics not available for this submission.</div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedWidget('project_development')}
                        className="text-left bg-neutral-50 border border-neutral-900 rounded-lg p-6 hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-h2 font-medium text-neutral-900">Project Development</h3>
                          <span className="text-caption text-neutral-600">Expand</span>
                        </div>
                        <div className="mt-4">
                          {selected.metrics ? (
                            <MetricBar value={selected.metrics.codeOrganizationScore} label="" size="small" />
                          ) : (
                            <div className="text-body text-neutral-600">Not available</div>
                          )}
                        </div>
                      </button>
                    )}

                    {/* Software Design */}
                    {expandedWidget === 'software_design' ? (
                      <div className="md:col-span-2 xl:col-span-3 bg-neutral-50 border border-neutral-900 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-h2 font-medium text-neutral-900">Software Design</h3>
                          <button
                            type="button"
                            onClick={() => setExpandedWidget(null)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-900 bg-neutral-50 text-neutral-900 text-body-sm font-medium hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                          >
                            Collapse
                          </button>
                        </div>
                        {selected.metrics ? (
                          <div className="space-y-6">
                            <MetricBar value={selected.metrics.typeSafetyRatio} label="Type Safety" size="medium" />
                            <div className="text-body-sm text-neutral-600">{selected.metrics.typeSafetyRatio}% TypeScript</div>
                            <MetricBar value={selected.metrics.modularityIndex} label="Modularity" size="medium" />
                            <MetricBar value={selected.metrics.entryPointClarity} label="Entry Points" size="medium" />
                            <MetricBar value={selected.metrics.apiStructureScore} label="API Structure" size="medium" />
                          </div>
                        ) : (
                          <div className="text-body text-neutral-600">Metrics not available for this submission.</div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedWidget('software_design')}
                        className="text-left bg-neutral-50 border border-neutral-900 rounded-lg p-6 hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-h2 font-medium text-neutral-900">Software Design</h3>
                          <span className="text-caption text-neutral-600">Expand</span>
                        </div>
                        <div className="mt-4">
                          {selected.metrics ? (
                            <MetricBar value={selected.metrics.modularityIndex} label="" size="small" />
                          ) : (
                            <div className="text-body text-neutral-600">Not available</div>
                          )}
                        </div>
                      </button>
                    )}

                    {/* Work Habits */}
                    {expandedWidget === 'work_habits' ? (
                      <div className="md:col-span-2 xl:col-span-3 bg-neutral-50 border border-neutral-900 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-h2 font-medium text-neutral-900">Work Habits</h3>
                          <button
                            type="button"
                            onClick={() => setExpandedWidget(null)}
                            className="px-3 py-1.5 rounded-lg border border-neutral-900 bg-neutral-50 text-neutral-900 text-body-sm font-medium hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                          >
                            Collapse
                          </button>
                        </div>
                        {selected.metrics ? (
                          <div className="space-y-6">
                            <MetricBar value={selected.metrics.commitQualityScore} label="Commit Quality" size="medium" />
                            <MetricBar value={selected.metrics.developmentPatternScore} label="Development Pattern" size="medium" />
                            <MetricBar value={selected.metrics.timeInvestment.score} label="Time Investment" size="medium" />
                            <div className="text-body-sm text-neutral-600">
                              {selected.metrics.timeInvestment.hours.toFixed(1)} hours
                            </div>
                            <MetricBar value={selected.metrics.iterationScore} label="Iteration" size="medium" />
                          </div>
                        ) : (
                          <div className="text-body text-neutral-600">Metrics not available for this submission.</div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedWidget('work_habits')}
                        className="text-left bg-neutral-50 border border-neutral-900 rounded-lg p-6 hover:bg-neutral-100 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-h2 font-medium text-neutral-900">Work Habits</h3>
                          <span className="text-caption text-neutral-600">Expand</span>
                        </div>
                        <div className="mt-4">
                          {selected.metrics ? (
                            <MetricBar value={selected.metrics.commitQualityScore} label="" size="small" />
                          ) : (
                            <div className="text-body text-neutral-600">Not available</div>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Simulator Tab Content */
                !selected.artifacts.githubUrl ? (
                  <div className="text-body text-neutral-600 py-12 transition-opacity duration-200">
                    No GitHub URL was provided for this submission. (Zip uploads can't be simulated.)
                  </div>
                ) : !codeSandboxUrl && !stackBlitzUrl ? (
                  <div className="text-body text-neutral-600 py-12 transition-opacity duration-200">
                    Could not parse GitHub URL for sandbox preview.
                  </div>
                ) : (
                  <div className="space-y-4 transition-opacity duration-200">
                    <div className="flex items-center justify-between">
                      <div className="text-caption text-neutral-500">
                        Embedded preview: {parseGitHubRepo(selected.artifacts.githubUrl)?.owner}/
                        {parseGitHubRepo(selected.artifacts.githubUrl)?.repo}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Provider Toggle */}
                        <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                          <button
                            onClick={() => setProvider('codesandbox')}
                            className={`px-3 py-1.5 text-body-sm font-medium rounded transition-colors duration-base ${
                              provider === 'codesandbox'
                                ? 'bg-neutral-50 text-neutral-900 border border-neutral-900'
                                : 'text-neutral-600 hover:text-neutral-900'
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2`}
                          >
                            CodeSandbox
                          </button>
                          <button
                            onClick={() => setProvider('stackblitz')}
                            disabled={isLikelyNextProject}
                            className={`px-3 py-1.5 text-body-sm font-medium rounded transition-colors duration-base ${
                              provider === 'stackblitz'
                                ? 'bg-neutral-50 text-neutral-900 border border-neutral-900'
                                : 'text-neutral-600 hover:text-neutral-900'
                            } ${isLikelyNextProject ? 'opacity-50 cursor-not-allowed' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2`}
                            title={isLikelyNextProject ? 'Not recommended for Next.js projects' : ''}
                          >
                            StackBlitz
                          </button>
                        </div>
                        {/* Fullscreen Button */}
                        <button
                          onClick={() => setIsFullscreen(true)}
                          className="px-3 py-1.5 text-body-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
                        >
                          Fullscreen
                        </button>
                      </div>
                    </div>

                    {isLikelyNextProject && provider === 'stackblitz' && (
                      <div className="text-body-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Note: Auto-switched to CodeSandbox for better Next.js compatibility.
                      </div>
                    )}

                    {/* External Links */}
                    <div className="flex items-center gap-4">
                      {codeSandboxProjectUrl && (
                        <a
                          href={codeSandboxProjectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-body-sm text-primary-600 hover:text-primary-700 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
                        >
                          Open in CodeSandbox →
                        </a>
                      )}
                      {stackBlitzProjectUrl && (
                        <a
                          href={stackBlitzProjectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-body-sm text-primary-600 hover:text-primary-700 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
                        >
                          Open in StackBlitz →
                        </a>
                      )}
                    </div>

                    <div className="w-full rounded-lg overflow-hidden border border-neutral-200 h-[70vh] min-h-[520px]">
                      <iframe
                        title="Repo Simulator"
                        src={embedUrl || ''}
                        className="w-full h-full"
                        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                      />
                    </div>

                    <div className="text-caption text-neutral-500">
                      If the embed looks stuck on "cloning", open it in a new tab (links above) to see the full error.
                      Common causes are private repos, large installs, or required secrets.
                    </div>
                  </div>
                )
              )}
            </div>
          </main>
        </div>
      )}
    </>
  )
}
