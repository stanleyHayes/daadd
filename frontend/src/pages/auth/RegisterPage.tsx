import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRegister } from '@/hooks/useAuth';
import { User, Mail, Lock, Eye, EyeOff, Zap, ArrowRight, Megaphone, Gift, Check } from 'lucide-react';
import { WatermarkBanner, WatermarkPattern } from '@/components/ui/Watermark';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const registerSchema = z
 .object({
 name: z.string().min(2, 'Name must be at least 2 characters'),
 email: z.string().email('Please enter a valid email'),
 password: z.string().min(8, 'Password must be at least 8 characters'),
 confirmPassword: z.string(),
 role: z.enum(['advertiser', 'end_user'], { message: 'Please select a role' }),
 terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
 })
 .refine((data) => data.password === data.confirmPassword, {
 message: 'Passwords do not match',
 path: ['confirmPassword'],
 });

type RegisterForm = z.infer<typeof registerSchema>;

const passwordChecks = [
 { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
 { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
 { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
];

export function RegisterPage() {
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
 resolver: zodResolver(registerSchema),
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
 toast.success('Account created! Please sign in.');
 navigate('/login');
 } catch {
 toast.error('Registration failed. Email may already be in use.');
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
 Start Your
 <br />
 <span className="text-secondary-300">Ad Journey Today</span>
 </motion.h1>
 <motion.p
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="text-primary-100 text-lg max-w-sm mb-10"
 >
 Join thousands of advertisers and users on the most intelligent AdTech platform.
 </motion.p>

 {/* Testimonial */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.4 }}
 className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm"
 >
 <div className="flex gap-1 mb-3">
 {[...Array(5)].map((_, i) => (
 <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
 ))}
 </div>
 <p className="text-sm text-white/90 italic leading-relaxed">
 "SmartAdDeals's AI optimization increased our CTR by 340% in the first month. The Ad Journey Storyteller is unlike anything else in the market."
 </p>
 <div className="flex items-center gap-3 mt-4">
 <div className="w-9 h-9 rounded-full bg-secondary-500/20 flex items-center justify-center text-xs font-bold text-white">SK</div>
 <div>
 <p className="text-sm font-semibold">Sarah Kim</p>
 <p className="text-xs text-primary-200">Marketing Director, TechCorp</p>
 </div>
 </div>
 </motion.div>
 </div>

 <motion.p
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.5, delay: 0.6 }}
 className="text-primary-200 text-xs"
 >
 Trusted by 2,000+ companies worldwide
 </motion.p>
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
 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-1">Get started in less than a minute</p>
 </div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 {/* Role selection */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">I want to...</label>
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
 <p className={cn('font-semibold text-sm', selectedRole === 'advertiser' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-slate-300')}>Run Ads</p>
 <p className="text-xs mt-0.5 text-gray-500 dark:text-slate-400">Create & optimize campaigns</p>
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
 <p className={cn('font-semibold text-sm', selectedRole === 'end_user' ? 'text-accent-700 dark:text-accent-400' : 'text-gray-700 dark:text-slate-300')}>Earn Rewards</p>
 <p className="text-xs mt-0.5 text-gray-500 dark:text-slate-400">Browse ads & get paid</p>
 </button>
 </div>
 {errors.role && <p className="mt-1.5 text-xs text-danger-600">{errors.role.message}</p>}
 </div>

 {/* Name */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full name</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type="text"
 placeholder="John Doe"
 className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
 {...register('name')}
 />
 </div>
 {errors.name && <p className="mt-1.5 text-xs text-danger-600">{errors.name.message}</p>}
 </div>

 {/* Email */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address</label>
 <div className="relative">
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type="email"
 placeholder="you@company.com"
 className="block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-3 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
 {...register('email')}
 />
 </div>
 {errors.email && <p className="mt-1.5 text-xs text-danger-600">{errors.email.message}</p>}
 </div>

 {/* Password */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type={showPassword ? 'text' : 'password'}
 placeholder="Create a strong password"
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
 {passwordChecks.map((check) => (
 <div key={check.label} className="flex items-center gap-1.5">
 <div className={cn('w-3.5 h-3.5 rounded-full flex items-center justify-center', check.test(password) ? 'bg-accent-500' : 'bg-gray-200 dark:bg-slate-600')}>
 {check.test(password) && <Check className="h-2.5 w-2.5 text-white" />}
 </div>
 <span className={cn('text-xs', check.test(password) ? 'text-accent-600 dark:text-accent-400' : 'text-gray-400 dark:text-slate-500')}>{check.label}</span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Confirm Password */}
 <div>
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm password</label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type="password"
 placeholder="Re-enter your password"
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
 I agree to the{' '}
 <Link to="/terms" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium">Terms of Service</Link>
 {' '}and{' '}
 <Link to="/privacy" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium">Privacy Policy</Link>
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
 <>Create account <ArrowRight className="h-4 w-4" /></>
 )}
 </button>
 </form>

 <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
 Already have an account?{' '}
 <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-semibold">
 Sign in
 </Link>
 </p>
 </motion.div>
 </div>
 </div>
 );
}
