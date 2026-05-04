'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'
import { Clock, LogOut } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hasHydrated) return
    if (!user) {
      router.replace('/login')
    } else if (user.mustChangePassword) {
      router.replace('/change-password')
    }
  }, [user, _hasHydrated, router])

  function handleTimeout() {
    logout()
    router.replace('/login')
  }

  const { isWarning, remainingSeconds, stayLoggedIn } = useIdleTimeout({
    timeoutMs: 5 * 60 * 1000,   // 5 minutes idle → logout
    warningMs: 60 * 1000,        // warn 60 seconds before
    onTimeout: handleTimeout,
  })

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-gray-500 font-medium">Loading session...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-7 overflow-y-auto animate-fadeIn">
          {children}
        </main>
      </div>

      {/* ── Idle session warning modal ── */}
      {isWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

          {/* Dialog */}
          <div className="relative bg-white rounded-[14px] shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

            <div className="p-7 flex flex-col items-center text-center gap-4">
              {/* Icon + countdown ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="#fde68a"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - remainingSeconds / 60)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <Clock size={22} className="text-amber-500" />
              </div>

              <div>
                <p className="text-[16px] font-bold text-gray-900">Session Expiring</p>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                  You've been inactive. You'll be automatically logged out in
                </p>
                <p className="text-[32px] font-extrabold text-amber-500 mt-1 tabular-nums">
                  {remainingSeconds}s
                </p>
              </div>

              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => { logout(); router.replace('/login') }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
                <button
                  onClick={stayLoggedIn}
                  className="flex-1 px-4 py-2.5 rounded-[8px] bg-gradient-to-br from-green-600 to-green-500 text-white text-[13px] font-semibold shadow-md hover:shadow-lg hover:-translate-y-px transition-all"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}