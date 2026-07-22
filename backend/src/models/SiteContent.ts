import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Editorial content for the public marketing site, owned by admins.
 *
 * Everything here used to be hard-coded arrays inside the React pages, which
 * meant the site shipped with invented testimonials, an invented leadership
 * team and invented company milestones. Moving it behind a model means the
 * marketing site renders only what a real person has actually entered — the
 * sections hide themselves when nothing is published, which is the honest
 * default for a product that has not launched at scale yet.
 *
 * One collection rather than five keeps the admin UI and CRUD surface small.
 * `type` decides which of the optional fields matter; the admin form shows
 * only the relevant ones and the marketing pages read only what they need.
 */
export const SITE_CONTENT_TYPES = [
  'testimonial',
  'case_study',
  'team_member',
  'milestone',
  'job_opening',
  'blog_post',
] as const;

export type SiteContentType = (typeof SITE_CONTENT_TYPES)[number];

export interface ISiteContent extends Document {
  _id: Types.ObjectId;
  type: SiteContentType;
  /** Hidden from the public site until an admin publishes it. */
  is_published: boolean;
  /** Ascending; ties broken by created_at. */
  order: number;

  /** testimonial, case_study: the quote itself. milestone: the description. */
  body: string;
  /** testimonial: author name. team_member: person's name. */
  name: string;
  /** testimonial, team_member: job title. */
  role: string;
  /** testimonial, case_study: the organisation. */
  company: string;
  /** Absolute URL. Falls back to initials in the UI when empty. */
  avatar_url: string;

  /** case_study: the headline figure, e.g. "+340%". Free text on purpose. */
  metric: string;
  /** case_study: what the figure measures, e.g. "conversion lift". */
  metric_label: string;

  /** milestone: the year or period, e.g. "2026". */
  year: string;
  /** milestone, job_opening: the heading. */
  title: string;

  /** job_opening */
  department: string;
  location: string;
  /** job_opening: where "Apply" points. mailto: is fine. */
  apply_url: string;

  /** blog_post: the article itself, plus how it is filed and credited. */
  excerpt: string;
  category: string;
  read_time: string;
  published_at: Date | null;

  created_at: Date;
  updated_at: Date;
}

const SiteContentSchema = new Schema<ISiteContent>(
  {
    type: { type: String, enum: SITE_CONTENT_TYPES, required: true, index: true },
    is_published: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },

    body: { type: String, default: '', trim: true },
    name: { type: String, default: '', trim: true },
    role: { type: String, default: '', trim: true },
    company: { type: String, default: '', trim: true },
    avatar_url: { type: String, default: '', trim: true },

    metric: { type: String, default: '', trim: true },
    metric_label: { type: String, default: '', trim: true },

    year: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },

    department: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    apply_url: { type: String, default: '', trim: true },

    excerpt: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    read_time: { type: String, default: '', trim: true },
    published_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// The public site always reads "published items of one type, in order".
SiteContentSchema.index({ type: 1, is_published: 1, order: 1 });

export const SiteContent = mongoose.model<ISiteContent>('SiteContent', SiteContentSchema);
