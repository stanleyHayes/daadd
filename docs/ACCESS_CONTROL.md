# Access control

There are **two independent axes**. Confusing them is the main way this gets
misconfigured, so they are named and stored separately.

## Axis 1 — account type (`User.role`)

*What kind of party you are in the marketplace.* Set when the account is
created, by which product the person signed up for. Not something an admin
tunes.

| Account type | Who | How they get it |
|---|---|---|
| `advertiser` | A paying customer running campaigns | Public sign-up, then admin approval |
| `campaign_manager` | Someone an advertiser adds to their own campaign team | Invited by their advertiser |
| `analyst` | A read-only seat on an advertiser's account | Invited by their advertiser |
| `merchant` | A business redeeming tokens at the till | Public sign-up |
| `end_user` | A consumer browsing ads and earning tokens | Public sign-up |
| `admin` | SmartAdDeals staff | Seeded, or invited from Roles & Access |

Everyone in the first five rows is a **customer**. Their access is decided by
what they bought, not by anything on the staff side. A paying advertiser never
holds a staff role, however senior they are at their own company.

## Axis 2 — staff role (`User.role_id` → a `Role` document)

*What an internal SmartAdDeals employee may touch in the admin dashboard.*
Only accounts with `role: 'admin'` have one.

These are editable documents, not hard-coded checks. An admin with
`roles:update` can change what any of them means without a deploy.

| Staff role | For | Roughly |
|---|---|---|
| Super Admin | Full access, including managing roles and other admins | Everything |
| Administrator | Runs the platform day to day | Everything except role management and deleting staff |
| Content Editor | Marketing site and submitted media | Website content, moderation, read-only reviews and support |
| Insights Analyst | Reporting | Read-only across campaigns, analytics, heatmaps, benchmarks, storyteller |
| Support Agent | Tickets and customer conversations | Support, messages, read-only users and redemptions |
| Policy & Compliance | Sets the rules the platform runs on | Loyalty thresholds, moderation, advertiser approvals |

### The naming trap

`analyst` is an **account type** a customer can hold. The staff role is called
**Insights Analyst**, deliberately not "Analyst", because a staff role sharing
a name with an account type makes every conversation and every grep ambiguous.

There is a test asserting no staff role is ever named after an account type
(`permissions.test.ts`). If you add a role called "Merchant" or "Advertiser",
it will fail, on purpose.

## Permissions

`<resource>:<action>` over 23 resources and `read` / `create` / `update` /
`delete`.

Two invariants are enforced in `utils/permissions.ts`, not in the UI:

1. **No write without read.** Granting `campaigns:update` to someone who cannot
   list campaigns produces a button on a screen they cannot open, so
   `normalise()` adds the read back.
2. **Revoking a read revokes that resource's writes**, for the same reason from
   the other direction.

Revocations are otherwise literal. Running the revoke list through
`normalise()` would expand "revoke `campaigns:delete`" into "revoke
`campaigns:read`" and silently strip the whole resource — that was a real bug,
caught by a test.

### Role vs individual

A user copies their role's permissions when the account is made. After that,
`permission_overrides.granted` and `.revoked` adjust that one person **without
writing back to the role**, so nobody else holding it moves.

Editing the role itself *does* move everyone who holds it. That is what roles
are for.

Changing someone's role clears their overrides rather than carrying a revoke
from a role that no longer applies.

## Rendering

The rule is that an unpermitted control is **absent, not disabled**. A greyed
out Delete still tells someone the feature exists and invites them to ask why
they cannot use it.

- `usePermissions()` — the resolved set for the signed-in user
- `<Can resource="campaigns" action="create">` — wraps buttons and panels
- `<RequirePermission>` — route guard, holds behind a skeleton until resolved

The JWT deliberately does **not** carry permissions. An admin revoking access
should take effect on the next request, not whenever the token happens to
expire.

### One question, one answer

Customer-facing screens are still gated by the older role matrix in
`lib/rbac.ts`, because customers have no permission set. `canOr(legacy,
resource, action)` picks whichever system actually applies to the account, so
the two never disagree about the same button.

## Seeding

```bash
npm run seed:team          # roles, staff accounts, starter site content
SEED_TEAM_DOMAIN=example.com npm run seed:team
```

Safe to re-run. Existing users are never overwritten, so it will not reset
anyone's password. Passwords for new accounts are generated, printed once and
stored nowhere — send them privately and have people change them on first
sign-in.
