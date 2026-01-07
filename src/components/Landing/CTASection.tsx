import Link from 'next/link'

export default function CTASection() {
  return (
    <div className="py-16 lg:py-24">
      <div className="bg-primary-600 rounded-lg p-12 text-center">
        <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4">
          Ready to Review Faster?
        </h2>
        <p className="text-xl text-primary-100 mb-8 max-w-xl mx-auto">
          Start reviewing technical assessments in minutes, not hours. Create your free account today.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-primary-600 py-3 px-8 rounded-lg font-medium text-body-lg hover:bg-primary-50 transition-all duration-base shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  )
}

