'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import CollapsibleSection from '../CollapsibleSection'
import InlineAlert from '../InlineAlert'

interface Assessment {
  id: string
  content: string
  title?: string
}

export default function AssessmentSubmissionForm({
  assessment,
  token,
}: {
  assessment: Assessment
  token: string
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [githubUrl, setGithubUrl] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [videoLink, setVideoLink] = useState('')
  const [chatExport, setChatExport] = useState('')
  const [reflections, setReflections] = useState('')

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
      formData.append('assessmentToken', token)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Try to parse JSON error, but handle HTML error pages
        let errorMessage = 'Submission failed'
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
      router.push(`/dashboard?selected=${encodeURIComponent(data.id)}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6">
      <div className="bg-neutral-50 border border-neutral-900 rounded-lg shadow-sm p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-display font-semibold mb-2 text-neutral-900">
            {assessment.title || 'Assessment Submission'}
          </h1>
          <div className="prose prose-sm max-w-none mt-4">
            <div className="bg-neutral-50 border border-neutral-900 rounded-lg p-4">
              <h3 className="text-body-sm font-medium text-neutral-900 mb-2">Assessment Requirements</h3>
              <div className="text-body text-neutral-700 whitespace-pre-wrap">
                {assessment.content}
              </div>
            </div>
          </div>
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
              className="w-full px-3.5 py-2.5 border border-neutral-900 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed"
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
              className="w-full px-3.5 py-2.5 border border-neutral-900 rounded-lg bg-neutral-50 text-body text-neutral-900 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-body-sm file:font-medium file:bg-neutral-200 file:text-neutral-900 hover:file:bg-neutral-300"
              disabled={isSubmitting || !!githubUrl}
            />
            <p className="text-caption text-neutral-500 mt-1.5">
              {githubUrl ? 'GitHub URL provided, zip upload disabled' : 'Upload a zip file containing the code'}
            </p>
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
                className="w-full px-3.5 py-2.5 border border-neutral-900 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed"
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
                className="w-full px-3.5 py-2.5 border border-neutral-900 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed resize-y"
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
                className="w-full px-3.5 py-2.5 border border-neutral-900 rounded-lg bg-neutral-50 text-body text-neutral-900 placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base disabled:bg-neutral-200 disabled:text-neutral-600 disabled:cursor-not-allowed resize-y"
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
                Submitting
                <span className="loading-dot">•</span>
                <span className="loading-dot">•</span>
                <span className="loading-dot">•</span>
              </span>
            ) : (
              'Submit Assessment'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

