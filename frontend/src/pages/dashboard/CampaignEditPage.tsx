import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/ui/PageTransition';
import { cn } from '@/lib/utils';
import { INDUSTRIES, DEVICE_TYPES, LANGUAGES, REGIONS } from '@/lib/constants';
import { useCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import { Loader, Check, ChevronLeft, ChevronRight, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = ['Basic Info', 'Budget & Targeting', 'Review & Save'];

export function CampaignEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useCampaign(id!);
  const updateMutation = useUpdateCampaign();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    budget_total: 0,
    reward_value: 0,
    age_min: 18,
    age_max: 65,
    regions: [] as string[],
    devices: ['desktop', 'mobile'] as string[],
    languages: ['en'] as string[],
    localized: false,
    age_restricted: false,
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        industry: campaign.industry || '',
        budget_total: campaign.budget_total || 0,
        reward_value: campaign.reward_value || 0,
        age_min: campaign.age_min || 18,
        age_max: campaign.age_max || 65,
        regions: campaign.targeting_config?.regions || [],
        devices: campaign.targeting_config?.devices || ['desktop', 'mobile'],
        languages: campaign.language ? [campaign.language] : ['en'],
        localized: !!(campaign.targeting_config?.regions && campaign.targeting_config.regions.length > 0),
        age_restricted: campaign.is_age_restricted || false,
      });
    }
  }, [campaign]);

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'regions' | 'devices' | 'languages', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.industry;
      case 1:
        return formData.budget_total > 0;
      default:
        return true;
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: id!,
        data: {
          name: formData.name,
          description: formData.description,
          industry: formData.industry as import('@/types').Industry,
          budget_total: formData.budget_total,
          reward_value: formData.reward_value,
          is_age_restricted: formData.age_restricted,
          targeting_config: {
            regions: formData.regions,
            devices: formData.devices as ('desktop' | 'mobile' | 'tablet')[],
            age_min: formData.age_min,
            age_max: formData.age_max,
            languages: formData.languages,
            localized: formData.localized,
          } as import('@/types').TargetingConfig,
          language: formData.languages[0],
        },
      });
      toast.success('Campaign updated successfully');
      navigate(`/dashboard/campaigns/${id}`);
    } catch {
      toast.error('Failed to update campaign');
    }
  };

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-96">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </PageTransition>
    );
  }

  if (!campaign) {
    return (
      <PageTransition>
        <Card className="p-6 text-center">
          <p className="text-gray-600">Campaign not found</p>
          <Button onClick={() => navigate('/dashboard/campaigns')} className="mt-4">
            Back to Campaigns
          </Button>
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Edit Campaign"
          subtitle="Update campaign details"
          action={
            <button
              onClick={() => navigate(`/dashboard/campaigns/${id}`)}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
              aria-label="Back to campaign"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          }
        />

        <div className="flex items-center justify-between px-4">
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    i < currentStep
                      ? 'bg-accent-500 text-white'
                      : i === currentStep
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                  )}
                >
                  {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium hidden sm:inline',
                    i === currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'
                  )}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn('flex-1 h-0.5 mx-4', i < currentStep ? 'bg-accent-500' : 'bg-gray-200 dark:bg-slate-700')}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="p-6 space-y-6"
            >
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="e.g., Summer Sale 2026"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe your campaign..."
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => updateField('industry', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="">Select an industry</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>
                          {ind.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Budget & Targeting</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Budget ($)</label>
                      <Input
                        type="number"
                        value={formData.budget_total}
                        onChange={(e) => updateField('budget_total', parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Reward Value ($)</label>
                      <Input
                        type="number"
                        value={formData.reward_value}
                        onChange={(e) => updateField('reward_value', parseFloat(e.target.value))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Target Devices</label>
                    <div className="flex flex-wrap gap-2">
                      {DEVICE_TYPES.map((device) => (
                        <button
                          key={device.value}
                          onClick={() => toggleArrayItem('devices', device.value)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition',
                            formData.devices.includes(device.value)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                          )}
                        >
                          {device.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => toggleArrayItem('languages', lang.value)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition',
                            formData.languages.includes(lang.value)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Target Regions</label>
                    <div className="flex flex-wrap gap-2">
                      {REGIONS.map((region) => (
                        <button
                          key={region.value}
                          onClick={() => toggleArrayItem('regions', region.value)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition',
                            formData.regions.includes(region.value)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                          )}
                        >
                          {region.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Adjust targeting to reach different audiences
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Review Changes</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start border-b pb-3">
                      <span className="font-medium text-gray-600 dark:text-slate-400">Campaign Name</span>
                      <span className="text-gray-900 dark:text-white">{formData.name}</span>
                    </div>
                    <div className="flex justify-between items-start border-b pb-3">
                      <span className="font-medium text-gray-600 dark:text-slate-400">Budget</span>
                      <span className="text-gray-900 dark:text-white">${formData.budget_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-start border-b pb-3">
                      <span className="font-medium text-gray-600 dark:text-slate-400">Industry</span>
                      <span className="text-gray-900 dark:text-white">{formData.industry}</span>
                    </div>
                    <div className="flex justify-between items-start border-b pb-3">
                      <span className="font-medium text-gray-600 dark:text-slate-400">Devices</span>
                      <span className="text-gray-900 dark:text-white text-right">{formData.devices.join(', ')}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-600 dark:text-slate-400">Regions</span>
                      <span className="text-gray-900 dark:text-white text-right">
                        {formData.regions.length > 0 ? formData.regions.join(', ') : 'All'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSave}
                loading={updateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            ) : (
              <Button
                onClick={() => goToStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
