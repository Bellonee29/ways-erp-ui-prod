'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth'
import { getErrorMessage } from '@/lib/api/client'
import Button from '@/components/ui/Button'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

const FIELD_META: Array<{
  name: keyof FormValues
  label: string
  showKey: 'curr' | 'new' | 'conf'
  hint: string
}> = [
  {
    name: 'currentPassword',
    label: 'Current Password',
    showKey: 'curr',
    hint: 'Enter your existing password to verify your identity before making changes.',
  },
  {
    name: 'newPassword',
    label: 'New Password',
    showKey: 'new',
    hint: 'At least 8 characters. Use a mix of uppercase, lowercase, numbers, and symbols for a strong password.',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm New Password',
    showKey: 'conf',
    hint: 'Re-type your new password exactly as above. Both fields must match to proceed.',
  },
]

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [show, setShow] = useState({ curr: false, new: false, conf: false })

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      await authApi.changePassword(values)
      toast.success('Password changed. Please log in again.')
      logout()
      router.replace('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-md p-8">
        <div className="w-14 h-14 rounded-[14px] bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mx-auto mb-6">
          <Lock size={26} />
        </div>

        <h2 className="text-[24px] font-bold text-gray-900 text-center">Set New Password</h2>
        <p className="text-gray-500 text-[14px] text-center mt-2">
          {user?.mustChangePassword
            ? 'Your account requires a password change before you can continue.'
            : 'Update your account password.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5">
          {FIELD_META.map(({ name, label, showKey, hint }) => (
            <div key={name} className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-semibold text-gray-700">{label} <span className="text-red-500">*</span></label>
              {/* peer wrapper so focus-within triggers hint */}
              <div className="relative peer">
                <input
                  type={show[showKey] ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register(name)}
                  className="w-full px-[14px] py-[11px] pr-10 border-[1.5px] border-gray-200 rounded-[6px] text-[14px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Focus hint */}
              <div className="overflow-hidden max-h-0 opacity-0 peer-focus-within:max-h-20 peer-focus-within:opacity-100 transition-all duration-200 ease-in-out">
                <p className="flex items-start gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-[5px] px-2.5 py-1.5 leading-snug">
                  {hint}
                </p>
              </div>
              {errors[name] && (
                <p className="text-[12px] text-red-500">{errors[name]?.message}</p>
              )}
            </div>
          ))}

          <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
            Change Password
          </Button>
        </form>
      </div>
    </div>
  )
}