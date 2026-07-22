import mongoose, { Schema, Document, Types } from 'mongoose';
import { normalise } from '../utils/permissions';

/**
 * A named set of permissions an admin can create and edit.
 *
 * Roles are a starting point, not a cage: a user copies the role's permissions
 * when they are created or invited, and can then be adjusted individually
 * (see `User.permission_overrides`) without that change affecting anyone else
 * holding the same role. Editing a role, by contrast, does move everyone who
 * has it — that is the point of having roles at all.
 */
export interface IRole extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  permissions: string[];
  /**
   * Seeded roles. They can be edited but not deleted, so an install can never
   * end up with no way back into the admin area.
   */
  is_system: boolean;
  /**
   * Set when this role is the baseline for an account type (advertiser,
   * merchant, ...). Users of that type inherit it when they have no role of
   * their own. Empty for staff roles, which are assigned explicitly.
   */
  account_type?: string;
  created_at: Date;
  updated_at: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    permissions: {
      type: [String],
      default: [],
      // Enforced here as well as in the routes so a seed or a script cannot
      // write a write-without-read set either.
      set: (value: unknown) => normalise(value),
    },
    is_system: { type: Boolean, default: false },
    account_type: { type: String, default: '', index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
