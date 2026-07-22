import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * A place an advert can run.
 *
 * Roadmap phases 3-6 (SPECIFICATION.md §12) each add a channel rather than a
 * separate silo: programmatic RTB, connected TV, audio, and retail media all
 * come down to "inventory somebody sells, bought under some pricing model,
 * measured in some unit". Modelling them together means a campaign can target
 * several at once and the reporting adds up, instead of four parallel stacks
 * that each need their own dashboard.
 *
 * What differs per channel is captured in `unit` and `specs`, not in the shape:
 *   - display / RTB      impressions, CPM, creative sizes
 *   - CTV                completed views, CPCV, 15/30s video
 *   - audio              listens, CPM, 15/30s spots
 *   - retail media       clicks or sales, CPC, product listings
 */
export const AD_CHANNELS = ['display', 'rtb', 'ctv', 'audio', 'retail_media'] as const;
export type AdChannelType = (typeof AD_CHANNELS)[number];

/** How the advertiser is charged. */
export const PRICING_MODELS = ['cpm', 'cpc', 'cpcv', 'cpa', 'flat'] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export interface IAdChannel extends Document {
  _id: Types.ObjectId;
  type: AdChannelType;
  /** Display name, e.g. "Roku", "Spotify Ad Studio", "Amazon Ads". */
  name: string;
  /** Supply partner or exchange this inventory comes from. */
  provider: string;
  pricing_model: PricingModel;
  /** In the campaign's currency. CPM is per thousand, everything else per unit. */
  base_rate: number;
  /**
   * Channel-specific requirements the creative must satisfy — durations,
   * dimensions, file types, aspect ratios. Free-form because each channel's
   * partner defines its own, and hard-coding them would mean a deploy every
   * time a partner changes a spec.
   */
  specs: Record<string, unknown>;
  /**
   * Off until a real supply agreement exists. A channel nobody has signed for
   * should not appear as something an advertiser can buy.
   */
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

const AdChannelSchema = new Schema<IAdChannel>(
  {
    type: { type: String, enum: AD_CHANNELS, required: true, index: true },
    name: { type: String, required: true, trim: true },
    provider: { type: String, default: '', trim: true },
    pricing_model: { type: String, enum: PRICING_MODELS, default: 'cpm' },
    base_rate: { type: Number, default: 0, min: 0 },
    specs: { type: Schema.Types.Mixed, default: {} },
    is_enabled: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

AdChannelSchema.index({ type: 1, is_enabled: 1 });

export const AdChannel = mongoose.model<IAdChannel>('AdChannel', AdChannelSchema);
