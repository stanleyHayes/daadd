import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageTransition } from '@/components/ui/PageTransition';
import { cn } from '@/lib/utils';
import { INDUSTRIES, DEVICE_TYPES, LANGUAGES, REGIONS } from '@/lib/constants';
import { useCreateCampaign } from '@/hooks/useCampaigns';
import { useAuthStore } from '@/stores/auth.store';
import { AICreativeGenerator } from '@/components/ai/AICreativeGenerator';
import { Upload, X, Image, Video, Check, ChevronLeft, ChevronRight, Rocket, Save, Info, Sparkles, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

// i18n keys under `dashboard.campaignCreate.steps`
const steps = ['basic', 'budget', 'creatives', 'review'] as const;

export function CampaignCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateCampaign();
  const user = useAuthStore((s) => s.user);
  // Advertisers must clear onboarding (email + admin approval + billing) to launch.
  const mustVerify = user?.role === 'advertiser' && user?.can_run_ads === false;
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [creativeMode, setCreativeMode] = useState<'upload' | 'ai' | 'both'>('both');
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '', description: '', industry: '', start_date: '', end_date: '',
    budget: 0, reward_value: 0, discount_percentage: 15, age_min: 18, age_max: 65,
    location: '', contact_phone: '', contact_email: '', contact_website: '',
    business_logo: '', business_category: '', opening_hours: '',
    consumer_share_pct: 5, max_tokens: 0,
    reward_per_view: 1, reward_per_click: 2, reward_per_review: 3, reward_per_photo: 2,
    regions: [] as string[], devices: ['desktop', 'mobile'] as string[], languages: ['en'] as string[],
    localized: false, creatives: [] as { name: string; type: string; size: number; preview?: string }[],
    age_restricted: false, ai_enabled: true,
  });

  const updateField = (field: string, value: unknown) => { setFormData((prev) => ({ ...prev, [field]: value })); };
  const toggleArrayItem = (field: 'regions' | 'devices' | 'languages', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value] }));
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newCreatives = files.map((f) => {
      const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined;
      if (preview) previewUrlsRef.current.add(preview);
      return { name: f.name, type: f.type.startsWith('video/') ? 'video' : 'image', size: f.size, preview };
    });
    updateField('creatives', [...formData.creatives, ...newCreatives]);
  }, [formData.creatives]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newCreatives = files.map((f) => {
      const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined;
      if (preview) previewUrlsRef.current.add(preview);
      return { name: f.name, type: f.type.startsWith('video/') ? 'video' : 'image', size: f.size, preview };
    });
    updateField('creatives', [...formData.creatives, ...newCreatives]);
  };

  const removeCreative = (index: number) => {
    const removed = formData.creatives[index];
    if (removed?.preview) {
      URL.revokeObjectURL(removed.preview);
      previewUrlsRef.current.delete(removed.preview);
    }
    updateField('creatives', formData.creatives.filter((_, i) => i !== index));
  };

  // Cleanup all object URLs on unmount
  useEffect(() => {
    const urls = Array.from(previewUrlsRef.current);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.name && formData.industry && formData.start_date && formData.end_date;
      case 1: return formData.budget > 0;
      default: return true;
    }
  };

  const handleLaunch = async () => {
    if (mustVerify) {
      toast.error(t('dashboard.campaignCreate.onboardingToast'));
      navigate('/dashboard');
      return;
    }
    try { await createMutation.mutateAsync(formData as never); toast.success(t('dashboard.campaignCreate.createdToast')); navigate('/dashboard/campaigns'); } catch { toast.error(t('dashboard.campaignCreate.createFailedToast')); }
  };
  const handleSaveDraft = async () => { try { await createMutation.mutateAsync({ ...formData, status: 'draft' } as never); toast.success(t('dashboard.campaignCreate.draftToast')); navigate('/dashboard/campaigns'); } catch { toast.error(t('dashboard.campaignCreate.draftFailedToast')); } };

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={t('dashboard.campaignCreate.title')}
          subtitle={t('dashboard.campaignCreate.subtitle')}
        />

        <div className="flex items-center justify-between px-4">
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i < currentStep ? 'bg-accent-500 text-white' : i === currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                )}>{i < currentStep ? <Check className="h-4 w-4" /> : i + 1}</div>
                <span className={cn('text-sm font-medium hidden sm:inline', i === currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400')}>{t(`dashboard.campaignCreate.steps.${step}`)}</span>
              </div>
              {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 mx-4', i < currentStep ? 'bg-accent-500' : 'bg-gray-200 dark:bg-slate-700')} />}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={currentStep} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>

              {currentStep === 0 && (
                <div className="space-y-5">
                  <Input label={t('dashboard.campaignCreate.name')} placeholder={t('dashboard.campaignCreate.namePlaceholder')} value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('dashboard.common.description')}</label>
                    <textarea className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" rows={4} placeholder={t('dashboard.campaignCreate.descPlaceholder')} value={formData.description} onChange={(e) => updateField('description', e.target.value)} />
                  </div>
                  <Select label={t('dashboard.common.industry')} options={INDUSTRIES.map((i) => ({ value: i.value, label: i.label }))} placeholder={t('dashboard.campaignCreate.selectIndustry')} value={formData.industry} onChange={(v) => updateField('industry', v)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label={t('dashboard.campaignCreate.startDate')} type="date" value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)} />
                    <Input label={t('dashboard.campaignCreate.endDate')} type="date" value={formData.end_date} onChange={(e) => updateField('end_date', e.target.value)} />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label={t('dashboard.campaignCreate.budget')} type="number" placeholder="5000" value={formData.budget || ''} onChange={(e) => updateField('budget', Number(e.target.value))} />
                    <Input label={t('dashboard.campaignCreate.rewardValue')} type="number" placeholder="0.50" value={formData.reward_value || ''} onChange={(e) => updateField('reward_value', Number(e.target.value))} />
                    <Input label={t('dashboard.campaignCreate.discountShared')} type="number" placeholder="15" value={formData.discount_percentage || ''} onChange={(e) => updateField('discount_percentage', Math.min(100, Math.max(0, Number(e.target.value))))} hint={t('dashboard.campaignCreate.discountSharedHint')} />
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-semibold text-text-primary mb-1">{t('dashboard.campaignCreate.rewardEconomics')}</p>
                    <p className="text-xs text-text-secondary mb-3">
                      {t('dashboard.campaignCreate.rewardEconomicsHint')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label={t('dashboard.campaignCreate.consumerShare')} type="number" placeholder="5" value={formData.consumer_share_pct || ''} onChange={(e) => updateField('consumer_share_pct', Math.min(100, Math.max(0, Number(e.target.value))))} hint={t('dashboard.campaignCreate.consumerShareHint')} />
                      <Input label={t('dashboard.campaignCreate.maxTokens')} type="number" placeholder="0" value={formData.max_tokens || ''} onChange={(e) => updateField('max_tokens', Math.max(0, Number(e.target.value)))} hint={t('dashboard.campaignCreate.maxTokensHint')} />
                      <Input label={t('dashboard.campaignCreate.perView')} type="number" placeholder="1" value={formData.reward_per_view || ''} onChange={(e) => updateField('reward_per_view', Math.max(0, Number(e.target.value)))} />
                      <Input label={t('dashboard.campaignCreate.perClick')} type="number" placeholder="2" value={formData.reward_per_click || ''} onChange={(e) => updateField('reward_per_click', Math.max(0, Number(e.target.value)))} />
                      <Input label={t('dashboard.campaignCreate.perReview')} type="number" placeholder="3" value={formData.reward_per_review || ''} onChange={(e) => updateField('reward_per_review', Math.max(0, Number(e.target.value)))} />
                      <Input label={t('dashboard.campaignCreate.perPhoto')} type="number" placeholder="2" value={formData.reward_per_photo || ''} onChange={(e) => updateField('reward_per_photo', Math.max(0, Number(e.target.value)))} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-semibold text-text-primary mb-1">{t('dashboard.campaignCreate.business')}</p>
                    <p className="text-xs text-text-secondary mb-3">{t('dashboard.campaignCreate.businessHint')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label={t('dashboard.campaignCreate.location')} placeholder="123 High St, Accra" value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
                      <Input label={t('dashboard.campaignCreate.contactPhone')} type="tel" placeholder="+233 20 000 0000" value={formData.contact_phone} onChange={(e) => updateField('contact_phone', e.target.value)} />
                      <Input label={t('dashboard.campaignCreate.contactEmail')} type="email" placeholder="hello@company.com" value={formData.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} />
                      <Input label={t('dashboard.campaignCreate.website')} placeholder="company.com" value={formData.contact_website} onChange={(e) => updateField('contact_website', e.target.value)} />
                      <Input label={t('dashboard.campaignCreate.businessCategory')} placeholder="Coffee shop" value={formData.business_category} onChange={(e) => updateField('business_category', e.target.value)} />
                      <Input label={t('dashboard.campaignCreate.openingHours')} placeholder="Mon–Sat 9am–7pm" value={formData.opening_hours} onChange={(e) => updateField('opening_hours', e.target.value)} />
                      <Input label={t('dashboard.campaignCreate.logoUrl')} placeholder="https://…/logo.png" value={formData.business_logo} onChange={(e) => updateField('business_logo', e.target.value)} hint={t('dashboard.campaignCreate.logoHint')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('dashboard.campaignCreate.ageRange')}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label={t('dashboard.campaignCreate.min')} type="number" min={13} max={100} value={formData.age_min} onChange={(e) => updateField('age_min', Number(e.target.value))} />
                      <Input label={t('dashboard.campaignCreate.max')} type="number" min={13} max={100} value={formData.age_max} onChange={(e) => updateField('age_max', Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('dashboard.campaignCreate.regions')}</label>
                    <div className="flex flex-wrap gap-2">
                      {REGIONS.map((r) => (
                        <button key={r.value} type="button" onClick={() => toggleArrayItem('regions', r.value)} className={cn('px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors', formData.regions.includes(r.value) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('dashboard.campaignCreate.devices')}</label>
                    <div className="flex gap-4">
                      {DEVICE_TYPES.map((d) => (
                        <label key={d.value} className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.devices.includes(d.value)} onChange={() => toggleArrayItem('devices', d.value)} className="rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 dark:bg-slate-700" />
                          <span className="text-sm text-gray-700 dark:text-slate-300">{d.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('dashboard.campaignCreate.languages')}</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((l) => (
                        <button key={l.value} type="button" onClick={() => toggleArrayItem('languages', l.value)} className={cn('px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors', formData.languages.includes(l.value) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}>{l.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <input type="checkbox" checked={formData.localized} onChange={(e) => updateField('localized', e.target.checked)} disabled={formData.budget < 500} className="rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 disabled:opacity-50 dark:bg-slate-700" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('dashboard.campaignCreate.localizedTargeting')}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.campaignCreate.localizedTargetingHint')}</p>
                    </div>
                    {formData.budget < 500 && <div className="flex items-center gap-1 text-xs text-warning-600"><Info className="h-3.5 w-3.5" />{t('dashboard.campaignCreate.minBudget')}</div>}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Mode selector tabs */}
                  <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
                    <button
                      onClick={() => setCreativeMode('upload')}
                      className={cn(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        creativeMode === 'upload'
                          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <Upload className="h-4 w-4 inline mr-2" />
                      {t('dashboard.campaignCreate.uploadFiles')}
                    </button>
                    <button
                      onClick={() => setCreativeMode('ai')}
                      className={cn(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        creativeMode === 'ai'
                          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <Sparkles className="h-4 w-4 inline mr-2" />
                      {t('dashboard.campaignCreate.aiGenerator')}
                    </button>
                    <button
                      onClick={() => setCreativeMode('both')}
                      className={cn(
                        'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                        creativeMode === 'both'
                          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      {t('dashboard.campaignCreate.bothOptions')}
                    </button>
                  </div>

                  {/* Upload mode or both mode */}
                  {(creativeMode === 'upload' || creativeMode === 'both') && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-primary-400 dark:hover:border-primary-600 transition-colors cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop} onClick={() => document.getElementById('file-upload')?.click()}>
                        <Upload className="h-10 w-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('dashboard.campaignCreate.dropFiles')}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('dashboard.campaignCreate.dropFilesHint')}</p>
                        <input id="file-upload" type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileInput} />
                      </div>
                      {formData.creatives.length > 0 && (
                        <div className="space-y-3">
                          {formData.creatives.map((file, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                              <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                {file.preview ? <img src={file.preview} alt={file.name} className="w-full h-full object-cover" /> : file.type === 'video' ? <Video className="h-6 w-6 text-gray-400" /> : <Image className="h-6 w-6 text-gray-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', file.type === 'video' ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400')}>{file.type === 'video' ? 'Video' : 'Image'}</span>
                                  <span className="text-xs text-gray-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                              <button onClick={() => removeCreative(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"><X className="h-4 w-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Generator mode or both mode */}
                  {(creativeMode === 'ai' || creativeMode === 'both') && (
                    <AICreativeGenerator
                      campaignId={formData.name || 'draft'}
                      productName={formData.description || formData.name}
                      onSave={(variations) => {
                        toast.success(`${variations.length} creatives generated! Review in the next step.`);
                      }}
                    />
                  )}

                  <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className={cn('w-10 h-6 rounded-full relative cursor-pointer transition-colors', formData.age_restricted ? 'bg-warning-500' : 'bg-gray-300 dark:bg-slate-600')} onClick={() => updateField('age_restricted', !formData.age_restricted)}>
                      <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', formData.age_restricted ? 'translate-x-4' : 'translate-x-0.5')} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('dashboard.campaignCreate.ageRestricted')}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{t('dashboard.campaignCreate.ageRestrictedHint')}</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{t('dashboard.campaignCreate.stepDetails')}</h3>
                      <div className="space-y-2">
                        {[['Name', formData.name], ['Industry', formData.industry.replace('_', ' ')], ['Start Date', formData.start_date], ['End Date', formData.end_date]].map(([label, val]) => (
                          <div key={label} className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">{label}</span><span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{val}</span></div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{t('dashboard.campaignCreate.stepBudget')}</h3>
                      <div className="space-y-2">
                        {[['Budget', `$${formData.budget.toLocaleString()}`], ['Reward', `$${formData.reward_value}`], ['Discount Shared', `${formData.discount_percentage}%`], ['Age Range', `${formData.age_min} - ${formData.age_max}`], ['Devices', formData.devices.join(', ')], ['Creatives', `${formData.creatives.length} files`]].map(([label, val]) => (
                          <div key={label} className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">{label}</span><span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{val}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/20">
                    <input type="checkbox" checked={formData.ai_enabled} onChange={(e) => updateField('ai_enabled', e.target.checked)} className="rounded border-gray-300 dark:border-slate-600 text-secondary-600 focus:ring-secondary-500 dark:bg-slate-700" />
                    <div>
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-400">{t('dashboard.campaignCreate.enableAi')}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400/70">{t('dashboard.campaignCreate.enableAiHint')}</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => goToStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} icon={<ChevronLeft className="h-4 w-4" />}>{t('dashboard.common.back')}</Button>
            <div className="flex items-center gap-3">
              {currentStep === 3 && <Button variant="outline" onClick={handleSaveDraft} loading={createMutation.isPending} icon={<Save className="h-4 w-4" />}>{t('dashboard.campaignCreate.saveDraft')}</Button>}
              {currentStep < 3 ? (
                <Button onClick={() => goToStep(currentStep + 1)} disabled={!canProceed()}>{t('dashboard.common.next')} <ChevronRight className="h-4 w-4 ml-1" /></Button>
              ) : mustVerify ? (
                <Button variant="secondary" onClick={() => navigate('/dashboard')} icon={<ShieldAlert className="h-4 w-4" />}>{t('dashboard.campaignCreate.verifyToLaunch')}</Button>
              ) : (
                <Button onClick={handleLaunch} loading={createMutation.isPending} icon={<Rocket className="h-4 w-4" />}>{t('dashboard.campaignCreate.launch')}</Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
