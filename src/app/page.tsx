import Hero from '@/components/Landing/Hero'
import Features from '@/components/Landing/Features'
import CTASection from '@/components/Landing/CTASection'

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <Hero />
        <Features />
        <CTASection />
      </div>
    </main>
  )
}

