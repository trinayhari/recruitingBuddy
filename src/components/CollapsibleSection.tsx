'use client'

import { useState, useRef, useEffect } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current && innerRef.current) {
      if (isOpen) {
        contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`
      } else {
        contentRef.current.style.maxHeight = '0'
      }
    }
  }, [isOpen])

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-md"
        aria-expanded={isOpen}
      >
        <span className="text-h2 font-medium text-neutral-900">{title}</span>
        <svg
          className={`w-5 h-5 text-neutral-600 transition-transform duration-base ease-smooth ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-slow ease-smooth"
        style={{ maxHeight: isOpen ? '1000px' : '0' }}
      >
        <div ref={innerRef} className={`pt-2 pb-4 transition-opacity duration-slow ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}

