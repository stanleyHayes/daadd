import React from 'react';
import { PageTransition } from '@/components/ui/PageTransition';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'account-registration', title: '2. Account Registration' },
  { id: 'advertiser-terms', title: '3. Advertiser Terms' },
  { id: 'user-terms', title: '4. User Terms' },
  { id: 'prohibited-activities', title: '5. Prohibited Activities' },
  { id: 'intellectual-property', title: '6. Intellectual Property' },
  { id: 'payment-terms', title: '7. Payment Terms' },
  { id: 'limitation-of-liability', title: '8. Limitation of Liability' },
  { id: 'termination', title: '9. Termination' },
  { id: 'governing-law', title: '10. Governing Law' },
  { id: 'contact', title: '11. Contact' },
];

export function TermsPage() {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-10">Last updated: March 1, 2026</p>

        {/* Table of Contents */}
        <nav className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-12">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Table of Contents</h2>
          <ol className="space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose-container space-y-10">
          <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
            Welcome to AdPlatform. These Terms of Service ("Terms") govern your access to and use of the AdPlatform platform, including our website, mobile applications, and all related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
          </p>

          {/* 1 */}
          <section id="acceptance">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              By creating an account, accessing, or using AdPlatform, you confirm that you are at least 16 years of age, have the legal capacity to enter into a binding agreement, and agree to comply with these Terms and our Privacy Policy. If you are using AdPlatform on behalf of a company or organization, you represent that you have the authority to bind that entity to these Terms.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or platform notification. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* 2 */}
          <section id="account-registration">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Account Registration</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              You must register for an account to access most features of AdPlatform. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              AdPlatform offers two account types: Advertiser accounts (for creating and managing ad campaigns) and User accounts (for browsing ads and earning rewards). Some features, including AI optimization, anomaly detection, and benchmarking, are available only to Advertiser accounts with the appropriate subscription tier.
            </p>
          </section>

          {/* 3 */}
          <section id="advertiser-terms">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Advertiser Terms</h2>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Campaign Creation</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Advertisers may create campaigns by specifying targeting criteria (industry, geography, demographics), uploading creative assets, setting budgets, and defining campaign duration. Campaigns are subject to review and may be rejected if they violate our content guidelines.
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Budget & Billing</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Campaign budgets are set by the advertiser and charged based on engagement (cost per view or cost per click, depending on campaign configuration). You authorize AdPlatform to charge your payment method for all campaign costs incurred. Budget caps are enforced in real time; however, due to processing delays, actual spend may exceed your daily budget by up to 10%.
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Content Guidelines</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              Ad creatives must not contain misleading claims, prohibited products (illegal substances, weapons), hate speech, sexually explicit content, or content that infringes on third-party intellectual property. Age-restricted content (alcohol, gambling) must be properly flagged and will only be shown to verified users above the applicable age threshold. AdPlatform reserves the right to remove any ad that violates these guidelines without refund.
            </p>
          </section>

          {/* 4 */}
          <section id="user-terms">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. User Terms</h2>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Reward Earning</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Users earn rewards by viewing and engaging with ads on the AdPlatform platform. Reward amounts are set by advertisers and displayed before engagement. Rewards are credited to your AdPlatform wallet upon verified engagement. Engagement must be genuine; automated viewing, scripts, or other inauthentic engagement methods will result in reward forfeiture and potential account termination.
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Eligibility</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              To earn and redeem rewards, you must be at least 16 years old, have a verified account, and reside in a supported country. Reward payouts are subject to minimum balance requirements ($5.00 minimum) and may be processed via bank transfer, PayPal, or platform credit. AdPlatform reserves the right to withhold payouts pending fraud review.
            </p>
          </section>

          {/* 5 */}
          <section id="prohibited-activities">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Prohibited Activities</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li>Use bots, scripts, or automated tools to view ads, claim rewards, or interact with the platform.</li>
              <li>Create multiple accounts to artificially inflate reward earnings.</li>
              <li>Attempt to reverse-engineer, decompile, or access the source code of the AdPlatform platform.</li>
              <li>Interfere with or disrupt the platform, servers, or networks connected to AdPlatform.</li>
              <li>Engage in click fraud or artificially inflate campaign metrics.</li>
              <li>Use the platform to distribute malware, phishing content, or other harmful materials.</li>
              <li>Scrape or harvest user data from the platform.</li>
              <li>Impersonate another person or entity, or misrepresent your affiliation with a person or entity.</li>
            </ul>
          </section>

          {/* 6 */}
          <section id="intellectual-property">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Intellectual Property</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              The AdPlatform platform, including its design, features, code, analytics tools (heatmaps, anomaly detection, Ad Journey Storyteller), and branding, is the intellectual property of AdPlatform Inc. and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of the platform without our written consent.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              Advertisers retain ownership of their creative assets. By uploading content to AdPlatform, you grant us a non-exclusive, worldwide license to display, distribute, and analyze your creatives for the purpose of operating the Service and providing campaign analytics.
            </p>
          </section>

          {/* 7 */}
          <section id="payment-terms">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Payment Terms</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              All fees are quoted in US Dollars unless otherwise specified. Advertiser campaign charges are billed monthly or upon reaching your billing threshold, whichever comes first. Invoices are due within 15 days of issuance. Late payments may incur a 1.5% monthly interest charge.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              User reward payouts are processed within 5 business days of a withdrawal request. AdPlatform is not responsible for delays caused by third-party payment processors or banking institutions. Rewards are non-transferable and have no cash value until redeemed through the official payout process.
            </p>
          </section>

          {/* 8 */}
          <section id="limitation-of-liability">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADPLATFORM AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              Our total liability for any claim arising from or related to the Service shall not exceed the greater of (a) the amount you paid to AdPlatform in the 12 months preceding the claim, or (b) $100. The Service is provided "as is" without warranties of any kind, express or implied.
            </p>
          </section>

          {/* 9 */}
          <section id="termination">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">9. Termination</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              You may terminate your account at any time through the Settings page or by contacting support. For advertisers, termination will stop all active campaigns; you remain responsible for any charges incurred before termination. Remaining reward balances for users will be paid out if they meet the minimum payout threshold.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              AdPlatform may suspend or terminate your account at any time for violation of these Terms, suspected fraud, or at our discretion with 30 days' notice. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive (including intellectual property, limitation of liability, and governing law) will remain in effect.
            </p>
          </section>

          {/* 10 */}
          <section id="governing-law">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10. Governing Law</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved exclusively in the state or federal courts located in San Francisco County, California. For users in the European Union, nothing in this section limits your rights under mandatory consumer protection laws of your country of residence.
            </p>
          </section>

          {/* 11 */}
          <section id="contact">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">11. Contact</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 text-sm text-gray-600 dark:text-slate-300 space-y-1">
              <p><strong className="text-gray-900 dark:text-white">AdPlatform Inc.</strong></p>
              <p>Attn: Legal Department</p>
              <p>Email: legal@adplatform.com</p>
              <p>Address: 100 Market Street, Suite 300, San Francisco, CA 94105</p>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
