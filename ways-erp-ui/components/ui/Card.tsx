import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden',
        padding && 'p-[22px]',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-[22px] py-[18px] border-b border-gray-100',
        className
      )}
    >
      <h3 className="text-[15px] font-bold text-gray-800">{title}</h3>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-[22px]', className)}>{children}</div>
}

// ── Stat card ──────────────────────────────────────────────────────────────────
type StatColor = 'green' | 'blue' | 'amber' | 'purple'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down'
  icon: React.ReactNode
  color?: StatColor
}

const iconBg: Record<StatColor, string> = {
  green:  'bg-green-50',
  blue:   'bg-blue-50',
  amber:  'bg-amber-50',
  purple: 'bg-purple-50',
}

export function StatCard({ label, value, change, changeType = 'up', icon, color = 'green' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex justify-between items-start transition-all hover:-translate-y-[2px] hover:shadow hover:border-green-200">
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-bold uppercase tracking-[.06em] text-gray-500">{label}</span>
        <span className="text-[28px] font-extrabold text-gray-900 leading-none">{value}</span>
        {change && (
          <span
            className={cn(
              'text-[12px] font-semibold px-2 py-[3px] rounded-full inline-flex items-center gap-1 mt-1 w-fit',
              changeType === 'up'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'
            )}
          >
            {changeType === 'up' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div className={cn('w-11 h-11 rounded-[10px] flex items-center justify-center text-xl', iconBg[color])}>
        {icon}
      </div>
    </div>
  )
}