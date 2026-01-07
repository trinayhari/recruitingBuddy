import Link from "next/link";

export default function Hero() {
  return (
    <div className="text-center py-16 lg:py-24">
      <div className="inline-block mb-6">
        <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-body-sm font-medium">
          AI-Powered Assessment Platform
        </span>
      </div>
      <h1 className="text-4xl lg:text-6xl font-semibold text-neutral-900 mb-6 leading-tight">
        Evaluate Real Engineering Signal,
        <br className="hidden lg:block" /> Not LeetCode Puzzles
      </h1>
      <p className="text-xl lg:text-2xl text-neutral-600 mb-4 max-w-3xl mx-auto leading-relaxed">
        A modern take-home assessment platform that evaluates AI-assisted coding
        workflows through automated test generation, code analysis, and runnable
        demos.
      </p>
      <p className="text-lg text-neutral-500 mb-8 max-w-2xl mx-auto">
        Built for candidates to showcase real projects and reviewers to evaluate
        engineering excellence—not algorithmic tricks.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/signup"
          className="bg-neutral-900 text-white py-3 px-8 rounded-lg font-medium text-body-lg hover:bg-neutral-800 transition-all duration-base shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
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
  );
}
