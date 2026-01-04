'use client'

import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  illustration?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  const content = (
    <div className="text-center py-12 px-6">
      {illustration && <div className="mb-6 flex justify-center">{illustration}</div>}
      <h3 className="text-h1 font-medium text-neutral-900 mb-2">{title}</h3>
      <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <div>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )

  return <div className="w-full">{content}</div>
}

