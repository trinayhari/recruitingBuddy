'use client'

interface InlineAlertProps {
  children: React.ReactNode
  variant?: 'error' | 'warning' | 'info' | 'success'
  className?: string
}

function getVariantStyles(variant: InlineAlertProps['variant']) {
  switch (variant) {
    case 'error':
      return {
        border: 'border-l-signal-low',
        bg: 'bg-neutral-50',
        text: 'text-neutral-900',
      }
    case 'warning':
      return {
        border: 'border-l-signal-moderate',
        bg: 'bg-neutral-50',
        text: 'text-neutral-900',
      }
    case 'success':
      return {
        border: 'border-l-signal-high',
        bg: 'bg-neutral-50',
        text: 'text-neutral-900',
      }
    case 'info':
    default:
      return {
        border: 'border-l-neutral-300',
        bg: 'bg-neutral-50',
        text: 'text-neutral-900',
      }
  }
}

export default function InlineAlert({
  children,
  variant = 'info',
  className = '',
}: InlineAlertProps) {
  const styles = getVariantStyles(variant)

  return (
    <div
      className={`border-l-[3px] ${styles.border} ${styles.bg} ${styles.text} px-4 py-3 rounded-r-md ${className}`}
      role="alert"
    >
      {children}
    </div>
  )
}

