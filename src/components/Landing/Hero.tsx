import Link from 'next/link'

export default function Hero() {
  return (
    <div className="text-center py-16 lg:py-24">
      <h1 className="text-4xl lg:text-5xl font-semibold text-neutral-900 mb-6">
        Streamline Your Technical Assessment Reviews
      </h1>
      <p className="text-xl lg:text-2xl text-neutral-600 mb-8 max-w-2xl mx-auto">
        Generate comprehensive reviewer briefs in under 7 minutes. Understand submissions faster with AI-powered analysis.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/signup"
          className="bg-primary-600 text-white py-3 px-8 rounded-lg font-medium text-body-lg hover:bg-primary-700 transition-all duration-base shadow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          Get Started Free
        </Link>
        <Link
          href="/login"
          className="bg-white text-primary-600 border-2 border-primary-600 py-3 px-8 rounded-lg font-medium text-body-lg hover:bg-primary-50 transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}

