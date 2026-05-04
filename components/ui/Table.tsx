import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ── Table shell ────────────────────────────────────────────────────────────────
interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">{children}</tr>
    </thead>
  )
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'text-left text-[11.5px] font-bold tracking-[.06em] uppercase text-gray-500 px-4 py-3',
        className
      )}
    >
      {children}
    </th>
  )
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

export function Tr({ children, className, onClick }: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-gray-100 last:border-0 transition-colors hover:bg-green-50/50',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-[13px] text-[13.5px] text-gray-700 align-middle', className)}>
      {children}
    </td>
  )
}

// ── Pagination ─────────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalElements, size, onPageChange }: PaginationProps) {
  const from = page * size + 1
  const to   = Math.min((page + 1) * size, totalElements)

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i
    if (page < 4) return i
    if (page > totalPages - 5) return totalPages - 7 + i
    return page - 3 + i
  })

  return (
    <div className="flex items-center justify-between px-[22px] py-4 border-t border-gray-100">
      <p className="text-[13px] text-gray-500">
        Showing <strong>{from}–{to}</strong> of <strong>{totalElements}</strong>
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="w-8 h-8 rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'w-8 h-8 rounded-[6px] text-[13px] font-semibold flex items-center justify-center transition-colors',
              p === page
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
            )}
          >
            {p + 1}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="w-8 h-8 rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function EmptyState({ message = 'No records found', icon }: { message?: string; icon?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={999} className="py-16 text-center">
        {icon && <div className="flex justify-center mb-3 text-gray-300">{icon}</div>}
        <p className="text-[14px] text-gray-400 font-medium">{message}</p>
      </td>
    </tr>
  )
}

// ── Skeleton rows ──────────────────────────────────────────────────────────────
export function SkeletonRows({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <Tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <Td key={c}>
              <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            </Td>
          ))}
        </Tr>
      ))}
    </>
  )
}