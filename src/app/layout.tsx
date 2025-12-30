import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Take-Home Review Buddy',
  description: 'AI-powered take-home assessment review tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

