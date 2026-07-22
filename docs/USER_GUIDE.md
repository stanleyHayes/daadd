# User guide

What each kind of account can do, and how to do the things they'll actually need
to do.

The permissions listed here are read from the seeded roles, so they match what is
really in the database rather than what anyone intended. If an admin edits a role
in **Roles & Access**, that role's section here goes out of date — the app is the
source of truth, not this file.

If a screen or a button isn't there, that's the system working. Anything you lack
permission for is not rendered at all, rather than shown greyed out. So "I can't
find the Delete button" usually means "you don't have delete on that area", not
"it moved".

---

# Part 1 — SmartAdDeals staff

Four people hold these today. Sign in, then **Settings → Security → Change
Password** before doing anything else.

## Super Admin

*Stanley.* Everything, including the two things no one else can touch: creating
roles and deleting staff accounts.

**Only you can:**

- Create a new role, or change what an existing role means
- Give one person an extra permission without moving everyone who shares their role
- Delete a staff account

**Roles & Access** is the screen that matters. On the left is every role; pick one
and the grid on the right shows what it can reach, as View / Create / Edit /
Delete per area. Tick a box, press Save, and everyone holding that role moves with
it.

Two rules the grid enforces, because the server enforces them too:

- Ticking Create, Edit or Delete automatically ticks View. You can't edit
  something you can't see.
- Unticking View clears that whole row, for the same reason.

**To adjust one person instead of a whole role**, find them under People and press
**Adjust**. Those changes are recorded against that person only; their role is
left alone. This is the right tool when Freddy needs one extra thing, not a
promotion.

**To add someone**, People → Invite. Pick the role they start with. They're
created without a password and set their own through the reset link, so you never
handle it.

Built-in roles show a padlock. You can edit what they mean but not delete them,
which is what stops an install locking itself out of its own admin area. A role
still assigned to people refuses to delete and tells you how many.

## Administrator

*Freddy.* Runs the platform day to day — 87 of the 92 permissions.

**You can:** everything across campaigns, adverts, analytics, anomalies, AI
optimisation, heatmaps, benchmarking, storyteller, messages, outlets,
redemptions, reviews, rewards, campaign teams, ad accounts, advertiser approvals,
review moderation, loyalty settings, website content, billing and support.

**You can't:** touch Roles & Access, or delete a staff account. You can create and
edit staff, just not remove them. Both of those sit with the Super Admin
deliberately — the person who can rewrite permissions should be a short list.

**Approving an advertiser:** Advertiser Approvals shows everyone waiting. An
advertiser can't set a campaign live until they're approved, their email is
verified and billing is set up, so this is a real gate rather than a formality.

## Content Editor

*Serwaa.* The public website and the media people upload.

**Your screens:** Website Content, Review Moderation. Support tickets and reviews
are visible read-only for context.

**Website Content** is the CMS behind the marketing site. Six tabs: Testimonials,
Case studies, Team, Milestones, Job openings, Blog posts. Plus contact details at
the bottom.

The important behaviour: **nothing appears on the public site until you publish
it**, and each section of the site hides itself entirely while its list is empty.
An About page with no team members published simply has no team section — it
doesn't show an empty grid or placeholder faces.

That's deliberate. The site previously shipped with invented testimonials,
invented staff and invented milestones. Everything now starts unpublished so a
person decides it's true before a visitor sees it.

The seeded starter items are **placeholder text, not content**. Read them before
publishing. "Customer name / Their job title / A real quote, used with their
permission" is a prompt, not a testimonial.

**Contact details** work the same way. Leave the phone number blank and the site
omits the phone channel rather than printing a number nobody answers. The company
name and legal contact emails also feed the Privacy and Terms pages, which show
"not published yet" until you fill them in.

**Review Moderation** queues photos and videos people attach to reviews. The
reviewer's base tokens are already paid; approving releases the media bonus,
rejecting removes the file and pays nothing extra.

## Insights Analyst

*Fiifi.* Read-only across reporting. Nine permissions, all View.

**You can see:** campaigns, adverts, analytics, anomalies, heatmaps,
benchmarking, storyteller, redemptions, reviews.

**You can't change anything.** No editing campaigns, no resolving anomalies, no
touching content or access. If you need to change something, ask an
Administrator — or ask Stanley to grant you that one permission individually.

**Worth knowing about the numbers:** campaign delivery figures come from recorded
events. Where nothing has been recorded you'll see zero and an empty state, not
an estimate. Trend arrows are omitted rather than shown when there's no earlier
period to compare against. If a chart looks empty, that means no data, not a
broken page.

## Support Agent

Not assigned yet. Tickets and customer conversations: read and reply to support,
read and send messages, look up a user, view redemptions. No campaign or content
access.

Useful when someone reports a wrong reward: you can see their redemptions to
check what actually happened, without being able to change it.

## Policy & Compliance

Not assigned yet. Sets the rules rather than operating the platform.

**You can:** change loyalty and VIP thresholds, moderate reviews including
deleting them, approve or reject advertisers, read support and redemptions.

**You can't:** run campaigns, edit website content, or change anyone's access.

**Loyalty & VIP** is where you set what qualifies someone for VIP — minimum
merchant visits, purchases, reviews and engagement score. Setting a value to 0
ignores that requirement. Changes apply the next time each member's status is
evaluated, not retroactively.

---

# Part 2 — Customers

These aren't staff roles. An account type is set when someone signs up, according
to which product they came for, and it decides what they can reach. Nobody in
this section holds a staff role, however senior they are at their own company.

## Advertiser

The paying customer. 34 permissions — the widest customer account.

**Campaigns:** create, edit, delete. Set budget, targeting, dates, creatives, and
the reward economics — what share of your discount goes back to consumers as
tokens, how many tokens each interaction earns, and a cap on the total. The
campaign pauses itself when that token pool runs out and tells you.

**Before you can go live** you need a verified email, admin approval and billing
set up. All three.

**Reporting:** analytics, heatmaps, benchmarking, the Ad Journey Storyteller, and
anomaly alerts you can resolve. Numbers are aggregated from real recorded events;
an empty chart means nothing was recorded, not that something is broken.

**Outlets** are your branches. Add them so customers can say which one they
visited when they redeem, and so your merchant reporting splits by location.

**Your own team:** invite people onto your campaigns as admin, editor or viewer.
That's separate from anything on the SmartAdDeals side — you're granting access
to your campaigns, not to the platform.

**Ad accounts** connect external platforms so metrics sync. Tokens are encrypted;
use Test to check a connection.

## Campaign Manager

Someone an advertiser adds to their team. Eight permissions.

**You can:** view and edit campaigns and adverts, view analytics and heatmaps,
read and send messages.

**You can't:** create a campaign, delete one, or touch billing. You work on
campaigns that already exist.

## Analyst

A read-only seat on an advertiser's account. Five permissions, all View:
campaigns, analytics, heatmaps, benchmarking, storyteller.

Nothing you do can change a campaign. Useful for a stakeholder who needs the
numbers without the risk.

> Note the name. There is also an **Insights Analyst** staff role for
> SmartAdDeals employees. Different thing, different side of the platform.

## Merchant

A business redeeming tokens at the till. Ten permissions.

**Scanning a customer's QR:** open Merchant → Scan Customer QR. The code expires
after about two minutes, so scan it while they're standing there. Enter what they
bought — itemised if you want a proper receipt — and the discount is worked out
from your own active campaign. Tokens are only deducted after you approve.

The discount comes from *your* campaign, not from whatever the customer's app
suggests. That's on purpose: it stops a customer pointing at someone else's
100%-discount campaign.

**Merchant Performance** shows what the platform actually brought you: visits,
redemptions, revenue, discounts given and redeemed, average spend, repeat rate
and satisfaction. It's empty until customers start redeeming.

**Outlets** are your branches. Add them so customers can pick the right one.

## End User (consumer)

Browse ads, earn tokens, spend them. Four permissions — no dashboard access at
all.

**Earning:** view adverts, click through, write reviews, upload photos. Each
campaign sets its own rates; the "What you can earn" panel on any advert shows
them, and the Token Calculator estimates across live campaigns.

**Streaks and VIP** multiply what you earn. Streaks build on consecutive days;
VIP is automatic once you meet the thresholds.

**Spending:** Redeem, pick the branch you're at, choose how many tokens, show the
QR to the cashier. The code expires after about two minutes and tokens leave your
balance only after the merchant approves.

**Messaging** lets you ask a company about a promotion directly.

---

# Common questions

**A menu item vanished.** You don't have View on that area. Ask an Administrator,
or Stanley for a one-person adjustment.

**Someone needs one extra thing.** Roles & Access → People → Adjust. Don't change
the role for one person's sake — it moves everyone who shares it.

**A new starter needs the same access as someone existing.** Give them the same
role. If that person has individual adjustments, those don't copy; grant them
again explicitly.

**Someone is leaving.** Super Admin deletes the account. If they held a custom
role nobody else has, reassign or delete the role after.

**Changing a role takes effect immediately** — permissions are resolved per
request, not baked into the sign-in token. Revoking access doesn't wait for
anyone to sign out.

**A page shows zeros.** That's real. Delivery metrics come from recorded events
and are never estimated. Zero means nothing happened yet.

**Passwords.** Reset via the sign-in link. Nobody, including the Super Admin, can
read an existing password.
