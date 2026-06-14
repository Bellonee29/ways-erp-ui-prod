'use client'

import { Bell, Search, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import ThemeToggle from '@/components/ui/ThemeToggle'

const PAGE_TITLES: Record<string, { title: string; breadcrumb: string }> = {
  '/dashboard':  { title: 'Dashboard',   breadcrumb: 'Home / Dashboard' },
  '/invoices':   { title: 'Invoices',    breadcrumb: 'Finance / Invoices' },
  '/crm':        { title: 'CRM',         breadcrumb: 'Sales / CRM' },
  '/inventory':  { title: 'Inventory',   breadcrumb: 'Operations / Inventory' },
  '/accounting': { title: 'Accounting',  breadcrumb: 'Finance / Accounting' },
  '/users':      { title: 'Users',       breadcrumb: 'Admin / Users' },
  '/tenants':    { title: 'Tenants',     breadcrumb: 'Admin / Tenants' },
  '/analytics':  { title: 'Analytics',  breadcrumb: 'Reports / Analytics' },
}

export default function Header() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const match = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))
  const { title, breadcrumb } = match?.[1] ?? { title: 'WaysERP', breadcrumb: 'Home' }

  return (
    <header
      className="bg-white border-b border-gray-200 flex items-center justify-between px-7 sticky top-0 z-50 shadow-sm"
      style={{ height: 'var(--header-h)' }}
    >
      {/* Left */}
      <div className="flex flex-col">
        <h1 className="text-[18px] font-bold text-gray-900 leading-none">{title}</h1>
        <p className="text-[12px] text-gray-400 mt-[3px]">
          {breadcrumb.split('/').map((part, i, arr) => (
            <span key={i}>
              {i < arr.length - 1 ? (
                <span className="text-gray-400">{part.trim()} / </span>
              ) : (
                <span className="text-green-600 font-medium">{part.trim()}</span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-[6px] px-[14px] py-2 w-60 focus-within:bg-white focus-within:border-green-400 focus-within:shadow-[0_0_0_3px_rgba(34,197,94,.1)] transition-all">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-[13px] text-gray-700 w-full placeholder:text-gray-400"
          />
        </div>

        {/* Notification */}
        <button className="relative w-[38px] h-[38px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all">
          <Bell size={17} />
          <span className="absolute top-[6px] right-[6px] w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
        </button>

        {/* Settings */}
        <button className="w-[38px] h-[38px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all">
          <Settings size={17} />
        </button>

        {/* Dark / light mode toggle */}
        <ThemeToggle />

        {/* Org chip */}
        {user?.organizationName && (
          <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-200 rounded-[6px] px-3 py-[6px]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[12px] font-semibold text-green-700 max-w-[140px] truncate">
              {user.organizationName}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}