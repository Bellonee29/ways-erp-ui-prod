'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/theme'
import { useEffect } from 'react'
import { applyStoredTheme } from '@/store/theme'

export default function ThemeToggle() {
  const { isDark, toggle } = useThemeStore()

  // Re-apply on first render in case SSR didn't apply the class
  useEffect(() => { applyStoredTheme() }, [])

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-[38px] h-[38px] rounded-[6px] bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}