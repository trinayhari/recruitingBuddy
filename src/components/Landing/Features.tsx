export default function Features() {
  const features = [
    {
      title: 'Automated Test Generation',
      description: 'AI generates comprehensive test suites from project requirements, ensuring submissions meet real-world standards.',
      icon: '🧪',
    },
    {
      title: 'Code Analysis & Metrics',
      description: 'Deep analysis of code structure, dependencies, complexity, and patterns—understanding how candidates actually build.',
      icon: '🔍',
    },
    {
      title: 'Runnable Demo Evaluation',
      description: 'Test live demos and interactive projects, not just static code. See how candidates solve real problems.',
      icon: '🚀',
    },
    {
      title: 'AI-Assisted Workflow Insights',
      description: 'Understand how candidates use modern tools. Analyze commit patterns, AI chat exports, and development workflows.',
      icon: '🤖',
    },
    {
      title: 'Structured Reviewer Briefs',
      description: 'Get comprehensive briefs in under 7 minutes with TL;DR summaries, work style analysis, and key decisions.',
      icon: '📋',
    },
    {
      title: 'Real Engineering Signal',
      description: 'Focus on architecture, tradeoffs, and problem-solving—not memorized algorithms or puzzle-solving tricks.',
      icon: '⭐',
    },
  ]

  return (
    <div className="py-16 lg:py-24">
      <h2 className="text-3xl lg:text-4xl font-semibold text-neutral-900 text-center mb-4">
        Built for Modern Engineering Workflows
      </h2>
      <p className="text-lg text-neutral-600 text-center mb-12 max-w-2xl mx-auto">
        Evaluate candidates the way they actually work—with AI assistance, real projects, and practical problem-solving.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md hover:border-primary-200 transition-all duration-base"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{feature.title}</h3>
            <p className="text-body text-neutral-600 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

