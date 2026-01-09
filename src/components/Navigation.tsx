'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from './Auth/UserMenu'

export default function Navigation() {
  const { user, loading } = useAuth()

  return (
    <nav className="bg-neutral-50 border-b border-neutral-400">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-display font-semibold text-neutral-900 hover:text-primary-400 transition-colors duration-base"
          >
            Review Buddy
          </Link>

          <div className="flex items-center gap-6">
            {loading ? (
              <div className="w-8 h-8 border-2 border-neutral-400 border-t-primary-500 rounded-full animate-spin" />
            ) : user ? (
              <>
                <Link
                  href="/submit"
                  className="text-body-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors duration-base"
                >
                  Submit Assessment
                </Link>
                <Link
                  href="/dashboard"
                  className="text-body-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors duration-base"
                >
                  Dashboard
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-body-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors duration-base"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-600 text-white py-2 px-4 rounded-lg text-body-sm font-medium hover:bg-primary-700 transition-colors duration-base"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

