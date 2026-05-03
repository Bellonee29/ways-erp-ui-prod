import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-[6px]">
        {label && (
          <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
            {label}
            {props.required && <span className="text-red-500 ml-[2px]">*</span>}
            {hint && <Info size={12} className="text-gray-300 ml-auto flex-shrink-0" />}
          </label>
        )}
        {/* peer wrapper — focus-within triggers hint visibility */}
        <div className="relative peer">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all duration-200 placeholder:text-gray-400',
              'focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)]',
              error && 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]',
              icon && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {/* Focus hint — slides in when input is focused via peer-focus-within */}
        {hint && !error && (
          <div className="overflow-hidden max-h-0 opacity-0 peer-focus-within:max-h-20 peer-focus-within:opacity-100 transition-all duration-200 ease-in-out">
            <p className="flex items-start gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-[5px] px-2.5 py-1.5 leading-snug">
              <Info size={11} className="flex-shrink-0 mt-[1px]" />
              {hint}
            </p>
          </div>
        )}
        {error && <p className="text-[12px] text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input

/* ── Select ──────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, children, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-[6px]">
        {label && (
          <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
            {label}
            {props.required && <span className="text-red-500 ml-[2px]">*</span>}
            {hint && <Info size={12} className="text-gray-300 ml-auto flex-shrink-0" />}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all duration-200 peer',
            'focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)]',
            error && 'border-red-400',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && (
          <div className="overflow-hidden max-h-0 opacity-0 peer-focus:max-h-20 peer-focus:opacity-100 transition-all duration-200 ease-in-out">
            <p className="flex items-start gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-[5px] px-2.5 py-1.5 leading-snug">
              <Info size={11} className="flex-shrink-0 mt-[1px]" />
              {hint}
            </p>
          </div>
        )}
        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'