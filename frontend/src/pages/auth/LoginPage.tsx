
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { useLogin } from '@/hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, BarChart3, Shield, TrendingUp, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
 email: z.string().email('Please enter a valid email'),
 password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const features = [
 { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track impressions, clicks, CTR, and conversions with live dashboards' },
 { icon: TrendingUp, title: 'AI Optimization', desc: 'Let AI fine-tune your campaigns for maximum ROI automatically' },
 { icon: Shield, title: 'Anomaly Detection', desc: 'Instant alerts for bot traffic, CTR spikes, and suspicious activity' },
 { icon: Gift, title: 'Reward System', desc: 'Engage users with real rewards for viewing and interacting with ads' },
];

export function LoginPage() {
 const navigate = useNavigate();
 const loginMutation = useLogin();
 const [showPassword, setShowPassword] = useState(false);

 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<LoginForm>({
 resolver: zodResolver(loginSchema),
 });

 const onSubmit = async (data: LoginForm) => {
 try {
 await loginMutation.mutateAsync(data);
 toast.success('Welcome back!');
 navigate('/dashboard');
 } catch {
 toast.error('Invalid credentials. Please try again.');
 }
 };

 return (
 <div className="min-h-screen flex">
 {/* Left Panel - Branding & Features */}
 <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-600">
 <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
 {/* Logo */}
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.5 }}
 className="flex items-center gap-3"
 >
 <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
 <Zap className="h-6 w-6 text-white" />
 </div>
 <span className="text-xl font-bold tracking-tight">AdPlatform</span>
 </motion.div>

 {/* Hero text */}
 <div>
 <motion.h1
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.1 }}
 className="text-4xl font-extrabold leading-tight mb-4"
 >
 The Future of
 <br />
 <span className="text-accent-400">Intelligent Advertising</span>
 </motion.h1>
 <motion.p
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="text-primary-100 text-lg max-w-md mb-10"
 >
 Create, optimize, and analyze ad campaigns with AI-powered insights and real-time analytics.
 </motion.p>

 {/* Feature list */}
 <div className="space-y-5">
 {features.map((f, i) => {
 const Icon = f.icon;
 return (
 <motion.div
 key={f.title}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
 className="flex items-start gap-4"
 >
 <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
 <Icon className="h-5 w-5 text-accent-400" />
 </div>
 <div>
 <h3 className="font-semibold text-sm">{f.title}</h3>
 <p className="text-primary-200 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>

 {/* Bottom stats */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.5, delay: 0.8 }}
 className="flex gap-8"
 >
 {[
 { value: '12K+', label: 'Active Campaigns' },
 { value: '98.5%', label: 'Uptime SLA' },
 { value: '2.3M', label: 'Ads Served Daily' },
 ].map((stat) => (
 <div key={stat.label}>
 <p className="text-2xl font-extrabold">{stat.value}</p>
 <p className="text-primary-200 text-xs mt-0.5">{stat.label}</p>
 </div>
 ))}
 </motion.div>
 </div>
 </div>

 {/* Right Panel - Login Form */}
 <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-6 py-12">
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="w-full max-w-[420px]"
 >
 {/* Mobile logo */}
 <div className="lg:hidden text-center mb-8">
 <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-3 shadow-lg shadow-primary-500/25">
 <Zap className="h-8 w-8 text-white" />
 </div>
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AdPlatform</h1>
 </div>

 <div className="mb-8">
 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
 <p className="text-gray-500 dark:text-slate-400 mt-1">Sign in to your account to continue</p>
 </div>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
 <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Forgot password?</Link>
 </div>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
 <input
 type={showPassword ? 'text' : 'password'}
 placeholder="Enter your password"
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
 </div>

 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="remember"
 className="rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-700"
 />
 <label htmlFor="remember" className="text-sm text-gray-600 dark:text-slate-400">Remember me for 30 days</label>
 </div>

 <button
 type="submit"
 disabled={loginMutation.isPending}
 className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:from-primary-700 hover:to-primary-800 text-white font-medium py-3 px-4 text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loginMutation.isPending ? (
 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>Sign in <ArrowRight className="h-4 w-4" /></>
 )}
 </button>
 </form>

 <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
 Don't have an account?{' '}
 <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
 Create free account
 </Link>
 </p>
 </motion.div>
 </div>
 </div>
 );
}
