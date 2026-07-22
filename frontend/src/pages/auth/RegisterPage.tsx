import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useRegister } from '@/hooks/useAuth';
import { User, Mail, Lock, Eye, EyeOff, Zap, ArrowRight, Megaphone, Gift, Check } from 'lucide-react';
import { WatermarkBanner, WatermarkPattern } from '@/components/ui/Watermark';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Validation messages are resolved through i18next at render time, so the
// schema is built inside the component rather than at module scope.
const buildSchema = (t: (k: string) => string) =>
 z
 .object({
 name: z.string().min(2, t('auth.errors.nameMin2')),
 email: z.string().email(t('auth.errors.emailInvalid')),
 password: z.string().min(8, t('auth.errors.passwordMin8')),
 confirmPassword: z.string(),
 role: z.enum(['advertiser', 'end_user'], { message: t('auth.errors.roleRequired') }),
 terms: z.boolean().refine((val) => val === true, t('auth.errors.termsRequired')),
 })
 .refine((data) => data.password === data.confirmPassword, {
 message: t('auth.errors.passwordsMismatch'),
 path: ['confirmPassword'],
 });

type RegisterForm = z.infer<ReturnType<typeof buildSchema>>;

const PASSWORD_CHECKS = [
 { key: 'length', test: (p: string) => p.length >= 8 },
 { key: 'number', test: (p: string) => /\d/.test(p) },
 { key: 'uppercase', test: (p: string) => /[A-Z]/.test(p) },
] as const;

export function RegisterPage() {
 const { t } = useTranslation();
 const navigate = useNavigate();
 const registerMutation = useRegister();
 const [showPassword, setShowPassword] = useState(false);

 const {
 register,
 handleSubmit,
 control,
 setValue,
 formState: { errors },
 } = useForm<RegisterForm>({
 resolver: zodResolver(buildSchema(t)),
 defaultValues: { role: 'advertiser', terms: false },
 });

 const selectedRole = useWatch({ control, name: 'role' });
 const password = useWatch({ control, name: 'password' }) || '';

 const onSubmit = async (data: RegisterForm) => {
 try {
 await registerMutation.mutateAsync({
 name: data.name,
 email: data.email,
 password: data.password,
 role: data.role,
 });
 toast.success(t('auth.register.successToast'));
 navigate('/login');
 } catch {
 toast.error(t('auth.register.errorToast'));
 }
 };

 return (
 <div className="min-h-screen flex">
 {/* Left Panel - Branding */}
 <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-primary-700">
 <WatermarkPattern className="opacity-[0.03] dark:opacity-[0.02] text-white" />
 <WatermarkBanner />
 <WatermarkBanner align="left" className="opacity-50" />
 <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.5 }}
 >
 <Link to="/" className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
 <Zap className="h-6 w-6 text-white" />
 </div>
 <span className="text-xl font-bold tracking-tight">SmartAdDeals</span>
 </Link>
 </motion.div>

 <div>
 <motion.h1
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.1 }}
 className="text-4xl font-extrabold leading-tight mb-4"
 >
 {t('auth.register.panelTitle')}
 </motion.h1>
 <motion.p
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="text-primary-100 text-lg max-w-sm"
 >
 {t('auth.register.panelBlurb')}
 </motion.p>
 </div>

 <div />
 </div>
 </div>

 {/* Right Panel - Register Form */}
 <div className="relative flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-6 py-8 overflow-y-auto">
 <WatermarkPattern className="opacity-[0.02] dark:opacity-[0.015] text-primary-100 dark:text-slate-700" />
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="w-full max-w-[460px]"
 >
 {/* Mobile logo */}
 <div className="lg:hidden text-center mb-6">
 <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-700 mb-3 shadow-lg shadow-primary-500/25">
 <Zap className="h-8 w-8 text-white" />
 </div>
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SmartAdDeals</h1>
 </div>

 <div className="mb-6">
 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.register.title')}</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-1">{t('auth.register.subtitle')}</p>
 </div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 {/* Role selection */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('auth.register.roleLabel')}</label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setValue('role', 'advertiser')}
 className={cn(
 'relative p-4 rounded-xl border-2 text-left transition-all group',
 selectedRole === 'advertiser'
 ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20'
 : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
 )}
 >
 {selectedRole === 'advertiser' && (
 <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
 <Check className="h-3 w-3 text-white" />
 </div>
 )}
 <Megaphone className={cn('h-6 w-6 mb-2', selectedRole === 'advertiser' ? 'text-primary-600' : 'text-gray-400 dark:text-slate-500')} />
 <p className={cn('font-semibold text-sm', selectedRole === 'advertiser' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-slate-300')}>{t('auth.register.roleAdvertiser')}</p>
 <p className="text-xs mt-0.5 text-gray-500 dark:text-slate-400">{t('auth.register.roleAdvertiserDesc')}</p>
 </button>
 <button
 type="button"
 onClick={() => setValue('role', 'end_user')}
 className={cn(
 'relative p-4 rounded-xl border-2 text-left transition-all group',
 selectedRole === 'end_user'
 ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 ring-2 ring-accent-500/20'
 : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
 )}
 >
 {selectedRole === 'end_user' && (
 <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
 <Check className="h-3 w-3 text-white" />
 </div>
 )}
 <Gift className={cn('h-6 w-6 mb-2', selectedRole === 'end_user' ? 'text-accent-600' : 'text-gray-400 dark:text-slate-500')} />
 <p className={cn('font-semibold text-sm', selectedRole === 'end_user' ? 'text-accent-700 dark:text-accent-400' : 'text-gray-700 dark:text-slate-300')}>{t('auth.register.roleUser')}</p>
 <p className="text-xs mt-0.5 text-gray-500 dark:text-slate-400">{t('auth.register.roleUserDesc')}</p>
 </button>
 </div>
 {errors.role && <p className="mt-1.5 text-xs text-danger-600">{errors.role.message}</p>}
 </div>

 {/* Name */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{t('auth.register.name')}</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type="text"
 placeholder={t('auth.register.namePlaceholder')}
 className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
 {...register('name')}
 />
 </div>
 {errors.name && <p className="mt-1.5 text-xs text-danger-600">{errors.name.message}</p>}
 </div>

 {/* Email */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{t('auth.register.email')}</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type="email"
 placeholder={t('auth.register.emailPlaceholder')}
 className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
 {...register('email')}
 />
 </div>
 {errors.email && <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>}
 </div>

 {/* Password */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{t('auth.register.password')}</label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type={showPassword ? 'text' : 'password'}
 placeholder={t('auth.register.passwordPlaceholder')}
 className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-10 py-3 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
 {...register('password')}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
 >
 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
 </button>
 </div>
 {errors.password && <p className="mt-1.5 text-xs text-danger-600">{errors.password.message}</p>}
 {password.length > 0 && (
 <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4 mt-2">
 {PASSWORD_CHECKS.map((check) => (
 <div key={check.key} className="flex items-center gap-1.5">
 <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center', check.test(password) ? 'bg-accent-500' : 'bg-gray-200 dark:bg-slate-600')}>
 {check.test(password) && <Check className="h-2.5 w-2.5 text-white" />}
 </div>
 <span className={cn('text-xs', check.test(password) ? 'text-accent-600 dark:text-accent-400' : 'text-gray-400 dark:text-slate-500')}>{t(`auth.register.checks.${check.key}`)}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Confirm Password */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">{t('auth.register.confirmPassword')}</label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type="password"
 placeholder={t('auth.register.confirmPasswordPlaceholder')}
 className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
 {...register('confirmPassword')}
 />
 </div>
 {errors.confirmPassword && <p className="mt-1.5 text-xs text-danger-600">{errors.confirmPassword.message}</p>}
 </div>

 {/* Terms */}
 <label className="flex items-start gap-2.5 pt-1">
 <input
 type="checkbox"
 className="rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 mt-0.5 dark:bg-slate-700"
 {...register('terms')}
 />
 <span className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
 {t('auth.register.termsPrefix')}{' '}
 <Link to="/terms" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium">{t('auth.register.termsOfService')}</Link>
 {' '}{t('auth.register.termsAnd')}{' '}
 <Link to="/privacy" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium">{t('auth.register.privacyPolicy')}</Link>
 </span>
 </label>
 {errors.terms && <p className="text-xs text-danger-600">{errors.terms.message}</p>}

 {/* Submit */}
 <button
 type="submit"
 disabled={registerMutation.isPending}
 className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-primary-900 font-medium py-3 px-4 text-sm shadow-lg shadow-secondary-500/25 hover:shadow-secondary-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
 >
 {registerMutation.isPending ? (
 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>{t('auth.register.submit')} <ArrowRight className="h-4 w-4" /></>
 )}
 </button>
 </form>

 <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
 {t('auth.register.haveAccount')}{' '}
 <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-semibold">
 {t('auth.register.signIn')}
 </Link>
 </p>
 </motion.div>
 </div>
 </div>
 );
}
