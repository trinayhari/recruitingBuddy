'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/auth/client'
import InlineAlert from '../InlineAlert'

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      router.push('/submit')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-body-sm font-medium mb-2 text-neutral-900">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg bg-white text-body focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-body-sm font-medium mb-2 text-neutral-900">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg bg-white text-body focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base"
          disabled={isLoading}
        />
        <p className="text-caption text-neutral-500 mt-1.5">
          Must be at least 8 characters
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-body-sm font-medium mb-2 text-neutral-900">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg bg-white text-body focus:border-primary-600 focus:outline-none focus:ring-3 focus:ring-primary-600/12 transition-all duration-base"
          disabled={isLoading}
        />
      </div>

      {error && (
        <InlineAlert variant="error">
          <p className="text-body-sm">{error}</p>
        </InlineAlert>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium text-body-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all duration-base shadow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-body-sm text-neutral-600">
        Already have an account?{' '}
        <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </a>
      </p>
    </form>
  )
}

