import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-[0_2px_8px_rgba(22,163,74,.3)] hover:shadow-[0_4px_14px_rgba(22,163,74,.4)] hover:-translate-y-px active:translate-y-0',
  outline:
    'bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-sm',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-[6px] text-[12px] gap-[5px]',
  md: 'px-[18px] py-[9px] text-[13px] gap-[6px]',
  lg: 'px-6 py-3 text-[15px] gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-[6px] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}