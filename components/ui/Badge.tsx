import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
  shimmer?: boolean
}

const variants: Record<BadgeVariant, string> = {
  green:  'bg-green-50  text-green-700',
  blue:   'bg-blue-50   text-blue-700',
  amber:  'bg-amber-50  text-amber-800',
  red:    'bg-red-50    text-red-600',
  gray:   'bg-gray-100  text-gray-600',
  purple: 'bg-purple-50 text-purple-700',
}

export default function Badge({ variant = 'gray', children, className, dot = true, shimmer }: BadgeProps) {
  if (shimmer) {
    return (
      <span className={cn(
        'inline-flex items-center gap-[6px] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide firs-badge',
        'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-[0_2px_8px_rgba(34,197,94,.35)]',
        className
      )}>
        {children}
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-full text-[11.5px] font-semibold',
      variants[variant],
      className
    )}>
      {dot && (
        <span className="w-[6px] h-[6px] rounded-full bg-current" />
      )}
      {children}
    </span>
  )
}

// Maps domain values to badge variants
export function invoiceStatusBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    DRAFT: 'gray', PENDING: 'amber', FISCALIZED: 'green', FAILED: 'red', CANCELLED: 'gray',
  }
  return map[status] ?? 'gray'
}

export function fiscalizationBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    NOT_STARTED: 'gray', IN_PROGRESS: 'blue', COMPLETED: 'green', FAILED: 'red',
  }
  return map[status] ?? 'gray'
}

export function userRoleBadge(role: string): BadgeVariant {
  return role === 'TENANT_ADMIN' ? 'purple' : role === 'DIVISION_ADMIN' ? 'blue' : 'gray'
}