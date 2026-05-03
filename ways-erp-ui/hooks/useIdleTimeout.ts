'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'scroll', 'touchstart', 'click',
]

interface Options {
  /** Total idle time before logout in ms. Default: 5 minutes. */
  timeoutMs?: number
  /** How early to show the warning before logout in ms. Default: 60 seconds. */
  warningMs?: number
  onTimeout: () => void
}

interface IdleState {
  /** True when the warning countdown is showing. */
  isWarning: boolean
  /** Seconds remaining until auto-logout (only meaningful when isWarning=true). */
  remainingSeconds: number
  /** Call this to dismiss the warning and reset the idle timer. */
  stayLoggedIn: () => void
}

export function useIdleTimeout({
  timeoutMs = 5 * 60 * 1000,
  warningMs = 60 * 1000,
  onTimeout,
}: Options): IdleState {
  const [isWarning, setIsWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  // Refs so event handler closures always see current values
  const isWarningRef    = useRef(false)
  const logoutTimer     = useRef<ReturnType<typeof setTimeout>>()
  const warningTimer    = useRef<ReturnType<typeof setTimeout>>()
  const countdownTimer  = useRef<ReturnType<typeof setInterval>>()
  const onTimeoutRef    = useRef(onTimeout)

  useEffect(() => { onTimeoutRef.current = onTimeout }, [onTimeout])

  const clearAll = useCallback(() => {
    clearTimeout(logoutTimer.current)
    clearTimeout(warningTimer.current)
    clearInterval(countdownTimer.current)
  }, [])

  const reset = useCallback(() => {
    clearAll()
    isWarningRef.current = false
    setIsWarning(false)

    // Schedule warning
    warningTimer.current = setTimeout(() => {
      isWarningRef.current = true
      setIsWarning(true)
      setRemainingSeconds(Math.round(warningMs / 1000))

      countdownTimer.current = setInterval(() => {
        setRemainingSeconds((s) => Math.max(0, s - 1))
      }, 1000)
    }, timeoutMs - warningMs)

    // Schedule logout
    logoutTimer.current = setTimeout(() => {
      clearAll()
      isWarningRef.current = false
      setIsWarning(false)
      onTimeoutRef.current()
    }, timeoutMs)
  }, [timeoutMs, warningMs, clearAll])

  useEffect(() => {
    const handleActivity = () => {
      // While the warning is showing, only an explicit "Stay logged in" click resets.
      // Passive movement/typing is ignored so the countdown is visible and intentional.
      if (!isWarningRef.current) reset()
    }

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, handleActivity, { passive: true })
    )
    reset() // start timer on mount

    return () => {
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, handleActivity)
      )
      clearAll()
    }
  }, [reset, clearAll])

  const stayLoggedIn = useCallback(() => reset(), [reset])

  return { isWarning, remainingSeconds, stayLoggedIn }
}