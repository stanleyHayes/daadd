import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role, User, SiteContent, PlatformSetting } from './models';
import { ROLE_TEMPLATES, effectivePermissions } from './utils/permissions';

/**
 * Seeds the roles, the staff accounts and a starting set of website content.
 *
 * These four are SmartAdDeals employees. Everyone else on the platform —
 * advertisers, merchants, consumers — signs up through the public flow, gets an
 * account type rather than a staff role, and never appears here.
 *
 * Safe to re-run: roles and content are matched on a natural key and updated
 * rather than duplicated, and an existing user is never overwritten (so
 * re-running will not reset somebody's password).
 *
 *   npm run seed:team
 *
 * Passwords are generated here and printed once. They are not written to the
 * repo, not logged anywhere else, and cannot be recovered afterwards — send
 * them to each person over something private and have them change it on first
 * sign-in. Set SEED_TEAM_DOMAIN to override the email domain.
 */

const DOMAIN = process.env.SEED_TEAM_DOMAIN || 'smartaddeals.com';

const TEAM: { name: string; handle: string; role: keyof typeof ROLE_TEMPLATES }[] = [
  { name: 'Stanley', handle: 'stanley', role: 'Super Admin' },
  { name: 'Freddy', handle: 'freddy', role: 'Administrator' },
  { name: 'Serwaa', handle: 'serwaa', role: 'Content Editor' },
  { name: 'Fiifi', handle: 'fiifi', role: 'Insights Analyst' },
];

/**
 * Starting content so the marketing site has something to edit rather than a
 * blank form. Everything is created UNPUBLISHED: the site keeps hiding these
 * sections until a human has read the text and decided it is true.
 */
const DEFAULT_CONTENT = [
  {
    type: 'team_member' as const,
    name: 'Your name',
    role: 'Founder',
    body: '',
    order: 0,
  },
  {
    type: 'milestone' as const,
    year: String(new Date().getFullYear()),
    title: 'Platform launch',
    body: 'Replace this with something that actually happened, and the month it happened in.',
    order: 0,
  },
  {
    type: 'testimonial' as const,
    name: 'Customer name',
    role: 'Their job title',
    company: 'Their company',
    body: 'A real quote, used with their permission. Do not publish this until you have both.',
    order: 0,
  },
  {
    type: 'case_study' as const,
    company: 'Customer name',
    metric: '0%',
    metric_label: 'what the figure measures',
    body: 'A result you can evidence if someone asks to see the numbers.',
    name: 'Who said it',
    order: 0,
  },
  {
    type: 'job_opening' as const,
    title: 'Role title',
    department: 'Team',
    location: 'Remote',
    apply_url: `mailto:careers@${DOMAIN}`,
    order: 0,
  },
];

function generatePassword(): string {
  // 18 URL-safe chars: enough entropy that it can be pasted into a password
  // manager and forgotten, rather than something memorable and weak.
  return crypto.randomBytes(14).toString('base64url');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected.\n');

  // --- roles ---------------------------------------------------------------
  const roles = new Map<string, mongoose.Types.ObjectId>();
  for (const [name, template] of Object.entries(ROLE_TEMPLATES)) {
    const role = await Role.findOneAndUpdate(
      { name },
      {
        $set: {
          description: template.description,
          permissions: template.permissions,
          is_system: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    roles.set(name, role._id);
    console.log(`role  ${name.padEnd(16)} ${role.permissions.length} permissions`);
  }

  // --- staff accounts ------------------------------------------------------
  console.log('');
  const credentials: { email: string; password: string; role: string }[] = [];

  for (const member of TEAM) {
    const email = `${member.handle}@${DOMAIN}`;
    const existing = await User.findOne({ email });

    if (existing) {
      // Keep their password; just make sure the role is right.
      existing.role_id = roles.get(member.role);
      existing.role = 'admin';
      await existing.save();
      console.log(`user  ${email.padEnd(30)} exists, role set to ${member.role}`);
      continue;
    }

    const password = generatePassword();
    await User.create({
      name: member.name,
      email,
      password_hash: await bcrypt.hash(password, 10),
      role: 'admin',
      role_id: roles.get(member.role),
      email_verified: true,
      permission_overrides: { granted: [], revoked: [] },
    });

    credentials.push({ email, password, role: member.role });
    console.log(`user  ${email.padEnd(30)} created as ${member.role}`);
  }

  // --- starting website content -------------------------------------------
  console.log('');
  for (const item of DEFAULT_CONTENT) {
    const key = { type: item.type, name: item.name ?? '', title: item.title ?? '' };
    const existing = await SiteContent.findOne(key);
    if (existing) {
      console.log(`content ${item.type.padEnd(14)} already present, left alone`);
      continue;
    }
    await SiteContent.create({ ...item, is_published: false });
    console.log(`content ${item.type.padEnd(14)} created (unpublished)`);
  }

  // Contact block starts empty — the site omits a channel rather than
  // inventing one, and an admin fills these in from the dashboard.
  const contactExists = await PlatformSetting.findOne({ key: 'site.contact' });
  if (!contactExists) {
    await PlatformSetting.create({
      key: 'site.contact',
      value: { email: `hello@${DOMAIN}`, careers_email: `careers@${DOMAIN}` },
    });
    console.log('content contact        seeded with email addresses only');
  }

  // --- credentials ---------------------------------------------------------
  if (credentials.length) {
    console.log('\n' + '─'.repeat(64));
    console.log('PASSWORDS — shown once, not stored anywhere. Send privately.');
    console.log('─'.repeat(64));
    for (const c of credentials) {
      console.log(`${c.email.padEnd(30)} ${c.password}   (${c.role})`);
    }
    console.log('─'.repeat(64));
    console.log('Ask each person to change their password after first sign-in.\n');
  }

  const stanley = await User.findOne({ email: `stanley@${DOMAIN}` })
    .populate<{ role_id: { permissions: string[] } }>('role_id', 'permissions')
    .lean();
  if (stanley) {
    const role = stanley.role_id as unknown as { permissions?: string[] } | null;
    const perms = effectivePermissions(role?.permissions ?? [], stanley.permission_overrides ?? {});
    console.log(`stanley@${DOMAIN} holds ${perms.length} permissions (full access).`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
