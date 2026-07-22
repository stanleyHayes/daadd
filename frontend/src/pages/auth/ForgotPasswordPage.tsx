import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

export function ForgotPasswordPage() {
 const { t } = useTranslation();
 const [email, setEmail] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [isSubmitted, setIsSubmitted] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);

 try {
 await api.post('/auth/forgot-password', { email });
 setIsSubmitted(true);
 } catch (err: unknown) {
 const error = err as { response?: { data?: { message?: string } }; message?: string };
 toast.error(error?.response?.data?.message || error?.message || t('auth.forgot.errorToast'));
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-primary-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
 <div className="w-full max-w-md">
 <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-8">
 <ArrowLeft className="h-4 w-4" /> {t('auth.forgot.backToLogin')}
 </Link>

 <Card className="p-8">
 {!isSubmitted ? (
 <>
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.forgot.title')}</h1>
 <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
 {t('auth.forgot.subtitle')}
 </p>

 <form onSubmit={handleSubmit} className="space-y-4">
 <Input
 type="email"
 placeholder={t('auth.forgot.emailPlaceholder')}
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 leftIcon={<Mail className="h-4 w-4" />}
 />

 <Button
 type="submit"
 fullWidth
 disabled={isLoading || !email}
 icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
 >
 {isLoading ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
 </Button>
 </form>
 </>
 ) : (
 <div className="text-center">
 <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 mx-auto mb-4">
 <CheckCircle className="h-6 w-6 text-accent-600 dark:text-accent-400" />
 </div>
 <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('auth.forgot.sentTitle')}</h2>
 <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
 {t('auth.forgot.sentBody', { email })}
 </p>
 <p className="text-xs text-gray-500 dark:text-slate-500 mb-6">
 {t('auth.forgot.sentHint')}
 </p>
 <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
 {t('auth.forgot.backToLogin')}
 </Link>
 </div>
 )}
 </Card>
 </div>
 </div>
 );
}
