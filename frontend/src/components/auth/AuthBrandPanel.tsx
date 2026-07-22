import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Eye, Gift, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface AuthBrandPanelProps {
  title: string;
  blurb: string;
  variant?: 'login' | 'register';
}

export function AuthBrandPanel({ title, blurb, variant = 'login' }: AuthBrandPanelProps) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#07142f] text-white lg:flex lg:w-[52%] xl:w-[56%]">
      <div className="auth-panel-grid absolute inset-0 opacity-60" />
      <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-secondary-400/15 blur-[100px]" />
      <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-[110px]" />

      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-[15px] bg-white">
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-secondary-400" />
              <Zap className="relative h-5 w-5 fill-primary-900 text-primary-900" />
            </span>
            <span className="text-xl font-black tracking-[-0.045em]">SmartAd<span className="text-secondary-400">Deals</span></span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
        </div>

        <div className="grid items-end gap-10 xl:grid-cols-[0.9fr_1.1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <p className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-secondary-300"><Sparkles className="h-3.5 w-3.5" /> Your attention, valued</p>
            <h1 className="max-w-lg text-4xl font-black leading-[0.95] tracking-[-0.055em] xl:text-6xl">{title}</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55 xl:text-lg">{blurb}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.65 }} className="hidden xl:block">
            {variant === 'login' ? <LoginVisual /> : <RegisterVisual />}
          </motion.div>
        </div>

        <div className="flex items-center gap-6 border-t border-white/10 pt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
          <span>Secure access</span><span className="h-1 w-1 rounded-full bg-secondary-400" /><span>Real-time intelligence</span><span className="h-1 w-1 rounded-full bg-secondary-400" /><span>Human-centred rewards</span>
        </div>
      </div>
    </aside>
  );
}

function LoginVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[330px] rotate-2 rounded-[30px] border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Campaign pulse</span><span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[8px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Live</span></div>
      <div className="mt-5 rounded-[22px] bg-secondary-400 p-5 text-primary-900"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider opacity-55">Engagement today</p><p className="mt-1 text-3xl font-black tracking-[-0.05em]">84.6%</p></div><TrendingUp className="h-5 w-5" /></div><div className="mt-8 flex h-16 items-end gap-1.5">{[42, 58, 49, 70, 62, 84, 74, 92, 86].map((height, index) => <span key={index} className="flex-1 rounded-t-sm bg-primary-900/80" style={{ height: `${height}%` }} />)}</div></div>
      <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/[0.07] p-4"><Eye className="h-4 w-4 text-blue-300" /><p className="mt-4 text-lg font-black">24.8k</p><p className="text-[8px] uppercase tracking-wider text-white/35">Views</p></div><div className="rounded-2xl bg-white/[0.07] p-4"><BarChart3 className="h-4 w-4 text-secondary-300" /><p className="mt-4 text-lg font-black">3.8×</p><p className="text-[8px] uppercase tracking-wider text-white/35">Return</p></div></div>
    </div>
  );
}

function RegisterVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[330px] -rotate-2 rounded-[30px] border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm">
      <div className="rounded-[24px] bg-[#dbe9e5] p-5 text-primary-900"><div className="flex items-center justify-between"><span className="rounded-full bg-white/70 px-3 py-1 text-[8px] font-black uppercase tracking-wider">Reward received</span><Gift className="h-5 w-5 text-emerald-700" /></div><p className="mt-9 text-4xl font-black tracking-[-0.06em]">+ GHS 2.50</p><p className="mt-2 text-xs text-primary-900/55">Your time created value.</p></div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary-400 p-4 text-primary-900"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-900 text-white"><Zap className="h-4 w-4 fill-current" /></span><div><p className="text-xs font-black">Welcome reward</p><p className="text-[9px] opacity-55">Ready after your first ad</p></div></div>
    </div>
  );
}
