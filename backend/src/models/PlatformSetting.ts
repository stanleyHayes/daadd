import mongoose, { Schema, Document } from 'mongoose';

/**
 * Small key/value store for administrator-tunable platform configuration
 * (e.g. the VIP qualification criteria). Kept generic so future settings
 * don't need a new collection each time.
 */
export interface IPlatformSetting extends Document {
  key: string;
  value: unknown;
  updated_at: Date;
}

const PlatformSettingSchema = new Schema<IPlatformSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const PlatformSetting = mongoose.model<IPlatformSetting>(
  'PlatformSetting',
  PlatformSettingSchema
);
