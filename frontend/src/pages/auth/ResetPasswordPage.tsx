import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export function ResetPasswordPage() {
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const token = searchParams.get('token');

 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [isSubmitted, setIsSubmitted] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!token) {
 setError('Invalid reset link. Missing token.');
 }
 }, [token]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (password !== confirmPassword) {
 toast.error('Passwords do not match');
 return;
 }

 if (password.length < 8) {
 toast.error('Password must be at least 8 characters');
 return;
 }

 setIsLoading(true);

 try {
 await api.post('/auth/reset-password', { token, newPassword: password });
 setIsSubmitted(true);
 setTimeout(() => navigate('/login'), 2000);
 } catch (err: unknown) {
 const error = err as { response?: { data?: { message?: string } }; message?: string };
 toast.error(error?.response?.data?.message || error?.message || 'Failed to reset password');
 } finally {
 setIsLoading(false);
 }
 };

 if (error) {
 return (
 <div className="min-h-screen bg-primary-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
 <div className="w-full max-w-md">
 <Card className="p-8 text-center">
 <div className="flex items-center justify-center w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30 mx-auto mb-4">
 <AlertTriangle className="h-6 w-6 text-danger-600 dark:text-danger-400" />
 </div>
 <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Invalid Reset Link</h2>
 <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">{error}</p>
 <Link to="/forgot-password" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
 Request a new reset link
 </Link>
 </Card>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-primary-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
 <div className="w-full max-w-md">
 <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-8">
 <ArrowLeft className="h-4 w-4" /> Back to login
 </Link>

 <Card className="p-8">
 {!isSubmitted ? (
 <>
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set New Password</h1>
 <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
 Enter your new password below. Make it strong and secure.
 </p>

 <form onSubmit={handleSubmit} className="space-y-4">
 <Input
 type="password"
 placeholder="New password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 leftIcon={<Lock className="h-4 w-4" />}
 />

 <Input
 type="password"
 placeholder="Confirm password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 leftIcon={<Lock className="h-4 w-4" />}
 />

 <div className="text-xs text-gray-500 dark:text-slate-400">
 ✓ At least 8 characters
 </div>

 <Button
 type="submit"
 fullWidth
 disabled={isLoading || !password || !confirmPassword}
 icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
 >
 {isLoading ? 'Resetting...' : 'Reset Password'}
 </Button>
 </form>
 </>
 ) : (
 <div className="text-center">
 <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 mx-auto mb-4">
 <CheckCircle className="h-6 w-6 text-accent-600 dark:text-accent-400" />
 </div>
 <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Password Reset</h2>
 <p className="text-sm text-gray-600 dark:text-slate-400">
 Your password has been reset successfully. Redirecting to login...
 </p>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
