'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/auth/client'
import InlineAlert from '../InlineAlert'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      const redirect = searchParams.get('redirect') || '/submit'
      router.push(redirect)
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
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-body-sm text-neutral-600">
        Don't have an account?{' '}
        <a href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign up
        </a>
      </p>
    </form>
  )
}

