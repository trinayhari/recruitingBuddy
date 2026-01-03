'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { ReviewerBrief } from '@/lib/types'

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

export default function DashboardClient({
  briefs,
  initialSelectedId,
}: {
  briefs: ReviewerBrief[]
  initialSelectedId?: string | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || briefs[0]?.id || null)
  const [provider, setProvider] = useState<SimulatorProvider>('codesandbox')

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="bg-white rounded-lg shadow-lg p-4 lg:col-span-3">
        <h2 className="text-xl font-semibold mb-3">Submissions</h2>

        {briefs.length === 0 ? (
          <div className="text-gray-600 text-sm">No briefs yet. Analyze a submission first.</div>
        ) : (
          <div className="space-y-2">
            {briefs.map((brief) => {
              const isActive = brief.id === selectedId
              const subtitle = getSubmissionSubtitle(brief)
              return (
                <button
                  key={brief.id}
                  onClick={() => setSelectedId(brief.id)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{getSubmissionTitle(brief)}</div>
                  {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
                  <div className="text-xs text-gray-500 mt-1">
                    {brief.metadata.analyzedAt.toLocaleString()}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg shadow-lg p-4 lg:col-span-3">
        <h2 className="text-xl font-semibold mb-3">Analysis</h2>

        {!selected ? (
          <div className="text-gray-600 text-sm">Select a submission to view details.</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500">TL;DR</div>
              <div className="mt-1">{selected.tldr.task || '—'}</div>
            </div>

            <div>
              <div className="text-gray-500">Stack</div>
              <div className="mt-1">{selected.tldr.stack?.join(', ') || '—'}</div>
            </div>

            <div>
              <div className="text-gray-500">Review</div>
              <div className="mt-1">
                <Link
                  href={`/review/${selected.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Open full Reviewer Brief
                </Link>
              </div>
            </div>

            <div>
              <div className="text-gray-500">GitHub</div>
              <div className="mt-1">
                {selected.artifacts.githubUrl ? (
                  <a
                    href={selected.artifacts.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {selected.artifacts.githubUrl}
                  </a>
                ) : (
                  '—'
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Simulator runs in a browser sandbox (StackBlitz). Some projects may not fully run if they depend on
              private env keys or non-browser backends.
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg shadow-lg p-4 lg:col-span-6">
        <h2 className="text-xl font-semibold mb-3">Simulator</h2>

        {!selected ? (
          <div className="text-gray-600 text-sm">Select a submission to simulate.</div>
        ) : !selected.artifacts.githubUrl ? (
          <div className="text-gray-600 text-sm">
            No GitHub URL was provided for this submission. (Zip uploads can’t be simulated via StackBlitz.)
          </div>
        ) : !stackBlitzUrl && !codeSandboxUrl ? (
          <div className="text-gray-600 text-sm">Could not parse GitHub URL for sandbox preview.</div>
        ) : (
          <div className="w-full">
            <div className="mb-2 text-xs text-gray-500">
              Embedded preview: {parseGitHubRepo(selected.artifacts.githubUrl)?.owner}/
              {parseGitHubRepo(selected.artifacts.githubUrl)?.repo}
            </div>

            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProvider('stackblitz')}
                className={`text-sm px-3 py-1 rounded border ${
                  provider === 'stackblitz'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                disabled={!stackBlitzUrl || isLikelyNextProject}
              >
                StackBlitz
              </button>
              <button
                type="button"
                onClick={() => setProvider('codesandbox')}
                className={`text-sm px-3 py-1 rounded border ${
                  provider === 'codesandbox'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                disabled={!codeSandboxUrl}
              >
                CodeSandbox
              </button>
            </div>

            {isLikelyNextProject && (
              <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                StackBlitz may fail for some Next.js repos due to Turbo/WASM limitations. Defaulting to CodeSandbox.
              </div>
            )}

            {stackBlitzProjectUrl && (
              <div className="mb-2">
                <a
                  href={stackBlitzProjectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Open in StackBlitz
                </a>
              </div>
            )}

            {codeSandboxProjectUrl && (
              <div className="mb-3">
                <a
                  href={codeSandboxProjectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Open in CodeSandbox
                </a>
              </div>
            )}

            <div className="w-full rounded-md overflow-hidden border border-gray-200 h-[70vh] min-h-[520px]">
              <iframe
                title="Repo Simulator"
                src={embedUrl || ''}
                className="w-full h-full"
                allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            </div>

            <div className="mt-3 text-xs text-gray-500">
              If the embed looks stuck on “cloning”, open it in a new tab (links above) to see the full error.
              Common causes are private repos, large installs, or required secrets.
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
