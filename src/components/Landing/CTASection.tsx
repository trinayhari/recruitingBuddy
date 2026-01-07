import Link from "next/link";

export default function CTASection() {
  return (
    <div className="py-16 lg:py-24">
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-12 text-center shadow-lg">
        <h2 className="text-3xl lg:text-4xl font-semibold text-black mb-4">
          Ready to Transform Your Hiring Process?
        </h2>
        <p className="text-xl text-black/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join teams evaluating real engineering skills through automated test
          generation, code analysis, and structured reviews. Start free today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-block bg-neutral-900 text-white py-3 px-8 rounded-lg font-medium text-body-lg hover:bg-neutral-800 transition-all duration-base shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
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
    </div>
  );
}
