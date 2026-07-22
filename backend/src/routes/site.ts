import { Router, Request, Response } from 'express';
import { SiteContent, SITE_CONTENT_TYPES, SiteContentType, PlatformSetting } from '../models';
import { Campaign, User, Event, Outlet } from '../models';
import { authMiddleware, requireRole } from '../middleware/auth';
import { success } from '../utils/response';

const router = Router();

/** Contact details live in the generic settings store rather than their own model. */
const CONTACT_KEY = 'site.contact';

export interface SiteContact {
  email: string;
  phone: string;
  address_line: string;
  address_city: string;
  hours_weekdays: string;
  hours_saturday: string;
  hours_sunday: string;
  careers_email: string;
  /** Named on the Privacy and Terms pages. Blank hides the whole block. */
  legal_entity: string;
  privacy_email: string;
  legal_email: string;
}

/**
 * Empty rather than invented. The marketing site hides a contact channel when
 * its value is blank, so an unconfigured install shows nothing instead of a
 * placeholder phone number a customer might actually dial.
 */
const EMPTY_CONTACT: SiteContact = {
  email: '',
  phone: '',
  address_line: '',
  address_city: '',
  hours_weekdays: '',
  hours_saturday: '',
  hours_sunday: '',
  careers_email: '',
  legal_entity: '',
  privacy_email: '',
  legal_email: '',
};

async function readContact(): Promise<SiteContact> {
  const row = await PlatformSetting.findOne({ key: CONTACT_KEY }).lean();
  return { ...EMPTY_CONTACT, ...((row?.value as Partial<SiteContact>) || {}) };
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * GET /site/content?type=testimonial
 * Published items only. Unknown or missing type returns everything published,
 * which is what the admin preview uses.
 */
router.get('/content', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as SiteContentType | undefined;
    const filter: Record<string, unknown> = { is_published: true };
    if (type && SITE_CONTENT_TYPES.includes(type)) filter.type = type;

    const items = await SiteContent.find(filter).sort({ order: 1, created_at: 1 }).lean();
    res.json(success(items));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** GET /site/contact — public contact details for the marketing site. */
router.get('/contact', async (_req: Request, res: Response) => {
  try {
    res.json(success(await readContact()));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /site/stats
 *
 * Real counts, computed from the database on every request. These replace the
 * invented "12,000+ campaigns / 2.3M daily impressions" figures the landing
 * page used to hard-code: a number that is derived cannot drift into a lie.
 *
 * The marketing page hides any stat that comes back as zero, so a young
 * install simply shows fewer numbers rather than embarrassing ones.
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [campaigns, advertisers, adViews, cities] = await Promise.all([
      Campaign.countDocuments({ status: { $in: ['active', 'completed'] } }),
      User.countDocuments({ role: 'advertiser' }),
      Event.countDocuments({ event_type: 'view' }),
      Outlet.distinct('city', { city: { $nin: ['', null] } }),
    ]);

    res.json(
      success({
        campaigns,
        advertisers,
        adViews,
        cities: cities.length,
      })
    );
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

router.use(authMiddleware, requireRole('admin'));

/** GET /site/admin/content — every item, published or not. */
router.get('/admin/content', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as SiteContentType | undefined;
    const filter: Record<string, unknown> = {};
    if (type && SITE_CONTENT_TYPES.includes(type)) filter.type = type;

    const items = await SiteContent.find(filter).sort({ type: 1, order: 1, created_at: 1 }).lean();
    res.json(success(items));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Only these are writable; anything else in the body is ignored. */
const WRITABLE = [
  'is_published',
  'order',
  'body',
  'name',
  'role',
  'company',
  'avatar_url',
  'metric',
  'metric_label',
  'year',
  'title',
  'department',
  'location',
  'apply_url',
  'excerpt',
  'category',
  'read_time',
  'published_at',
] as const;

function pickWritable(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of WRITABLE) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

router.post('/admin/content', async (req: Request, res: Response) => {
  try {
    const type = req.body?.type as SiteContentType;
    if (!SITE_CONTENT_TYPES.includes(type)) {
      res.status(400).json({
        success: false,
        message: `type must be one of: ${SITE_CONTENT_TYPES.join(', ')}`,
      });
      return;
    }

    const item = await SiteContent.create({ ...pickWritable(req.body || {}), type });
    res.status(201).json(success(item, 'Content created'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/admin/content/:id', async (req: Request, res: Response) => {
  try {
    const item = await SiteContent.findByIdAndUpdate(
      req.params.id,
      { $set: pickWritable(req.body || {}) },
      { new: true, runValidators: true }
    );
    if (!item) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }
    res.json(success(item, 'Content updated'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/admin/content/:id', async (req: Request, res: Response) => {
  try {
    const item = await SiteContent.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Content not found' });
      return;
    }
    res.json(success({ id: req.params.id }, 'Content removed'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** PUT /site/admin/contact — replaces the whole contact block. */
router.put('/admin/contact', async (req: Request, res: Response) => {
  try {
    const incoming = req.body || {};
    const value: SiteContact = { ...EMPTY_CONTACT };
    for (const key of Object.keys(EMPTY_CONTACT) as (keyof SiteContact)[]) {
      if (typeof incoming[key] === 'string') value[key] = incoming[key].trim();
    }

    await PlatformSetting.findOneAndUpdate(
      { key: CONTACT_KEY },
      { $set: { value } },
      { upsert: true, new: true }
    );
    res.json(success(value, 'Contact details updated'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
