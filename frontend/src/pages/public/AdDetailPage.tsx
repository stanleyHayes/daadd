import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { RewardClaimButton } from '@/components/ads/RewardClaimButton';
import { AgeVerificationModal } from '@/components/ads/AgeVerificationModal';
import { AdCard } from '@/components/ads/AdCard';
import { ReviewsSection } from '@/components/ads/ReviewsSection';
import { useClaimReward } from '@/hooks/useRewards';
import { usePublicAd, useRelatedAds } from '@/hooks/usePublicAds';
import { useAuthStore } from '@/stores/auth.store';
import { Eye, Play, ArrowLeft, AlertTriangle, Star, Gift, Building2, Calendar, Shield, MapPin, Phone, Mail, Globe, MessageSquare, Clock } from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { INDUSTRY_COLOR_MAP } from '@/lib/constants';
import toast from 'react-hot-toast';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton, SkeletonText, SkeletonCard } from '@/components/ui/Skeleton';

export function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const claimReward = useClaimReward();
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  const { data: ad, isLoading, error } = usePublicAd(id);
  const { data: relatedAds } = useRelatedAds(id, ad?.industry);

  const handleClaim = async () => {
    if (!ad) return;
    if (!isAuthenticated) {
      toast.error('Please log in to claim rewards');
      return;
    }
    if (ad.isAgeRestricted) {
      setShowAgeVerification(true);
      return;
    }
    await claimReward.mutateAsync(ad.id);
  };

  const handleAgeVerify = async (_otp: string) => {
    if (!ad) return;
    setShowAgeVerification(false);
    await claimReward.mutateAsync(ad.id);
  };

  const handleMessageCompany = () => {
    if (!ad) return;
    if (!isAuthenticated) {
      toast.error('Please log in to message the company');
      navigate('/login');
      return;
    }
    if (!ad.advertiser?.id) {
      toast.error('This company is not reachable right now');
      return;
    }
    navigate('/messages', {
      state: {
        compose: {
          advertiserId: ad.advertiser.id,
          advertiserName: ad.advertiser.name,
          adId: ad.id,
          campaignId: ad.campaign?.id,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton variant="text" className="h-4 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton variant="card" className="aspect-video h-auto w-full" />
              <div className="space-y-3">
                <Skeleton variant="text" className="h-8 w-2/3" />
                <div className="flex gap-3">
                  <Skeleton variant="text" className="h-5 w-24" />
                  <Skeleton variant="text" className="h-5 w-32" />
                  <Skeleton variant="text" className="h-5 w-20" />
                </div>
                <SkeletonText lines={4} />
              </div>
              <SkeletonCard />
            </div>
            <div className="space-y-6">
              <SkeletonCard className="h-56" />
              <SkeletonCard className="h-48" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !ad) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-danger-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Ad Not Found</h2>
          <p className="text-sm text-text-secondary mb-6">The ad you're looking for could not be loaded.</p>
          <Link to="/ads" className="text-primary-700 hover:text-primary-800 text-sm font-medium">Back to catalog</Link>
        </div>
      </PageTransition>
    );
  }

  const industryColor = INDUSTRY_COLOR_MAP[ad.industry] || 'gray';

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-secondary">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/ads"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to catalog
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Creative Display */}
              <div className="aspect-video bg-card-bg rounded-2xl border border-border-color flex items-center justify-center relative overflow-hidden shadow-sm">
                <WatermarkBanner className="opacity-50" icon={<Eye />} />
                {ad.creativeUrl ? (
                  ad.creativeType === 'video' ? (
                    <video src={ad.creativeUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={ad.creativeUrl} alt={ad.title} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="text-center">
                    {ad.creativeType === 'video' ? (
                      <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors">
                        <Play className="h-8 w-8 text-primary-700 ml-1" />
                      </div>
                    ) : (
                      <Eye className="h-16 w-16 text-primary-200 dark:text-primary-800 mx-auto mb-3" />
                    )}
                    <p className="text-sm text-text-muted">Ad Creative Preview</p>
                  </div>
                )}

                {/* Decorative watermark */}
                <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-secondary-500/10 pointer-events-none" />
              </div>

              {/* Ad Info */}
              <div className="bg-card-bg rounded-2xl border border-border-color p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div className="space-y-3">
                    <Badge
                      variant={industryColor as BadgeVariant}
                      size="md"
                    >
                      {ad.industry.replace('_', ' ')}
                    </Badge>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{ad.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-secondary-600" />
                        <span>{ad.advertiser?.name || 'Advertiser'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4 text-text-muted" />
                        <span>{(ad.viewCount || 0).toLocaleString()} views</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-text-muted" />
                        <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {ad.rating > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/30">
                      <Star className="h-5 w-5 text-secondary-500 fill-secondary-500" />
                      <div>
                        <p className="text-lg font-bold text-text-primary leading-none">{ad.rating.toFixed(1)}</p>
                        <p className="text-xs text-text-secondary">{ad.reviewCount || 0} reviews</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border-color mb-6" />

                <p className="text-text-secondary leading-relaxed">{ad.description}</p>
              </div>

              <ReviewsSection campaignId={ad.id} />
            </div>

            {/* Reward Sidebar */}
            <div className="space-y-6">
              <Card className="text-center border-border-color bg-gradient-to-b from-card-bg to-cream-50 dark:from-card-bg dark:to-primary-900/10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900/20 text-secondary-600 mb-4">
                  <Gift className="h-6 w-6" />
                </div>
                <p className="text-sm text-text-secondary mb-1">Reward for Viewing</p>
                <p className="text-4xl font-bold text-primary-700 dark:text-secondary-400 mb-6">
                  ${(ad.rewardAmount || 0).toFixed(2)}
                </p>
                <RewardClaimButton
                  amount={ad.rewardAmount || 0}
                  onClaim={handleClaim}
                  disabled={!isAuthenticated}
                  className="w-full flex justify-center"
                />
                {!isAuthenticated && (
                  <p className="mt-4 text-xs text-text-secondary">
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium underline underline-offset-2">Log in</Link> or{' '}
                    <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-secondary-400 dark:hover:text-secondary-300 font-medium underline underline-offset-2">sign up</Link> to claim rewards
                  </p>
                )}
              </Card>

              <Card className="border-border-color">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                  Ad Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border-color last:border-0">
                    <span className="text-text-secondary">Industry</span>
                    <span className="text-text-primary capitalize font-medium">{ad.industry.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border-color last:border-0">
                    <span className="text-text-secondary">Type</span>
                    <span className="text-text-primary capitalize font-medium">{ad.creativeType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border-color last:border-0">
                    <span className="text-text-secondary">Age Restricted</span>
                    <span className="text-text-primary font-medium flex items-center gap-1.5">
                      {ad.isAgeRestricted ? (
                        <>
                          <Shield className="h-3.5 w-3.5 text-danger-500" /> Yes
                        </>
                      ) : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border-color last:border-0">
                    <span className="text-text-secondary">Advertiser</span>
                    <span className="text-text-primary font-medium">{ad.advertiser?.name || 'Advertiser'}</span>
                  </div>
                </div>
              </Card>

              {/* Business & contact (per-campaign) + message the company */}
              <Card className="border-border-color">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                  Business & Contact
                </h3>
                <div className="space-y-3 text-sm">
                  {ad.campaign?.location && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                      <span className="text-text-primary">{ad.campaign.location}</span>
                    </div>
                  )}
                  {(ad.campaign?.start_date || ad.campaign?.end_date) && (
                    <div className="flex items-start gap-2.5">
                      <Clock className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                      <span className="text-text-secondary">
                        {ad.campaign?.start_date ? new Date(ad.campaign.start_date).toLocaleDateString() : '—'}
                        {' – '}
                        {ad.campaign?.end_date ? new Date(ad.campaign.end_date).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  )}
                  {ad.campaign?.contact_phone && (
                    <a href={`tel:${ad.campaign.contact_phone}`} className="flex items-center gap-2.5 text-primary-700 hover:text-primary-800 dark:text-secondary-400">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{ad.campaign.contact_phone}</span>
                    </a>
                  )}
                  {ad.campaign?.contact_email && (
                    <a href={`mailto:${ad.campaign.contact_email}`} className="flex items-center gap-2.5 text-primary-700 hover:text-primary-800 dark:text-secondary-400">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{ad.campaign.contact_email}</span>
                    </a>
                  )}
                  {ad.campaign?.contact_website && (
                    <a
                      href={ad.campaign.contact_website.startsWith('http') ? ad.campaign.contact_website : `https://${ad.campaign.contact_website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 text-primary-700 hover:text-primary-800 dark:text-secondary-400"
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="truncate">{ad.campaign.contact_website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {!ad.campaign?.location &&
                    !ad.campaign?.contact_phone &&
                    !ad.campaign?.contact_email &&
                    !ad.campaign?.contact_website && (
                      <p className="text-text-muted">No contact details provided for this promotion.</p>
                    )}
                </div>
                <button
                  onClick={handleMessageCompany}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  <MessageSquare className="h-4 w-4" /> Message company
                </button>
              </Card>
            </div>
          </div>

          {/* Related Ads */}
          {relatedAds && relatedAds.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Related Ads</h2>
                <div className="flex-1 h-px bg-border-color" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedAds.map((relAd) => (
                  <AdCard key={relAd.id} ad={relAd} />
                ))}
              </div>
            </div>
          )}

          <AgeVerificationModal
            isOpen={showAgeVerification}
            onClose={() => setShowAgeVerification(false)}
            onVerify={handleAgeVerify}
          />
        </div>
      </div>
    </PageTransition>
  );
}
