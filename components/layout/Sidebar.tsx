'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, Building2,
  ShoppingCart, BookOpen, TrendingUp, LogOut, ChevronRight, Settings, BarChart2,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn, getInitials } from '@/lib/utils'

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
  roles?: string[]  // if set, only show for these roles
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Invoices',   icon: FileText,         href: '/invoices' },
  { label: 'CRM',        icon: TrendingUp,        href: '/crm' },
  { label: 'Inventory',  icon: ShoppingCart,      href: '/inventory' },
  { label: 'Accounting', icon: BookOpen,           href: '/accounting', roles: ['TENANT_ADMIN', 'DIVISION_ADMIN'] },
  { label: 'Reports',    icon: BarChart2,           href: '/reports' },
  { label: 'Analytics',  icon: TrendingUp,          href: '/analytics',  roles: ['SYSTEM_ADMIN', 'TENANT_ADMIN', 'DIVISION_ADMIN'] },
  { label: 'Tenants',   icon: Building2,           href: '/tenants',    roles: ['SYSTEM_ADMIN'] },
  { label: 'Users',      icon: Users,              href: '/users' },
  { label: 'Divisions',  icon: Building2,          href: '/divisions', roles: ['TENANT_ADMIN'] },
  { label: 'Settings',   icon: Settings,            href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? '')
  )

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'User'

  return (
    <aside
      className="flex flex-col bg-gray-900 text-white"
      style={{ width: 'var(--sidebar-w)', height: '100vh', position: 'sticky', top: 0 }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 border-b border-white/[0.06] flex-shrink-0"
        style={{ height: 'var(--header-h)' }}
      >
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-lg font-bold flex-shrink-0">
          W
        </div>
        <span className="text-[17px] font-extrabold tracking-tight">
          Ways<span className="text-green-400">ERP</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        <p className="px-5 pt-2 pb-1 text-[10px] font-bold tracking-widest uppercase text-gray-500">
          Main Menu
        </p>

        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-[10px] mx-2 my-[1px] px-3 py-[10px] rounded-[6px] text-[13.5px] font-medium transition-all duration-200 group relative',
                active
                  ? 'bg-gradient-to-r from-green-500/18 to-green-500/8 text-green-400 font-semibold'
                  : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-green-400 rounded-r-sm" />
              )}
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {!active && (
                <ChevronRight
                  size={13}
                  className="opacity-0 group-hover:opacity-40 transition-opacity"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-[10px] px-3 py-[10px] rounded-[6px] bg-white/[0.05] hover:bg-white/[0.09] cursor-pointer transition-colors">
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-green-400">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}