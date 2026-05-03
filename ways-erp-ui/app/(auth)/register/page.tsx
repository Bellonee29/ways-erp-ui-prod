'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Building2, FileText, KeyRound, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { getErrorMessage } from '@/lib/api/client'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'

/* ── Schema ── */
const schema = z
  .object({
    organizationName:    z.string().min(2, 'Required'),
    domain:              z.string().min(3, 'e.g. company.com'),
    phone:               z.string().min(10, 'Valid phone required'),
    street:              z.string().min(3, 'Required'),
    country:             z.string().default('Nigeria'),
    postalCode:          z.string().min(4, 'Required'),
    businessDescription: z.string().min(10, 'At least 10 characters'),
    tin:                 z.string().min(5, 'FIRS TIN required'),
    businessId:          z.string().min(1, 'Required'),
    serviceId:           z.string().min(1, 'Required'),
    email:               z.string().email('Valid email required'),
    password:            z.string().min(8, 'At least 8 characters'),
    retypePassword:      z.string().min(1, 'Required'),
  })
  .refine((d) => d.password === d.retypePassword, {
    message: 'Passwords do not match',
    path: ['retypePassword'],
  })

type FormValues = z.infer<typeof schema>

/* ── Steps ── */
const STEPS = [
  {
    id: 'org',
    label: 'Organisation',
    icon: Building2,
    fields: ['organizationName', 'domain', 'country', 'phone', 'street', 'postalCode', 'businessDescription'],
  },
  {
    id: 'firs',
    label: 'FIRS Details',
    icon: FileText,
    fields: ['tin', 'businessId', 'serviceId'],
  },
  {
    id: 'creds',
    label: 'Account',
    icon: KeyRound,
    fields: ['email', 'password', 'retypePassword'],
  },
] as const


export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'Nigeria' },
  })

  async function goNext() {
    const valid = await trigger(STEPS[step].fields as any)
    if (valid) setStep((s) => s + 1)
  }

  async function onSubmit(values: FormValues) {
    try {
      await authApi.register(values)
      setDone(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-md p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-[22px] font-bold text-gray-900">Registration Received!</h2>
          <p className="text-gray-500 mt-3 text-[14px] leading-relaxed">
            Your organisation account has been created with <strong className="text-amber-600">Pending</strong> status.
            An administrator will review and approve it — you&apos;ll get an email once it&apos;s active.
          </p>
          <div className="mt-4 bg-gray-50 rounded-[10px] border border-gray-200 p-4 text-left text-[13px] text-gray-600 space-y-1">
            <p className="flex items-center gap-2"><CheckCircle2 size={13} className="text-green-500" /> Organisation registered</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={13} className="text-green-500" /> Admin account created</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={13} className="text-amber-500" /> Awaiting super-admin approval</p>
          </div>
          <Button onClick={() => router.push('/login')} size="lg" className="w-full mt-6">
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white font-extrabold text-[16px]">
              W
            </div>
            <span className="font-bold text-gray-900 text-[18px]">WaysERP</span>
          </Link>
          <h1 className="text-[26px] font-extrabold text-gray-900">Create Organisation Account</h1>
          <p className="text-gray-500 text-[14px] mt-1">Admin approval required before first login</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8 gap-0">
          {STEPS.map(({ label, icon: Icon }, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < step  ? 'bg-green-600 border-green-600 text-white' :
                  i === step ? 'bg-white border-green-600 text-green-600' :
                               'bg-white border-gray-200 text-gray-300'
                }`}>
                  {i < step ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </div>
                <span className={`text-[11px] font-semibold mt-1 ${i === step ? 'text-green-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-20 h-0.5 mx-1 mb-4 transition-all ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ── Step 0: Organisation ── */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-[8px] bg-green-50 flex items-center justify-center text-green-600">
                  <Building2 size={16} />
                </div>
                <h2 className="text-[15px] font-bold text-gray-800">Organisation Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Organisation Name" required
                  error={errors.organizationName?.message}
                  {...register('organizationName')}
                  placeholder="Acme Nigeria Ltd"
                  hint="Full legal name of your company as registered with the Corporate Affairs Commission (CAC)"
                  className="col-span-2"
                />
                <Input
                  label="Domain" required
                  error={errors.domain?.message}
                  {...register('domain')}
                  placeholder="acme.ng"
                  hint="A unique slug that identifies your organisation on the platform — e.g. acme.ng. Cannot be changed after registration."
                />
                <Select
                  label="Country"
                  hint="Country where your business is primarily registered and operates"
                  {...register('country')}
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                </Select>
                <Input
                  label="Phone Number" required
                  error={errors.phone?.message}
                  {...register('phone')}
                  placeholder="+2348012345678"
                  hint="Business contact number in international format — e.g. +2348012345678"
                  className="col-span-2"
                />
                <Input
                  label="Street Address" required
                  error={errors.street?.message}
                  {...register('street')}
                  placeholder="12 Marina Street, Lagos"
                  hint="Full street address of your business including building number, street name, and city"
                />
                <Input
                  label="Postal Code" required
                  error={errors.postalCode?.message}
                  {...register('postalCode')}
                  placeholder="100001"
                  hint="Nigerian postal code for your business location — e.g. 100001 for Lagos Island"
                />
                <div className="col-span-2">
                  <label className="text-[13px] font-semibold text-gray-700 block mb-[6px]">
                    Business Description <span className="text-red-500">*</span>
                  </label>
                  <div className="peer">
                    <textarea
                      {...register('businessDescription')}
                      placeholder="Brief description of your business activities..."
                      rows={3}
                      className="w-full px-3 py-[9px] border border-gray-200 rounded-[6px] text-[13.5px] text-gray-800 bg-gray-50 outline-none transition-all focus:border-green-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,197,94,.1)] resize-none"
                    />
                  </div>
                  <div className="overflow-hidden max-h-0 opacity-0 peer-focus-within:max-h-16 peer-focus-within:opacity-100 transition-all duration-200 mt-1">
                    <p className="flex items-start gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-[5px] px-2.5 py-1.5 leading-snug">
                      Summarise your company&apos;s main activities — e.g. &quot;Import and distribution of industrial equipment across Nigeria&quot;. Minimum 10 characters.
                    </p>
                  </div>
                  {errors.businessDescription && (
                    <p className="text-[12px] text-red-500 mt-1">{errors.businessDescription.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: FIRS ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-[8px] bg-green-50 flex items-center justify-center text-green-600">
                  <FileText size={16} />
                </div>
                <h2 className="text-[15px] font-bold text-gray-800">FIRS Registration</h2>
              </div>
              <p className="text-[13px] text-gray-500 mb-6">
                These credentials are required for e-Invoice fiscalization with the Federal Inland Revenue Service.
              </p>
              <div className="space-y-4">
                <Input
                  label="TIN (Tax Identification Number)" required
                  error={errors.tin?.message}
                  {...register('tin')}
                  placeholder="12345678-0001"
                  hint="Your FIRS Tax Identification Number in the format xxxxxxxx-xxxx. Find this on your FIRS registration certificate or the Taxpayer Portal."
                />
                <Input
                  label="Business ID" required
                  error={errors.businessId?.message}
                  {...register('businessId')}
                  placeholder="FIRS-BIZ-00123"
                  hint="Your unique business registration ID assigned by FIRS during e-Invoice enrollment. Check your FIRS onboarding email."
                />
                <Input
                  label="Service ID" required
                  error={errors.serviceId?.message}
                  {...register('serviceId')}
                  placeholder="SVC-001"
                  hint="The service code assigned to your business during FIRS e-Invoicing onboarding. Contact FIRS on 0800-FIRS-001 if unsure."
                />
              </div>
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-[10px] p-4 text-[13px] text-amber-800">
                <strong>Where to find these?</strong> Log in to the FIRS Taxpayer Portal and navigate to your business profile. Contact FIRS support on 0800-FIRS-001 if you need assistance.
              </div>
            </div>
          )}

          {/* ── Step 2: Credentials ── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-[8px] bg-green-50 flex items-center justify-center text-green-600">
                  <KeyRound size={16} />
                </div>
                <h2 className="text-[15px] font-bold text-gray-800">Admin Account Credentials</h2>
              </div>
              <p className="text-[13px] text-gray-500 mb-6">
                This will be the super-admin account for your organisation.
              </p>
              <div className="space-y-4">
                <Input
                  label="Email Address" type="email" required
                  error={errors.email?.message}
                  {...register('email')}
                  placeholder="admin@acme.ng"
                  hint="This becomes the super-admin email for your organisation. Use a company email, not a personal one."
                />
                <Input
                  label="Password" type="password" required
                  error={errors.password?.message}
                  {...register('password')}
                  placeholder="Minimum 8 characters"
                  hint="At least 8 characters. Use a mix of uppercase, lowercase, numbers, and special characters for a strong password."
                />
                <Input
                  label="Confirm Password" type="password" required
                  error={errors.retypePassword?.message}
                  {...register('retypePassword')}
                  placeholder="Re-enter your password"
                  hint="Re-type your password exactly as entered above. Both fields must match to complete registration."
                />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-5">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1 text-[14px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold px-6 py-3 rounded-[8px] text-[14px] hover:shadow-md hover:shadow-green-200 transition-all"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <Button type="submit" loading={isSubmitting} size="lg">
                Submit Registration
              </Button>
            )}
          </div>
        </form>

        <p className="text-center text-[13px] text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}