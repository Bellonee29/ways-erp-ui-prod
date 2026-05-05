import Link from 'next/link'
import {
  FileText, Users, BarChart3, Package, Building2,
  CheckCircle2, ArrowRight, Shield, Zap, Globe,
  TrendingUp, CreditCard, Star, Receipt, BookOpen,
  Bell, Lock, LayoutDashboard,
} from 'lucide-react'

/* ─── data ─────────────────────────────────────────────────────────── */

const NAV_LINKS = ['Features', 'How it works', 'Pricing']

const STATS = [
  { value: '500+', label: 'Businesses onboarded' },
  { value: '₦2B+', label: 'Invoices processed'   },
  { value: '99.9%', label: 'Uptime SLA'           },
  { value: '24/7',  label: 'Support available'    },
]

const FEATURES = [
  {
    icon: Receipt,
    title: 'FIRS e-Invoicing',
    desc: 'Issue FIRS-compliant invoices with automatic IRN generation, QR codes, and real-time fiscalization — no manual filing.',
    badge: 'FIRS Certified',
    color: 'green',
  },
  {
    icon: TrendingUp,
    title: 'CRM & Sales',
    desc: 'Manage leads through a visual kanban pipeline. Log activities, track deals, and never miss a follow-up.',
    badge: null,
    color: 'blue',
  },
  {
    icon: Package,
    title: 'Inventory Control',
    desc: 'Track products across multiple warehouses, set reorder alerts, and manage purchase and sales orders end-to-end.',
    badge: null,
    color: 'amber',
  },
  {
    icon: BookOpen,
    title: 'Full Accounting',
    desc: 'Chart of accounts, journal entries, bank reconciliation, and automated financial reports — P&L, balance sheet.',
    badge: null,
    color: 'purple',
  },
  {
    icon: Users,
    title: 'Team Management',
    desc: 'Role-based access control across Admin, Manager, and Employee levels with granular module permissions.',
    badge: null,
    color: 'rose',
  },
  {
    icon: LayoutDashboard,
    title: 'Analytics Dashboard',
    desc: 'Real-time revenue charts, invoice summaries, inventory snapshots, and KPI cards — always know your numbers.',
    badge: null,
    color: 'cyan',
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100'  },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100'},
  rose:   { bg: 'bg-rose-50',   text: 'text-rose-600',   border: 'border-rose-100'  },
  cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-600',   border: 'border-cyan-100'  },
}

const STEPS = [
  {
    num: 1,
    title: 'Register your organisation',
    desc: 'Please contact the administrator at bellowajiuo@gmail.com or +2349039156872 to create your account with your company details and FIRS credentials. This process takes under five minutes.',
    // action: { label: 'Register now', href: '/register' },
  },
  {
    num: 2,
    title: 'Await admin approval',
    desc: 'Our team verifies your FIRS TIN and activates your tenant — usually within 24 hours.',
    action: null,
  },
  {
    num: 3,
    title: 'Set up your workspace',
    desc: 'Add team members, configure roles, import products and customers.',
    action: null,
  },
  {
    num: 4,
    title: 'Go live',
    desc: 'Issue your first FIRS-fiscalised invoice and start running your business on WaysERP.',
    action: null,
  },
]

const TESTIMONIALS = [
  {
    name: 'Adaeze Okonkwo',
    role: 'CFO, Meridian Supplies Ltd',
    avatar: 'AO',
    color: 'bg-green-600',
    quote: 'WaysERP cut our invoicing time by 70%. FIRS compliance used to take us a full day every month — now it&apos;s automatic.',
  },
  {
    name: 'Emeka Nwosu',
    role: 'MD, TechBridge Solutions',
    avatar: 'EN',
    color: 'bg-blue-600',
    quote: 'The multi-tenant setup is exactly what we needed for our holding group. Each subsidiary is isolated but we see everything centrally.',
  },
  {
    name: 'Fatima Abdullahi',
    role: 'Director, Sahara Trade Co.',
    avatar: 'FA',
    color: 'bg-purple-600',
    quote: 'Inventory, CRM, and accounting in one place. No more switching between 4 different tools. Our team adopted it in days.',
  },
]

const TRUST_ITEMS = [
  { icon: Shield,   label: 'Bank-grade encryption' },
  { icon: Globe,    label: 'FIRS certified platform' },
  { icon: Zap,      label: 'Real-time fiscalization'  },
  { icon: Bell,     label: 'Instant notifications'    },
  { icon: Lock,     label: 'Role-based access'        },
  { icon: CreditCard, label: 'Multi-currency support' },
]

/* ─── component ─────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>

      {/* ══ NAVBAR ══ */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-[64px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm">
              W
            </div>
            <span className="font-bold text-gray-900 text-[18px] tracking-tight">WaysERP</span>
          </div>
          {/* Links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`}
                className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
                {l}
              </a>
            ))}
          </nav>
          {/* CTA */}
          <div className="flex items-center gap-3">
            {/* <Link href="/login"
              className="text-[14px] font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors">
              Sign in
            </Link> */}
            <Link href="/login"
              className="text-[14px] font-bold text-white bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-[8px] transition-colors shadow-sm">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden bg-white pt-20 pb-16 px-6">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 right-0 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(220,252,231,0.5) 0%, transparent 70%)' }} />
          <div className="absolute top-40 -left-24 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(187,247,208,0.3) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[12px] font-bold px-4 py-1.5 rounded-full tracking-wide uppercase">
              <Zap size={11} fill="currentColor" /> FIRS-certified e-Invoicing
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center text-[52px] md:text-[68px] font-extrabold text-gray-900 leading-[1.08] tracking-tight max-w-4xl mx-auto">
            Run your business,{' '}
            <span className="relative">
              <span className="relative z-10 text-green-600">simplified</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 8 Q75 2 150 8 Q225 14 298 8" stroke="#86efac" strokeWidth="4" strokeLinecap="round" fill="none"/>
              </svg>
            </span>
          </h1>

          <p className="text-center text-[18px] text-gray-500 leading-relaxed max-w-2xl mx-auto mt-7">
            The all-in-one ERP for Nigerian businesses — invoice, manage inventory, close deals, and handle accounting with built-in FIRS fiscalization.
          </p>

          {/* Buttons */}
          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-[10px] text-[16px] transition-all shadow-lg shadow-green-200">
              Start for free <ArrowRight size={18} />
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-green-300 text-gray-700 font-bold px-8 py-4 rounded-[10px] text-[16px] transition-all">
              Sign in to dashboard
            </Link>
          </div>
          <p className="text-center text-[13px] text-gray-400 mt-4">
            No credit card required · Setup in 5 minutes · Nigerian business ready
          </p> */}

          {/* Dashboard screenshot mock */}
          <div className="mt-16 rounded-2xl overflow-hidden border border-gray-200 shadow-2xl" style={{ boxShadow: '0 32px 80px -12px rgba(0,0,0,0.12)' }}>
            {/* Browser bar */}
            <div className="bg-gray-100 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 bg-white/80 border border-gray-200 rounded-md px-3 py-1 text-[12px] text-gray-400 mx-2">
                app.wayserp.com/dashboard
              </div>
            </div>
            {/* App chrome */}
            <div className="flex bg-white" style={{ minHeight: 340 }}>
              {/* Sidebar */}
              <div className="w-[200px] bg-gray-900 flex flex-col py-5 px-3 gap-1 flex-shrink-0">
                <div className="flex items-center gap-2 px-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs">W</div>
                  <span className="text-white font-bold text-[13px]">WaysERP</span>
                </div>
                {[
                  { icon: LayoutDashboard, label: 'Dashboard', active: true },
                  { icon: Receipt,          label: 'Invoices',  active: false },
                  { icon: TrendingUp,       label: 'CRM',       active: false },
                  { icon: Package,          label: 'Inventory', active: false },
                  { icon: BookOpen,         label: 'Accounting',active: false },
                  { icon: Users,            label: 'Users',     active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div key={label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${active ? 'bg-green-600 text-white' : 'text-gray-400'}`}>
                    <Icon size={14} /> {label}
                  </div>
                ))}
              </div>
              {/* Main */}
              <div className="flex-1 bg-gray-50 p-5">
                <p className="text-[12px] font-bold text-gray-900 mb-4">Dashboard Overview</p>
                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total Revenue', val: '₦4.8M', delta: '+12.4%', up: true },
                    { label: 'Invoices',       val: '142',    delta: '+8',     up: true },
                    { label: 'Customers',      val: '89',     delta: '+5',     up: true },
                    { label: 'Pending',        val: '₦890K',  delta: '-3.1%',  up: false },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
                      <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                      <p className="text-[18px] font-extrabold text-gray-900 mt-0.5">{s.val}</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${s.up ? 'text-green-600' : 'text-amber-600'}`}>{s.delta}</p>
                    </div>
                  ))}
                </div>
                {/* Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-[11px] font-semibold text-gray-700 mb-3">Revenue — Last 12 months</p>
                  <div className="flex items-end gap-1.5 h-16">
                    {[35, 55, 40, 70, 50, 80, 65, 75, 55, 85, 70, 95].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm transition-all"
                        style={{ height: `${h}%`, background: i === 11 ? '#16a34a' : '#bbf7d0' }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'].map((m) => (
                      <span key={m} className="text-[9px] text-gray-300">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="border-y border-gray-100 bg-gray-50 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-[36px] font-extrabold text-green-600 leading-none">{value}</p>
              <p className="text-[13px] text-gray-500 mt-2 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-extrabold text-green-600 uppercase tracking-[0.15em] mb-3">Platform features</p>
            <h2 className="text-[40px] font-extrabold text-gray-900 leading-tight">
              Everything your business needs
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-[16px] leading-relaxed">
              From invoicing to inventory — one login, one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, badge, color }) => {
              const c = COLOR_MAP[color]
              return (
                <div key={title}
                  className={`relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group`}>
                  {badge && (
                    <span className="absolute top-4 right-4 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-[12px] ${c.bg} ${c.border} border flex items-center justify-center ${c.text} mb-5`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ══ */}
      <section className="bg-green-700 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-green-100">
                  <Icon size={18} />
                </div>
                <p className="text-[12px] font-semibold text-green-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-extrabold text-green-600 uppercase tracking-[0.15em] mb-3">Simple onboarding</p>
            <h2 className="text-[40px] font-extrabold text-gray-900 leading-tight">
              Up and running in 4 steps
            </h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-gray-200 hidden md:block" />

            <div className="space-y-5">
              {STEPS.map(({ num, title, desc, action }) => (
                <div key={num} className="relative flex gap-5 bg-white rounded-2xl border border-gray-200 p-6 hover:border-green-200 transition-colors">
                  <div className="w-[56px] h-[56px] rounded-full bg-green-600 flex items-center justify-center text-white font-extrabold text-[18px] flex-shrink-0 shadow-md shadow-green-200 relative z-10">
                    {num}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
                    <p className="text-[13.5px] text-gray-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                  {action && (
                    <Link href={action.href}
                      className="self-center flex-shrink-0 inline-flex items-center gap-1.5 bg-green-600 text-white text-[13px] font-bold px-4 py-2 rounded-[8px] hover:bg-green-700 transition-colors">
                      {action.label} <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-extrabold text-green-600 uppercase tracking-[0.15em] mb-3">Customer stories</p>
            <h2 className="text-[40px] font-extrabold text-gray-900 leading-tight">
              Trusted by Nigerian businesses
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, avatar, color, quote }) => (
              <div key={name} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[13.5px] text-gray-600 leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{name}</p>
                    <p className="text-[12px] text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING CTA ══ */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[12px] font-extrabold text-green-600 uppercase tracking-[0.15em] mb-3">Get started today</p>
          <h2 className="text-[40px] font-extrabold text-gray-900 leading-tight">
            Free to register, powerful from day one
          </h2>
          <p className="text-gray-500 mt-4 text-[16px] leading-relaxed max-w-xl mx-auto">
            Register your organisation, get approved, and start running your full ERP — invoicing, CRM, inventory, and accounting — from a single dashboard.
          </p>

          <div className="mt-12 bg-white border-2 border-green-100 rounded-3xl p-8 shadow-xl shadow-green-50">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-[13px] font-bold px-4 py-1.5 rounded-full mb-5">
              <Building2 size={14} /> Organisation plan
            </div>
            <p className="text-[48px] font-extrabold text-gray-900 leading-none">
              Free<span className="text-[18px] font-normal text-gray-400"> to get started</span>
            </p>
            <p className="text-gray-500 text-[14px] mt-3 mb-7">Contact us for enterprise pricing with advanced features</p>

            <div className="grid sm:grid-cols-2 gap-3 mb-8 text-left">
              {[
                'FIRS-compliant e-Invoicing',
                'Unlimited team members',
                'CRM & sales pipeline',
                'Inventory management',
                'Full accounting suite',
                'Real-time analytics',
                'Multi-warehouse support',
                'Role-based permissions',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-[13.5px] text-gray-700">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <Link href="/login"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-[10px] text-[16px] transition-all shadow-lg shadow-green-200 w-full justify-center">
              Sign in <ArrowRight size={18} />
            </Link>
            {/* <p className="text-[12px] text-gray-400 mt-3">Already registered? <Link href="/login" className="text-green-600 font-semibold hover:underline">Sign in →</Link></p> */}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-700 via-green-600 to-green-500 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-white/5" />
            <div className="relative">
              <h2 className="text-[34px] font-extrabold text-white leading-tight">
                Ready to modernise your business operations?
              </h2>
              <p className="text-green-100 mt-4 text-[16px] max-w-xl mx-auto leading-relaxed">
                Join hundreds of Nigerian businesses running on WaysERP. FIRS-certified, locally built, and designed for growth.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login"
                  className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-[10px] text-[15px] hover:shadow-2xl transition-all">
                  Sign in <ArrowRight size={18} />
                </Link>
                {/* <Link href="/login"
                  className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-[10px] text-[15px] hover:bg-white/10 transition-all">
                  Sign in
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white font-extrabold text-sm">W</div>
                <span className="font-bold text-gray-900 text-[16px]">WaysERP</span>
              </div>
              <p className="text-[13px] text-gray-400 leading-relaxed">
                The all-in-one ERP platform built for Nigerian businesses. FIRS-certified and compliant.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-[13px]">
              <div>
                <p className="font-bold text-gray-700 mb-3">Platform</p>
                <div className="space-y-2 text-gray-400">
                  <a href="#features" className="block hover:text-gray-700 transition-colors">Features</a>
                  <a href="#how-it-works" className="block hover:text-gray-700 transition-colors">How it works</a>
                  <a href="#pricing" className="block hover:text-gray-700 transition-colors">Pricing</a>
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-700 mb-3">Account</p>
                <div className="space-y-2 text-gray-400">
                  <Link href="/login" className="block hover:text-gray-700 transition-colors">Sign in</Link>
                  <Link href="/register" className="block hover:text-gray-700 transition-colors">Register</Link>
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-700 mb-3">Compliance</p>
                <div className="space-y-2 text-gray-400">
                  <p>FIRS e-Invoice</p>
                  <p>Data Privacy</p>
                  <p>ISO 27001</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-gray-400">
            <p>© {new Date().getFullYear()} WaysERP · All rights reserved</p>
            <p>Built with ❤ for Nigerian businesses · FIRS Certified Platform</p>
          </div>
        </div>
      </footer>
    </div>
  )
}