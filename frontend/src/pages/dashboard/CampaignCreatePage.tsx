import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageTransition } from '@/components/ui/PageTransition';
import { cn } from '@/lib/utils';
import { INDUSTRIES, DEVICE_TYPES, LANGUAGES, REGIONS } from '@/lib/constants';
import { useCreateCampaign } from '@/hooks/useCampaigns';
import { AICreativeGenerator } from '@/components/ai/AICreativeGenerator';
import { Upload, X, Image, Video, Check, ChevronLeft, ChevronRight, Rocket, Save, Info, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = ['Basic Info', 'Budget & Targeting', 'Creatives', 'Review & Launch'];

export function CampaignCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCampaign();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [creativeMode, setCreativeMode] = useState<'upload' | 'ai' | 'both'>('both');
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: '', description: '', industry: '', start_date: '', end_date: '',
    budget: 0, reward_value: 0, age_min: 18, age_max: 65,
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

  const handleLaunch = async () => { try { await createMutation.mutateAsync(formData as never); toast.success('Campaign created successfully!'); navigate('/dashboard/campaigns'); } catch { toast.error('Failed to create campaign'); } };
  const handleSaveDraft = async () => { try { await createMutation.mutateAsync({ ...formData, status: 'draft' } as never); toast.success('Campaign saved as draft'); navigate('/dashboard/campaigns'); } catch { toast.error('Failed to save draft'); } };

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">Create Campaign</h1>
          <p className="page-subtitle">Set up a new advertising campaign</p>
        </div>

        <div className="flex items-center justify-between px-4">
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i < currentStep ? 'bg-accent-500 text-white' : i === currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                )}>{i < currentStep ? <Check className="h-4 w-4" /> : i + 1}</div>
                <span className={cn('text-sm font-medium hidden sm:inline', i === currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400')}>{step}</span>
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
                  <Input label="Campaign Name" placeholder="Enter campaign name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none" rows={4} placeholder="Describe your campaign objectives..." value={formData.description} onChange={(e) => updateField('description', e.target.value)} />
                  </div>
                  <Select label="Industry" options={INDUSTRIES.map((i) => ({ value: i.value, label: i.label }))} placeholder="Select an industry" value={formData.industry} onChange={(v) => updateField('industry', v)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Start Date" type="date" value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)} />
                    <Input label="End Date" type="date" value={formData.end_date} onChange={(e) => updateField('end_date', e.target.value)} />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Budget ($)" type="number" placeholder="5000" value={formData.budget || ''} onChange={(e) => updateField('budget', Number(e.target.value))} />
                    <Input label="Reward Value ($)" type="number" placeholder="0.50" value={formData.reward_value || ''} onChange={(e) => updateField('reward_value', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Age Range</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Minimum" type="number" min={13} max={100} value={formData.age_min} onChange={(e) => updateField('age_min', Number(e.target.value))} />
                      <Input label="Maximum" type="number" min={13} max={100} value={formData.age_max} onChange={(e) => updateField('age_max', Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Target Regions</label>
                    <div className="flex flex-wrap gap-2">
                      {REGIONS.map((r) => (
                        <button key={r.value} type="button" onClick={() => toggleArrayItem('regions', r.value)} className={cn('px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors', formData.regions.includes(r.value) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}>{r.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Target Devices</label>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((l) => (
                        <button key={l.value} type="button" onClick={() => toggleArrayItem('languages', l.value)} className={cn('px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors', formData.languages.includes(l.value) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400' : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700')}>{l.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <input type="checkbox" checked={formData.localized} onChange={(e) => updateField('localized', e.target.checked)} disabled={formData.budget < 500} className="rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 disabled:opacity-50 dark:bg-slate-700" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Enable Localized Targeting</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Target users based on precise location data</p>
                    </div>
                    {formData.budget < 500 && <div className="flex items-center gap-1 text-xs text-warning-600"><Info className="h-3.5 w-3.5" />Min $500 budget</div>}
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
                      Upload Files
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
                      AI Generator
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
                      Both Options
                    </button>
                  </div>

                  {/* Upload mode or both mode */}
                  {(creativeMode === 'upload' || creativeMode === 'both') && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-primary-400 dark:hover:border-primary-600 transition-colors cursor-pointer" onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop} onClick={() => document.getElementById('file-upload')?.click()}>
                        <Upload className="h-10 w-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Drop files here or click to upload</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Support images (PNG, JPG) and videos (MP4, MOV)</p>
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
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Age-Restricted Content</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Viewers will need to verify their age before viewing</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Campaign Details</h3>
                      <div className="space-y-2">
                        {[['Name', formData.name], ['Industry', formData.industry.replace('_', ' ')], ['Start Date', formData.start_date], ['End Date', formData.end_date]].map(([label, val]) => (
                          <div key={label} className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">{label}</span><span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{val}</span></div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Budget & Targeting</h3>
                      <div className="space-y-2">
                        {[['Budget', `$${formData.budget.toLocaleString()}`], ['Reward', `$${formData.reward_value}`], ['Age Range', `${formData.age_min} - ${formData.age_max}`], ['Devices', formData.devices.join(', ')], ['Creatives', `${formData.creatives.length} files`]].map(([label, val]) => (
                          <div key={label} className="flex justify-between"><span className="text-sm text-gray-500 dark:text-slate-400">{label}</span><span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{val}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/20">
                    <input type="checkbox" checked={formData.ai_enabled} onChange={(e) => updateField('ai_enabled', e.target.checked)} className="rounded border-gray-300 dark:border-slate-600 text-secondary-600 focus:ring-secondary-500 dark:bg-slate-700" />
                    <div>
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-400">Enable AI Optimization</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400/70">Let our AI automatically optimize your campaign for better performance. Available after 48 hours of runtime.</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => goToStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} icon={<ChevronLeft className="h-4 w-4" />}>Back</Button>
            <div className="flex items-center gap-3">
              {currentStep === 3 && <Button variant="outline" onClick={handleSaveDraft} loading={createMutation.isPending} icon={<Save className="h-4 w-4" />}>Save as Draft</Button>}
              {currentStep < 3 ? (
                <Button onClick={() => goToStep(currentStep + 1)} disabled={!canProceed()}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
              ) : (
                <Button onClick={handleLaunch} loading={createMutation.isPending} icon={<Rocket className="h-4 w-4" />}>Launch Campaign</Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
