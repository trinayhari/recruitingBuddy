'use client'

interface MetricBarProps {
  value: number // 0-100
  label: string
  showNumeric?: boolean
  size?: 'small' | 'medium' | 'large'
}

function getSignalColor(value: number): string {
  if (value >= 80) return 'bg-[#059669]' // emerald-600 - Excellent
  if (value >= 60) return 'bg-[#3B5BDB]' // primary indigo - Good
  if (value >= 40) return 'bg-[#D97706]' // amber-600 - Fair
  return 'bg-[#DC2626]' // red-600 - Needs Work
}

function getTextColor(value: number): string {
  if (value >= 80) return 'text-[#059669]'
  if (value >= 60) return 'text-[#3B5BDB]'
  if (value >= 40) return 'text-[#D97706]'
  return 'text-[#DC2626]'
}

export default function MetricBar({ 
  value, 
  label, 
  showNumeric = true,
  size = 'medium'
}: MetricBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const barColor = getSignalColor(clampedValue)
  const textColor = getTextColor(clampedValue)
  
  // Get actual color values for inline styles (fallback)
  const getBarColorValue = (val: number): string => {
    if (val >= 80) return '#059669' // emerald-600
    if (val >= 60) return '#3B5BDB' // primary indigo
    if (val >= 40) return '#D97706' // amber-600
    return '#DC2626' // red-600
  }
  
  const labelSize = size === 'small' ? 'text-body-sm' : size === 'large' ? 'text-body-lg' : 'text-body'
  const valueSize = size === 'small' ? 'text-body-sm' : size === 'large' ? 'text-h2' : 'text-body-lg'

  // Get score range label for better context
  const getScoreLabel = (val: number): string => {
    if (val >= 80) return 'Excellent'
    if (val >= 60) return 'Good'
    if (val >= 40) return 'Fair'
    return 'Needs Work'
  }
  
  const barColorValue = getBarColorValue(clampedValue)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`${labelSize} font-medium text-neutral-900`}>
            {label}
          </span>
          {/* Color indicator dot */}
          <span 
            className="w-2 h-2 rounded-full"
            aria-label={`Score: ${getScoreLabel(clampedValue)}`}
            style={{ backgroundColor: barColorValue }}
          />
        </div>
        {showNumeric && (
          <div className="flex items-center gap-2">
            <span className={`${valueSize} font-medium ${textColor}`}>
              {Math.round(clampedValue)}
            </span>
            <span className={`text-caption ${textColor} opacity-75`}>
              {getScoreLabel(clampedValue)}
            </span>
          </div>
        )}
      </div>
      <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden relative">
        {/* Colored progress bar - color changes based on score */}
        {clampedValue > 0 ? (
          <div
            className="h-full transition-all duration-slow ease-smooth rounded-full shadow-sm"
            style={{ 
              width: `${clampedValue}%`, 
              minWidth: '2px',
              backgroundColor: barColorValue 
            }}
          />
        ) : (
          <div
            className="h-full bg-neutral-300 rounded-full opacity-50"
            style={{ width: '100%' }}
          />
        )}
        {/* Subtle gradient overlay for visual depth on high scores */}
        {clampedValue >= 80 && (
          <div
            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full pointer-events-none"
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
    </div>
  )
}

