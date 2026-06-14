import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isDark: boolean
  toggle: () => void
  setDark: (dark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () =>
        set((s) => {
          const next = !s.isDark
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next)
          }
          return { isDark: next }
        }),
      setDark: (dark) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', dark)
        }
        set({ isDark: dark })
      },
    }),
    { name: 'ways-erp-theme' }
  )
)

/** Call once on app boot to re-apply persisted preference */
export function applyStoredTheme() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('ways-erp-theme')
    if (raw) {
      const { state } = JSON.parse(raw)
      if (state?.isDark) document.documentElement.classList.add('dark')
    }
  } catch {}
}