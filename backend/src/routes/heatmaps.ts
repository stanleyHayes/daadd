import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Campaign } from '../models';
import { authMiddleware } from '../middleware/auth';
import { success } from '../utils/response';
import { seededRandom, pickSeeded } from '../utils/seeded';

const router = Router();

const CITIES = [
  { city: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.187 },
  { city: 'Kumasi', country: 'Ghana', lat: 6.6885, lng: -1.6244 },
  { city: 'Takoradi', country: 'Ghana', lat: 4.9016, lng: -1.7603 },
  { city: 'Tamale', country: 'Ghana', lat: 9.4008, lng: -0.8393 },
  { city: 'Cape Coast', country: 'Ghana', lat: 5.1053, lng: -1.2466 },
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986 },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { city: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { city: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.006 },
  { city: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
  { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
];

const DEMOGRAPHICS = [
  'Adults 25-34',
  'Adults 18-24',
  'Adults 35-44',
  'Mobile-first users',
  'Urban professionals',
  'Students',
];

const POINTS_PER_CITY = 8; // 15 cities x 8 = 120 points (>100 needed for the map view)

router.get('/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    if (!Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ success: false, message: 'Invalid campaign id' });
      return;
    }

    const campaign = await Campaign.findById(campaignId).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }

    // Deterministic distribution seeded from the campaign id
    const rng = seededRandom(`heatmap:${campaignId}`);

    // Weight cities: shuffle deterministically, assign descending base weights
    const shuffled = [...CITIES].sort(() => rng() - 0.5);
    const cityStats = shuffled.map((c, i) => {
      const baseViews = Math.round(4000 * Math.pow(0.78, i) * (0.8 + rng() * 0.4)) + 150;
      const ctr = Math.round((0.8 + rng() * 4.5) * 100) / 100;
      return { ...c, views: baseViews, ctr, demographic: pickSeeded(rng, DEMOGRAPHICS) };
    });

    const points = cityStats.flatMap((c) =>
      Array.from({ length: POINTS_PER_CITY }, () => ({
        lat: Math.round((c.lat + (rng() - 0.5) * 0.4) * 10000) / 10000,
        lng: Math.round((c.lng + (rng() - 0.5) * 0.4) * 10000) / 10000,
        weight: Math.round((c.views / 4000) * 100) / 100,
        city: c.city,
        country: c.country,
        region: `${c.city}, ${c.country}`,
        views: Math.round(c.views / POINTS_PER_CITY),
        ctr: c.ctr,
        demographic: c.demographic,
      }))
    );

    const totalViews = cityStats.reduce((s, c) => s + c.views, 0);
    const avgCtr =
      Math.round(
        (cityStats.reduce((s, c) => s + c.ctr * c.views, 0) / Math.max(1, totalViews)) * 100
      ) / 100;

    const topRegions = [...cityStats]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((c) => ({
        name: `${c.city}, ${c.country}`,
        views: c.views,
        ctr: c.ctr,
        demographic: c.demographic,
      }));

    res.json(
      success({
        points,
        total_views: totalViews,
        avg_ctr: avgCtr,
        active_regions: cityStats.length,
        top_regions: topRegions,
      })
    );
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch heatmap data' });
  }
});

export default router;
