'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Zap, Shield, BarChart3, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getErrorMessage } from '@/lib/api/client'

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

const FEATURES = [
  { icon: Zap,       text: 'FIRS Invoice Fiscalization'    },
  { icon: BarChart3, text: 'Full Accounting & Reports'     },
  { icon: Globe,     text: 'CRM, Inventory & Multi-Tenant' },
  { icon: Shield,    text: 'JWT + 2FA Security'            },
]

export default function LoginPage() {
  const router = useRouter()
  const { setPendingEmail, setPendingTotpRequired } = useAuthStore()
  const [showPass, setShowPass] = useState(false)

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      const res = await authApi.login(values)
      const data = res.data.data
      setPendingEmail(values.email)
      if (data?.totpRequired) {
        setPendingTotpRequired(true)
        toast.success('Open your authenticator app')
      } else {
        setPendingTotpRequired(false)
        toast.success('OTP sent to your email')
      }
      router.push('/verify-otp')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* ── Brand panel ── */}
      <div className="relative hidden lg:flex flex-col justify-center items-center p-16 overflow-hidden bg-gradient-to-br from-green-700 via-green-500 to-green-400">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-white/[.06] -top-[100px] -right-[100px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-white/[.04] -bottom-[80px] -left-[80px]" />
        <div className="relative z-10 text-center">
          <div className="w-[72px] h-[72px] rounded-[16px] bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center text-[32px] font-extrabold text-white mx-auto mb-6 animate-float">
            W
          </div>
          <h1 className="text-[36px] font-extrabold text-white">WaysERP</h1>
          <p className="text-white/75 text-[15px] mt-3 max-w-[340px] mx-auto leading-relaxed">
            Nigeria&apos;s complete ERP — FIRS fiscalization, accounting, CRM and inventory in one platform.
          </p>
          <div className="mt-10 flex flex-col gap-[14px]">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 border border-white/12 backdrop-blur-md rounded-[10px] px-4 py-3 text-white text-[13px]">
                <Icon size={18} className="flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-col justify-center items-center p-10 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white font-extrabold text-lg">W</div>
            <span className="text-[20px] font-extrabold">Ways<span className="text-green-500">ERP</span></span>
          </div>

          <h2 className="text-[26px] font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-500 text-[14px] mt-[6px]">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              required
              error={errors.email?.message}
              hint="Enter the email address you registered with on WaysERP"
              {...register('email')}
            />

            {/* Password with show/hide toggle — wrapper must stay peer */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-semibold text-gray-700">Password <span className="text-red-500">*</span></label>
              <div className="relative peer">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full px-[14px] py-[11px] pr-10 border-[1.5px] border-gray-200 rounded-[6px] text-[14px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.12)]"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="overflow-hidden max-h-0 opacity-0 peer-focus-within:max-h-20 peer-focus-within:opacity-100 transition-all duration-200 ease-in-out">
                <p className="flex items-start gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-[5px] px-2.5 py-1.5 leading-snug">
                  Your account password. Login is a 2-step process — an OTP will be emailed after this step.
                </p>
              </div>
              {errors.password && <p className="text-[12px] text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
              Sign In & Continue
            </Button>
          </form>

          <div className="mt-5 bg-green-50 border border-green-200 rounded-[6px] p-3 flex items-start gap-2 text-[13px] text-green-700">
            <Shield size={15} className="flex-shrink-0 mt-[2px]" />
            Login is a 2-step process. An OTP will be emailed after credentials are verified.
          </div>

          <p className="mt-6 text-center text-[13px] text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-green-600 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}