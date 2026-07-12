import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, BadgeCheck, ArrowRight, TrendingUp, Megaphone } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { Button } from '@/components/ui/Button';
import { usePublicAds, type PublicAd } from '@/hooks/usePublicAds';
import { motion } from 'framer-motion';
import { SkeletonAdCard } from '@/components/ui/Skeleton';

interface PartnerAggregate {
  name: string;
  logo: string;
  verified: boolean;
  industries: string[];
  adCount: number;
  totalReward: number;
  ads: PublicAd[];
}

function makeSlug(name: string) {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
}

export function PartnersPage() {
  const navigate = useNavigate();
  const { data: ads, isLoading } = usePublicAds({ sort: 'reward' });

  const partners = useMemo<PartnerAggregate[]>(() => {
    if (!ads) return [];
    const map = new Map<string, PartnerAggregate>();
    ads.forEach((ad) => {
      const name = ad.advertiser?.name || ad.advertiser?.id || 'Advertiser';
      const existing = map.get(name);
      if (existing) {
        existing.ads.push(ad);
        existing.adCount += 1;
        existing.totalReward += ad.rewardAmount || 0;
        if (!existing.industries.includes(ad.industry)) existing.industries.push(ad.industry);
      } else {
        map.set(name, {
          name,
          logo: ad.advertiser?.logo || '',
          verified: ad.advertiser?.verified ?? true,
          industries: [ad.industry].filter(Boolean),
          adCount: 1,
          totalReward: ad.rewardAmount || 0,
          ads: [ad],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.adCount - a.adCount);
  }, [ads]);

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-secondary">
        {/* Hero */}
        <section className="relative bg-primary-700 text-white py-20 overflow-hidden">
          <WatermarkBanner icon={<Building2 />} />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary-500 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6"
            >
              <Megaphone className="h-4 w-4 text-secondary-400" />
              <span>Advertisers & Creators</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            >
              Our Partners
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-primary-100 max-w-2xl mx-auto"
            >
              Discover the brands and creators powering campaigns on AdPlatform. Browse their profiles to see what they are advertising.
            </motion.p>
          </div>
        </section>

        {/* Partners grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonAdCard key={i} />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-20 bg-card-bg rounded-2xl border border-border-color">
              <Building2 className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">No partners yet</h2>
              <p className="text-text-secondary max-w-md mx-auto">
                There are no active advertisers on the platform right now. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner, index) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-card-bg rounded-2xl border border-border-color p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                  onClick={() => navigate(`/partners/${makeSlug(partner.name)}`)}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xl font-bold text-primary-700 dark:text-primary-300">
                        {partner.logo ? (
                          <img src={partner.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          partner.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary flex items-center gap-1.5">
                          {partner.name}
                          {partner.verified && (
                            <BadgeCheck className="h-4 w-4 text-secondary-500" aria-label="Verified partner" />
                          )}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {partner.industries.slice(0, 3).join(' • ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-bg-secondary dark:bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                        <Megaphone className="h-3.5 w-3.5" />
                        Ads
                      </div>
                      <p className="text-lg font-bold text-text-primary">{partner.adCount}</p>
                    </div>
                    <div className="bg-bg-secondary dark:bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Rewards
                      </div>
                      <p className="text-lg font-bold text-text-primary">
                        ${partner.totalReward.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full group-hover:bg-primary-700 group-hover:text-white group-hover:border-primary-700 transition-colors">
                    View profile <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
