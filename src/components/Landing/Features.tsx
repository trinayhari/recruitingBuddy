export default function Features() {
  const features = [
    {
      title: '7-Minute Reviews',
      description: 'Get comprehensive analysis of code submissions in under 7 minutes, not hours.',
      icon: '⚡',
    },
    {
      title: 'Automated Analysis',
      description: 'AI-powered analysis of code structure, commits, dependencies, and more.',
      icon: '🤖',
    },
    {
      title: 'Requirement Testing',
      description: 'Automatically generate and run tests based on project requirements.',
      icon: '✅',
    },
    {
      title: 'Commit Insights',
      description: 'Understand candidate work style through commit history analysis.',
      icon: '📊',
    },
    {
      title: 'Code Quality Metrics',
      description: 'Get detailed metrics on code quality, complexity, and patterns.',
      icon: '📈',
    },
    {
      title: 'Reviewer Briefs',
      description: 'Comprehensive briefs that help you understand submissions quickly.',
      icon: '📝',
    },
  ]

  return (
    <div className="py-16 lg:py-24">
      <h2 className="text-3xl lg:text-4xl font-semibold text-neutral-900 text-center mb-12">
        Everything You Need to Review Faster
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-base"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{feature.title}</h3>
            <p className="text-body text-neutral-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

