import Link from "next/link";
import Image from "next/image";

const AccountIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BudgetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const CalcIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2.5">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="16" y2="18" />
  </svg>
);

const pages = [
  { 
    href: "/account", 
    label: "Account", 
    tone: "from-amber-500 to-orange-500", 
    desc: "Manage your profile, saved recipes, and preferences in one place.",
    icon: <AccountIcon />
  },
  { 
    href: "/budget", 
    label: "Budget Meals", 
    tone: "from-green-500 to-lime-600", 
    desc: "Get AI-generated meal ideas tailored to your budget and pantry.",
    icon: <BudgetIcon />
  },
  { 
    href: "/calculator", 
    label: "Cost Calculator", 
    tone: "from-blue-500 to-cyan-600", 
    desc: "Instantly estimate the cost per serving for any recipe or meal plan.",
    icon: <CalcIcon />
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full flex-col gap-12 pb-20 text-slate-900 dark:text-slate-200">
      {/* Hero Section */}
      <section className="relative px-4 pt-12 sm:pt-24 overflow-hidden">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10 space-y-10 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-4 py-1.5 text-sm font-bold text-primary-700 dark:text-primary-300 ring-1 ring-inset ring-primary-700/20 dark:ring-primary-400/30 shadow-sm">
              ✨ Smart Kitchen Companion
            </div>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl text-balance text-slate-900 dark:text-white leading-[1.1]">
              Eat Well, <span className="text-primary-600 dark:text-primary-500">Spend Less.</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium text-slate-600 dark:text-slate-400 sm:text-xl leading-relaxed">
              The ultimate AI-powered tool to scan your pantry, generate budget-friendly recipes, and track your grocery spending—all in one beautiful place.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <Link
                href="/budget"
                className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-10 py-5 text-lg font-bold text-white shadow-[0_20px_50px_rgba(34,197,94,0.3)] transition-all hover:bg-primary-700 hover:scale-[1.05] active:scale-[0.98]"
              >
                Start Planning
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 px-10 py-5 text-lg font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02]"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center">
            {/* 3D Decorative elements */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-400/20 dark:bg-primary-900/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary-400/20 dark:bg-secondary-900/30 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative group w-full max-w-md aspect-square overflow-visible">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/30 to-secondary-500/30 rounded-[3rem] blur-2xl transition-all group-hover:blur-3xl" />
               <div className="relative h-full w-full rounded-[2.5rem] border border-white/40 dark:border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] transition-all duration-500 group-hover:scale-[1.02] overflow-hidden">
                 <Image
                   src="/hero-food.png"
                   alt="Healthy budget meal"
                   fill
                   className="object-cover"
                   priority
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
               </div>

               {/* Floating stat card */}
               <div className="absolute -bottom-6 -right-6 glass-card p-5 rounded-3xl border border-white/60 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl shadow-2xl flex items-center gap-5 animate-bounce-slow z-20">
                 <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/40 flex-shrink-0">
                   <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="3.5">
                     <path d="M20 6L9 17L4 12" />
                   </svg>
                 </div>
                 <div className="min-w-0">
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Avg. Monthly Savings</p>
                   <p className="text-2xl font-black text-slate-900 dark:text-white">$120.00</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20 space-y-5">
            <h2 className="text-4xl font-black sm:text-5xl text-slate-900 dark:text-white">Built for your kitchen.</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">Everything you need to master your grocery budget and discover delicious recipes with ingredients you already have.</p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group relative flex flex-col items-start rounded-[2rem] border border-white dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-10 shadow-sm transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-200 dark:hover:border-primary-800"
              >
                <div className={`mb-8 rounded-2xl bg-gradient-to-br ${page.tone} p-4 text-white shadow-xl shadow-current/20 transition-transform duration-500 group-hover:rotate-6`}>
                  {page.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{page.label}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-8 flex-grow">{page.desc}</p>
                <div className="flex items-center text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                  <span>Explore</span>
                  <svg className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7M3 12h18" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner with 3D Effect */}
      <section className="px-4 py-24 [perspective:2000px]">
        <div className="group relative mx-auto max-w-5xl rounded-[3.5rem] p-12 sm:p-20 text-center border border-white/30 dark:border-slate-700 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white shadow-[0_50px_100px_-20px_rgba(22,163,74,0.5)] transition-all duration-700 [transform-style:preserve-3d] hover:rotate-x-3 hover:rotate-y-[-2deg] hover:shadow-[0_70px_120px_-20px_rgba(22,163,74,0.6)]">
          
          {/* 3D Decorative Background Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full pointer-events-none [transform:translateZ(-50px)]" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-black/20 blur-[120px] rounded-full pointer-events-none [transform:translateZ(-50px)]" />
          
          {/* Floating 3D "Bubbles" */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl animate-bounce-slow [transform:translateZ(50px)] hidden sm:block" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary-400/20 backdrop-blur-lg rounded-full border border-white/10 shadow-2xl animate-pulse [transform:translateZ(100px)] hidden lg:block" />
          
          <div className="relative z-10 [transform:translateZ(60px)]">
            <h2 className="text-4xl sm:text-6xl font-black mb-8 leading-tight tracking-tight drop-shadow-2xl">
              Join 5,000+ home cooks <br className="hidden sm:block" /> saving daily.
            </h2>
            <p className="text-primary-50 mb-12 max-w-2xl mx-auto text-xl font-medium opacity-90 leading-relaxed drop-shadow-lg">
              Start your journey to smarter, more sustainable meal planning today. <br className="hidden sm:block" /> No credit card required.
            </p>
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-[2rem] bg-white px-14 py-6 text-2xl font-black text-primary-700 shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all hover:bg-slate-50 hover:scale-110 active:scale-95 hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)]"
            >
              Create Your Account
            </Link>
          </div>

          {/* Glossy Overlay */}
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none opacity-50" />
        </div>
      </section>
    </main>
  );
}
