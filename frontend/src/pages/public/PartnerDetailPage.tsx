import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  BadgeCheck,
  Megaphone,
  TrendingUp,
  Star,
  Globe,
  Mail,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { Button } from '@/components/ui/Button';
import { AdCard } from '@/components/ads/AdCard';
import { usePublicAds } from '@/hooks/usePublicAds';
import { motion } from 'framer-motion';
import { SkeletonAdCard } from '@/components/ui/Skeleton';

export function PartnerDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const partnerName = slug ? decodeURIComponent(slug).replace(/-/g, ' ') : '';

  const { data: ads, isLoading } = usePublicAds({
    advertiser: partnerName,
    sort: 'reward',
    enabled: !!partnerName,
  });

  const partner = useMemo(() => {
    if (!ads || ads.length === 0) return null;
    const first = ads[0];
    const advertiser = first.advertiser || { name: partnerName, logo: '', verified: true };
    const totalReward = ads.reduce((sum, ad) => sum + (ad.rewardAmount || 0), 0);
    const industries = Array.from(new Set(ads.map((ad) => ad.industry).filter(Boolean)));
    const avgRating =
      ads.reduce((sum, ad) => sum + (ad.rating || 0), 0) / (ads.length || 1);
    return {
      ...advertiser,
      industries,
      adCount: ads.length,
      totalReward,
      avgRating,
    };
  }, [ads, partnerName]);

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-secondary">
        {/* Hero */}
        <section className="relative bg-primary-700 text-white py-16 sm:py-20 overflow-hidden">
          <WatermarkBanner icon={<Building2 />} />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary-500 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/partners"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to partners
            </Link>

            {partner ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
                  {partner.logo ? (
                    <img src={partner.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    partner.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
                    {partner.name}
                    {partner.verified && (
                      <BadgeCheck className="h-6 w-6 text-secondary-400" aria-label="Verified partner" />
                    )}
                  </h1>
                  <p className="text-primary-100 mt-1">
                    {partner.industries.join(' • ')}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">{partnerName}</h1>
                <p className="text-primary-100 mt-1">Partner profile</p>
              </div>
            )}
          </div>
        </section>

        {/* Stats + actions */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <div className="bg-card-bg dark:bg-slate-900 border border-border-color dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center md:text-left">
                <p className="text-xs text-text-muted flex items-center justify-center md:justify-start gap-1.5 mb-1">
                  <Megaphone className="h-3.5 w-3.5" /> Active Ads
                </p>
                <p className="text-2xl font-bold text-text-primary">{partner?.adCount ?? 0}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs text-text-muted flex items-center justify-center md:justify-start gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Total Rewards
                </p>
                <p className="text-2xl font-bold text-text-primary">
                  ${(partner?.totalReward ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs text-text-muted flex items-center justify-center md:justify-start gap-1.5 mb-1">
                  <Star className="h-3.5 w-3.5" /> Avg. Rating
                </p>
                <p className="text-2xl font-bold text-text-primary">
                  {partner ? partner.avgRating.toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-3">
                <Button variant="outline" size="sm" className="gap-2" disabled>
                  <Globe className="h-4 w-4" /> Website
                </Button>
                <Button size="sm" className="gap-2" disabled>
                  <Mail className="h-4 w-4" /> Contact
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Ads grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-text-primary mb-8">Campaigns by {partner?.name || partnerName}</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonAdCard key={i} />
              ))}
            </div>
          ) : !ads || ads.length === 0 ? (
            <div className="text-center py-16 bg-card-bg rounded-2xl border border-border-color">
              <Megaphone className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text-primary mb-2">No ads found</h3>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
                We couldn't find any active campaigns for this partner right now.
              </p>
              <Button variant="outline" onClick={() => navigate('/partners')}>
                Browse partners
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <AdCard ad={ad} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
