export default function WorkflowSection() {
  return (
    <div className="py-16 lg:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-semibold text-neutral-900 mb-4">
          How It Works
        </h2>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          A streamlined process for both candidates and reviewers
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Candidate Side */}
        <div className="bg-neutral-50 rounded-lg p-8 border border-neutral-900 hover:bg-neutral-100 transition-shadow duration-base">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-lg">👤</span>
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900">For Candidates</h3>
          </div>
          <ol className="space-y-5">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-body-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-1.5">Submit Your Project</h4>
                <p className="text-body text-neutral-600 leading-relaxed">
                  Upload your GitHub repo or zip file. Include a demo video, AI chat export, or reflections to showcase your process.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-body-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-1.5">Automated Evaluation</h4>
                <p className="text-body text-neutral-600 leading-relaxed">
                  Our system analyzes your code, generates tests, evaluates your demo, and understands your development workflow.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-body-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-1.5">Showcase Real Skills</h4>
                <p className="text-body text-neutral-600 leading-relaxed">
                  Demonstrate architecture decisions, problem-solving approach, and engineering excellence—not puzzle-solving tricks.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Reviewer Side */}
        <div className="bg-neutral-50 rounded-lg p-8 border border-neutral-900 hover:bg-neutral-100 transition-shadow duration-base">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-lg">👥</span>
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900">For Reviewers</h3>
          </div>
          <ol className="space-y-5">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-body-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-1.5">Create Assessment</h4>
                <p className="text-body text-neutral-600 leading-relaxed">
                  Define project requirements and prompts. The system automatically generates test cases and evaluation criteria.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-body-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-1.5">Automated Analysis</h4>
                <p className="text-body text-neutral-600 leading-relaxed">
                  Get comprehensive briefs with test results, code metrics, commit insights, and structured evaluation summaries.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-body-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-1.5">Review in Minutes</h4>
                <p className="text-body text-neutral-600 leading-relaxed">
                  Understand submissions in under 7 minutes with AI-generated briefs highlighting key decisions and engineering signal.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

