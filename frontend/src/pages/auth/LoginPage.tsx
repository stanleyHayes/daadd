import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, Zap } from 'lucide-react';
import { useLogin } from '@/hooks/useAuth';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const buildSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('auth.errors.emailInvalid')),
  password: z.string().min(6, t('auth.errors.passwordMin6')),
});

type LoginForm = z.infer<ReturnType<typeof buildSchema>>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(buildSchema(t)) });

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      toast.success(t('auth.login.successToast'));
      navigate('/dashboard');
    } catch {
      toast.error(t('auth.login.errorToast'));
    }
  };

  return (
    <div className="auth-page flex min-h-screen bg-[#f7f5ef] dark:bg-slate-950">
      <AuthBrandPanel title={t('auth.login.panelTitle')} blurb={t('auth.login.panelBlurb')} />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-16 sm:px-8 lg:px-10">
        <div className="marketing-grid pointer-events-none absolute inset-0 opacity-50 dark:opacity-15" />
        <div className="absolute right-5 top-5 z-10"><ThemeToggle /></div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-[470px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-primary-900 text-white dark:bg-secondary-400 dark:text-primary-900"><Zap className="h-5 w-5 fill-current" /></span><span className="font-black tracking-[-0.04em] text-primary-900 dark:text-white">SmartAdDeals</span></Link>
            <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><ArrowLeft className="h-3.5 w-3.5" /> Home</Link>
          </div>

          <div className="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_25px_80px_rgba(7,20,49,0.10)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 sm:p-9">
            <div className="mb-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Secure sign in</div>
              <h2 className="text-3xl font-black tracking-[-0.045em] text-primary-900 dark:text-white sm:text-4xl">{t('auth.login.title')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('auth.login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AuthField label={t('auth.login.email')} error={errors.email?.message}>
                <Mail className="auth-field-icon" />
                <input type="email" autoComplete="email" placeholder={t('auth.login.emailPlaceholder')} className="auth-field-input" {...register('email')} />
              </AuthField>

              <AuthField label={t('auth.login.password')} error={errors.password?.message} action={<Link to="/forgot-password" className="text-xs font-bold text-primary-700 transition hover:text-secondary-700 dark:text-secondary-300">{t('auth.login.forgotPassword')}</Link>}>
                <Lock className="auth-field-icon" />
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder={t('auth.login.passwordPlaceholder')} className="auth-field-input pr-12!" {...register('password')} />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((show) => !show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-primary-900 dark:hover:text-white">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </AuthField>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400"><input type="checkbox" id="remember" className="h-4 w-4 rounded border-slate-300 text-primary-900 focus:ring-secondary-400" /><span>{t('auth.login.remember')}</span></label>

              <button type="submit" disabled={loginMutation.isPending} className="group flex h-13 w-full items-center justify-center gap-3 rounded-full bg-primary-900 px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,27,80,0.20)] transition hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-secondary-400 dark:text-primary-900 dark:hover:bg-secondary-300">
                {loginMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>{t('auth.login.submit')} <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform group-hover:translate-x-1"><ArrowRight className="h-4 w-4" /></span></>}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">New here?</span><span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /></div>
            <Link to="/register" className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-primary-900 transition hover:border-primary-900 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-secondary-400">{t('auth.login.createAccount')} <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-slate-400"><Check className="h-3.5 w-3.5 text-emerald-500" /> Encrypted session · Protected access</p>
        </motion.div>
      </main>
    </div>
  );
}

function AuthField({ label, error, action, children }: { label: string; error?: string; action?: ReactNode; children: ReactNode }) {
  return <div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">{label}</label>{action}</div><div className="relative">{children}</div>{error && <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>}</div>;
}
