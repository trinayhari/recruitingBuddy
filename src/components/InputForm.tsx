'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import CollapsibleSection from './CollapsibleSection'
import InlineAlert from './InlineAlert'

export default function InputForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [githubUrl, setGithubUrl] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [videoLink, setVideoLink] = useState('')
  const [chatExport, setChatExport] = useState('')
  const [reflections, setReflections] = useState('')
  const [projectPrompt, setProjectPrompt] = useState('')
  const [autoGenerateTests, setAutoGenerateTests] = useState(false)

  const validateGithubUrl = (url: string): boolean => {
    if (!url) return false
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+/
    return githubRegex.test(url)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validate that at least GitHub URL or zip file is provided
    if (!githubUrl && !zipFile) {
      setError('Please provide either a GitHub URL or upload a zip file')
      return
    }

    if (githubUrl && !validateGithubUrl(githubUrl)) {
      setError('Please enter a valid GitHub repository URL')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      if (githubUrl) formData.append('githubUrl', githubUrl)
      if (zipFile) formData.append('zipFile', zipFile)
      if (videoLink) formData.append('videoLink', videoLink)
      if (chatExport) formData.append('chatExport', chatExport)
      if (reflections) formData.append('reflections', reflections)
      if (projectPrompt) formData.append('projectPrompt', projectPrompt)
      if (autoGenerateTests) formData.append('autoGenerateTests', 'true')

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Try to parse JSON error, but handle HTML error pages
        let errorMessage = 'Analysis failed'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            const text = await response.text()
            errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`
          }
        } catch (parseError) {
          errorMessage = `Server error (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3058166-5108-41d7-bfb2-ff2dbc671822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputForm.tsx:58',message:'Received response, navigating',data:{returnedId:data.id,responseStatus:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      router.push(`/dashboard?selected=${encodeURIComponent(data.id)}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="bg-neutral-100 border border-neutral-400 rounded-lg shadow-sm p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display font-semibold mb-2 text-neutral-900">Take-Home Review Buddy</h1>
            <p className="text-body-lg text-neutral-600">
              Submit a take-home assessment to generate a Reviewer Brief that helps you understand submissions in under 7 minutes.
            </p>
          </div>

          <a 
            href="/dashboard" 
            className="text-body-sm text-primary-600 hover:text-primary-700 whitespace-nowrap font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded"
          >
            Dashboard
          </a>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GitHub URL */}
        <div>
          <label htmlFor="githubUrl" className="block text-body-sm font-medium mb-2 text-neutral-900">
            GitHub Repository URL <span className="text-neutral-500 font-normal">(required)</span>
          </label>
          <input
            type="url"
            id="githubUrl"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full px-3.5 py-2.5 border border-neutral-400 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed"
            disabled={isSubmitting || !!zipFile}
          />
          <p className="text-caption text-neutral-500 mt-1.5">
            {zipFile ? 'Zip file provided, GitHub URL disabled' : 'Or upload a zip file below'}
          </p>
        </div>

        {/* Zip File Upload */}
        <div>
          <label htmlFor="zipFile" className="block text-body-sm font-medium mb-2 text-neutral-900">
            Or Upload Zip File <span className="text-neutral-500 font-normal">(required)</span>
          </label>
          <input
            type="file"
            id="zipFile"
            accept=".zip"
            onChange={(e) => setZipFile(e.target.files?.[0] || null)}
            className="w-full px-3.5 py-2.5 border border-neutral-400 rounded-lg bg-neutral-50 text-body text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-body-sm file:font-medium file:bg-neutral-200 file:text-neutral-900 hover:file:bg-neutral-300"
            disabled={isSubmitting || !!githubUrl}
          />
          <p className="text-caption text-neutral-500 mt-1.5">
            {githubUrl ? 'GitHub URL provided, zip upload disabled' : 'Upload a zip file containing the code'}
          </p>
        </div>

        {/* Project Prompt */}
        <div>
          <label htmlFor="projectPrompt" className="block text-body-sm font-medium mb-2 text-neutral-900">
            Project Prompt <span className="text-neutral-500 font-normal">(optional)</span>
          </label>
          <textarea
            id="projectPrompt"
            value={projectPrompt}
            onChange={(e) => setProjectPrompt(e.target.value)}
            placeholder="Paste the project requirements/prompt here to enable automated test generation..."
            rows={6}
            className="w-full px-3.5 py-2.5 border border-neutral-400 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed resize-y"
            disabled={isSubmitting}
          />
          <p className="text-caption text-neutral-500 mt-1.5">
            If provided, the system will extract requirements and generate tests automatically
          </p>
          {projectPrompt && (
            <div className="mt-2">
              <label className="flex items-center gap-2 text-body-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={autoGenerateTests}
                  onChange={(e) => setAutoGenerateTests(e.target.checked)}
                  className="rounded border-neutral-400 bg-neutral-50 text-primary-600 focus:ring-primary-600"
                  disabled={isSubmitting}
                />
                <span>Auto-generate tests after analysis</span>
              </label>
            </div>
          )}
        </div>

        {/* Optional Fields - Collapsed by default */}
        <CollapsibleSection title="Optional Information" defaultOpen={false}>
          {/* Video Link */}
          <div className="mb-4">
            <label htmlFor="videoLink" className="block text-body-sm font-medium mb-2 text-neutral-900">
              Demo Video Link (Loom, YouTube, etc.)
            </label>
            <input
              type="url"
              id="videoLink"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://loom.com/share/..."
              className="w-full px-3.5 py-2.5 border border-neutral-400 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            />
          </div>

          {/* Chat Export */}
          <div className="mb-4">
            <label htmlFor="chatExport" className="block text-body-sm font-medium mb-2 text-neutral-900">
              AI Chat Export (Cursor/Claude conversation)
            </label>
            <textarea
              id="chatExport"
              value={chatExport}
              onChange={(e) => setChatExport(e.target.value)}
              placeholder="Paste the chat export text here..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-neutral-400 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed resize-y"
              disabled={isSubmitting}
            />
          </div>

          {/* Reflections */}
          <div>
            <label htmlFor="reflections" className="block text-body-sm font-medium mb-2 text-neutral-900">
              Candidate Reflections
            </label>
            <textarea
              id="reflections"
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              placeholder="Any reflections or notes from the candidate..."
              rows={4}
              className="w-full px-3.5 py-2.5 border border-neutral-400 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed resize-y"
              disabled={isSubmitting}
            />
          </div>
        </CollapsibleSection>

        {/* Error Message */}
        {error && (
          <InlineAlert variant="error">
            <p className="text-body-sm">{error}</p>
          </InlineAlert>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium text-body-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all duration-base shadow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 flex items-center justify-center"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1">
              Analyzing
              <span className="loading-dot">•</span>
              <span className="loading-dot">•</span>
              <span className="loading-dot">•</span>
            </span>
          ) : (
            'Analyze Submission'
          )}
        </button>
      </form>
      </div>
    </div>
  )
}

