'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function InputForm() {
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

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3058166-5108-41d7-bfb2-ff2dbc671822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InputForm.tsx:58',message:'Received response, navigating',data:{returnedId:data.id,responseStatus:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      router.push(`/review/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Take-Home Review Buddy</h1>
        <p className="text-gray-600 mb-6">
          Submit a take-home assessment to generate a Reviewer Brief that helps you understand submissions in under 7 minutes.
        </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GitHub URL */}
        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium mb-2">
            GitHub Repository URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="githubUrl"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting || !!zipFile}
          />
          <p className="text-xs text-gray-500 mt-1">
            {zipFile ? 'Zip file provided, GitHub URL disabled' : 'Or upload a zip file below'}
          </p>
        </div>

        {/* Zip File Upload */}
        <div>
          <label htmlFor="zipFile" className="block text-sm font-medium mb-2">
            Or Upload Zip File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="zipFile"
            accept=".zip"
            onChange={(e) => setZipFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting || !!githubUrl}
          />
          <p className="text-xs text-gray-500 mt-1">
            {githubUrl ? 'GitHub URL provided, zip upload disabled' : 'Upload a zip file containing the code'}
          </p>
        </div>

        {/* Optional Fields */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Optional Information</h2>

          {/* Video Link */}
          <div className="mb-4">
            <label htmlFor="videoLink" className="block text-sm font-medium mb-2">
              Demo Video Link (Loom, YouTube, etc.)
            </label>
            <input
              type="url"
              id="videoLink"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://loom.com/share/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Chat Export */}
          <div className="mb-4">
            <label htmlFor="chatExport" className="block text-sm font-medium mb-2">
              AI Chat Export (Cursor/Claude conversation)
            </label>
            <textarea
              id="chatExport"
              value={chatExport}
              onChange={(e) => setChatExport(e.target.value)}
              placeholder="Paste the chat export text here..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Reflections */}
          <div className="mb-4">
            <label htmlFor="reflections" className="block text-sm font-medium mb-2">
              Candidate Reflections
            </label>
            <textarea
              id="reflections"
              value={reflections}
              onChange={(e) => setReflections(e.target.value)}
              placeholder="Any reflections or notes from the candidate..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing submission...
            </>
          ) : (
            'Analyze Submission'
          )}
        </button>
      </form>
      </div>
    </div>
  )
}

