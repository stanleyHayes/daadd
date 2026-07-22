import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Role } from '../models';
import { effectivePermissions } from '../utils/permissions';

/** Read-only check that seeding produced the accounts and roles it claims to. */
async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const users = await User.find({ email: /@smartaddeals\.com$/ })
    .populate<{ role_id: { name: string; permissions: string[] } }>('role_id', 'name permissions')
    .sort({ created_at: 1 })
    .lean();

  for (const user of users) {
    const role = user.role_id as unknown as { name?: string; permissions?: string[] } | null;
    const perms = effectivePermissions(role?.permissions ?? [], user.permission_overrides ?? {});
    console.log(
      `${user.email.padEnd(30)} ${(role?.name ?? '—').padEnd(18)} ${String(perms.length).padStart(3)} permissions`
    );
  }

  const roles = await Role.find().select('name account_type permissions').sort({ account_type: 1, name: 1 }).lean();
  console.log(`\n${roles.length} roles:`);
  for (const r of roles) {
    const kind = r.account_type ? `baseline for ${r.account_type}` : 'staff role';
    console.log(`  ${r.name.padEnd(18)} ${String(r.permissions.length).padStart(3)}  ${kind}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
