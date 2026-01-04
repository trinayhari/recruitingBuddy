'use client'

interface SignalGaugeProps {
  value: number // 0-100
  label: string
  size?: 'small' | 'medium' | 'large'
  showValue?: boolean
}

export default function SignalGauge({ value, label, size = 'medium', showValue = true }: SignalGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  
  // Determine color based on value
  const getColor = (val: number): string => {
    if (val >= 80) return 'text-green-600'
    if (val >= 60) return 'text-yellow-600'
    if (val >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getBgColor = (val: number): string => {
    if (val >= 80) return 'bg-green-100'
    if (val >= 60) return 'bg-yellow-100'
    if (val >= 40) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getProgressColor = (val: number): string => {
    if (val >= 80) return 'bg-green-500'
    if (val >= 60) return 'bg-yellow-500'
    if (val >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const sizeClasses = {
    small: 'h-16',
    medium: 'h-24',
    large: 'h-32',
  }

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }

  const valueSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]} w-full max-w-[120px]`}>
        {/* Circular progress background */}
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - clampedValue / 100)}`}
            strokeLinecap="round"
            className={getColor(clampedValue)}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center value */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold ${getColor(clampedValue)} ${valueSizeClasses[size]}`}>
              {Math.round(clampedValue)}
            </span>
          </div>
        )}
      </div>
      {/* Label */}
      <div className={`mt-2 text-center ${textSizeClasses[size]} text-gray-600 font-medium`}>
        {label}
      </div>
      {/* Progress bar alternative (for smaller spaces) */}
      <div className={`mt-1 w-full max-w-[120px] h-2 ${getBgColor(clampedValue)} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getProgressColor(clampedValue)} transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}

