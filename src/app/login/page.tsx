import Link from 'next/link'
import { Suspense } from 'react'
import LoginForm from '@/components/Auth/LoginForm'

function LoginFormWrapper() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-display font-semibold text-neutral-900 mb-2">Sign In</h1>
            <p className="text-body-lg text-neutral-600">
              Sign in to your account to manage assessments
            </p>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <LoginFormWrapper />
          </Suspense>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-body-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

