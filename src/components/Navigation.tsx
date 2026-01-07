'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from './Auth/UserMenu'

export default function Navigation() {
  const { user, loading } = useAuth()

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-display font-semibold text-neutral-900 hover:text-primary-600 transition-colors duration-base"
          >
            Review Buddy
          </Link>

          <div className="flex items-center gap-6">
            {loading ? (
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
            ) : user ? (
              <>
                <Link
                  href="/submit"
                  className="text-body-sm text-neutral-700 hover:text-primary-600 font-medium transition-colors duration-base"
                >
                  Submit Assessment
                </Link>
                <Link
                  href="/dashboard"
                  className="text-body-sm text-neutral-700 hover:text-primary-600 font-medium transition-colors duration-base"
                >
                  Dashboard
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-body-sm text-neutral-700 hover:text-primary-600 font-medium transition-colors duration-base"
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

