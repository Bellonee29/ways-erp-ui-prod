'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api/auth'
import { useAuthStore, mapAuthResponse } from '@/store/auth'
import Button from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/api/client'

const OTP_LENGTH = 6

export default function VerifyOtpPage() {
  const router            = useRouter()
  const { pendingEmail, setUser } = useAuthStore()
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function updateDigit(index: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = v
    setDigits(next)
    if (v && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = [...digits]
    text.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus()
  }

  async function onSubmit() {
    const otp = digits.join('')
    if (otp.length < OTP_LENGTH) { toast.error('Enter the full 6-digit OTP'); return }
    if (!pendingEmail) { toast.error('Session expired. Please log in again.'); router.replace('/login'); return }

    setLoading(true)
    try {
      const res = await authApi.verify2FA({ email: pendingEmail, otpCode: otp })
      const auth = res.data.data
      setUser(mapAuthResponse(auth))
      toast.success('Logged in successfully')
      router.replace(auth.requiresPasswordChange ? '/change-password' : '/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    if (!pendingEmail) return
    setResending(true)
    try {
      await authApi.resendOtp(pendingEmail)
      toast.success('OTP resent to your email')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-md p-8">
        {/* Icon */}
        <div className="w-14 h-14 rounded-[14px] bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mx-auto mb-6">
          <Mail size={26} />
        </div>

        <h2 className="text-[24px] font-bold text-gray-900 text-center">Check your email</h2>
        <p className="text-gray-500 text-[14px] text-center mt-2 leading-relaxed">
          We sent a 6-digit OTP to{' '}
          <strong className="text-gray-700">{pendingEmail || 'your email'}</strong>.
          Enter it below to continue.
        </p>

        {/* OTP inputs */}
        <div className="flex gap-[10px] mt-8 justify-center">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => updateDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              className="w-12 h-14 text-center text-[22px] font-bold border-2 border-gray-200 rounded-[6px] bg-gray-50 text-gray-800 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.12)] caret-transparent"
            />
          ))}
        </div>

        <Button
          onClick={onSubmit}
          loading={loading}
          size="lg"
          className="w-full mt-8"
        >
          Verify & Sign In
        </Button>

        <div className="mt-5 text-center">
          <p className="text-[13px] text-gray-500">
            Didn&apos;t receive it?{' '}
            <button
              onClick={onResend}
              disabled={resending}
              className="text-green-600 font-semibold hover:underline inline-flex items-center gap-1 disabled:opacity-60"
            >
              <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
              Resend OTP
            </button>
          </p>
        </div>

        <button
          onClick={() => router.replace('/login')}
          className="mt-4 w-full text-center text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to login
        </button>
      </div>
    </div>
  )
}