import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { WatermarkBanner } from '@/components/ui/Watermark';

const sections = [
  { id: 'information-we-collect', title: '1. Information We Collect' },
  { id: 'how-we-use', title: '2. How We Use Your Information' },
  { id: 'data-sharing', title: '3. Data Sharing' },
  { id: 'cookies-tracking', title: '4. Cookies & Tracking' },
  { id: 'geographic-data', title: '5. Geographic Data & GDPR' },
  { id: 'data-retention', title: '6. Data Retention' },
  { id: 'your-rights', title: '7. Your Rights' },
  { id: 'childrens-privacy', title: '8. Children\'s Privacy' },
  { id: 'changes', title: '9. Changes to This Policy' },
  { id: 'contact', title: '10. Contact Us' },
];

export function PrivacyPage() {
  return (
    <PageTransition>
      <section className="relative bg-primary-700 text-white py-16 sm:py-20 overflow-hidden">
        <WatermarkBanner icon={<Shield />} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-sm text-primary-100">Last updated: March 1, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">

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
            SmartAdDeals ("we", "our", or "us") operates an intelligent advertising platform that connects advertisers with engaged audiences and rewards users for their attention. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website, and mobile applications.
          </p>

          {/* 1. Information We Collect */}
          <section id="information-we-collect">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Account Information</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              When you register for a SmartAdDeals account, we collect your name, email address, phone number (for age verification and two-factor authentication), and account type (advertiser or user). Advertisers additionally provide company name, billing address, and payment details.
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Usage & Engagement Data</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We collect information about how you interact with ads on our platform, including which ads you view, how long you engage with them, whether you click through, and reward claims. For advertisers, we collect campaign configuration data, uploaded creatives, targeting preferences, and budget settings.
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Device & Technical Data</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We automatically collect device type, operating system, browser type, IP address, referring URLs, and session identifiers. This data helps us optimize ad delivery across devices and power our cross-device attribution analytics.
            </p>
            <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">Reward & Payment Data</h3>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              For users earning rewards, we track reward balances, claim history, and payout preferences. For advertisers, we process payment information through our PCI-compliant payment processor and store transaction records.
            </p>
          </section>

          {/* 2. How We Use Your Information */}
          <section id="how-we-use">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li>Operate and maintain the SmartAdDeals platform, including ad serving, reward distribution, and campaign management.</li>
              <li>Provide advertisers with campaign analytics, including geographic heatmaps, cross-device attribution, anomaly detection, competitive benchmarking, and AI-generated campaign narratives through our Ad Journey Storyteller.</li>
              <li>Power our AI optimization engine, which uses aggregated engagement patterns to recommend bid adjustments, audience targeting, and creative improvements.</li>
              <li>Process reward payouts and advertiser billing transactions.</li>
              <li>Detect and prevent fraud, including click fraud, fake accounts, and suspicious reward claims.</li>
              <li>Comply with legal obligations, including age verification for restricted content.</li>
              <li>Send transactional emails (account confirmations, reward payouts) and, with your consent, marketing communications about platform features.</li>
            </ul>
          </section>

          {/* 3. Data Sharing */}
          <section id="data-sharing">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Data Sharing</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We do not sell your personal information. We share data only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li><strong>With Advertisers (Aggregated Only):</strong> Advertisers receive aggregated, anonymized analytics about campaign performance. They do not receive personally identifiable information about individual users who viewed their ads.</li>
              <li><strong>Service Providers:</strong> We work with trusted third parties for payment processing, cloud hosting, email delivery, and analytics. These providers are contractually bound to use your data only for the services they provide to us.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law, subpoena, or government request, or to protect the rights and safety of SmartAdDeals, our users, or the public.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of the transaction. We will notify affected users in advance.</li>
            </ul>
          </section>

          {/* 4. Cookies & Tracking */}
          <section id="cookies-tracking">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Cookies & Tracking</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              SmartAdDeals uses cookies and similar tracking technologies to operate the platform and measure ad engagement. As an advertising platform, accurate engagement tracking is essential to our core service. We use:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li><strong>Essential Cookies:</strong> Required for authentication, session management, and platform security.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand platform usage patterns and improve the user experience.</li>
              <li><strong>Advertising Cookies:</strong> Enable ad delivery tracking, engagement measurement, and cross-device attribution for campaign analytics.</li>
              <li><strong>Preference Cookies:</strong> Store your settings such as theme preference (dark/light mode) and notification preferences.</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mt-4">
              For detailed information about the cookies we use and how to manage them, please see our <Link to="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          {/* 5. Geographic Data & GDPR */}
          <section id="geographic-data">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Geographic Data & GDPR</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Our platform uses geographic data to power location-based ad targeting and our geographic heatmap analytics feature. We derive approximate location from IP addresses and, when you grant permission, from device GPS data. Geographic data is aggregated for advertiser analytics and is never shared at a level that could identify an individual user's precise location.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              For users in the European Economic Area (EEA), United Kingdom, and Switzerland, we comply with the General Data Protection Regulation (GDPR). Our lawful bases for processing include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li><strong>Contract Performance:</strong> Processing necessary to provide the SmartAdDeals service, deliver ads, and process rewards.</li>
              <li><strong>Legitimate Interest:</strong> Fraud detection, platform security, and aggregated analytics.</li>
              <li><strong>Consent:</strong> Marketing communications, non-essential cookies, and precise geolocation tracking.</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mt-4">
              Data transfers outside the EEA are protected by Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          {/* 6. Data Retention */}
          <section id="data-retention">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We retain your account data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law (such as financial transaction records, which we retain for 7 years for tax and audit purposes).
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              Aggregated, anonymized analytics data (which cannot identify individuals) may be retained indefinitely for trend analysis and platform improvement. Ad engagement data used for reward verification is retained for 90 days after payout.
            </p>
          </section>

          {/* 7. Your Rights */}
          <section id="your-rights">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Your Rights</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
              <li><strong>Restriction:</strong> Request restricted processing while a dispute is resolved.</li>
              <li><strong>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mt-4">
              To exercise any of these rights, contact us at privacy@daadd.com. We will respond within 30 days.
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section id="childrens-privacy">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">8. Children's Privacy</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              SmartAdDeals is not intended for children under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child under 16 has provided us with personal data, we will delete that information promptly. If you believe a child has provided us with their data, please contact us at privacy@daadd.com.
            </p>
          </section>

          {/* 9. Changes to This Policy */}
          <section id="changes">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will notify you of material changes by posting the updated policy on this page with a new "Last updated" date. For significant changes, we will also send a notification to your registered email address. Your continued use of SmartAdDeals after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 10. Contact Us */}
          <section id="contact">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10. Contact Us</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 text-sm text-gray-600 dark:text-slate-300 space-y-1">
              <p><strong className="text-gray-900 dark:text-white">SmartAdDeals Inc.</strong></p>
              <p>Attn: Data Protection Officer</p>
              <p>Email: privacy@daadd.com</p>
              <p>Address: 100 Market Street, Suite 300, San Francisco, CA 94105</p>
              <p>EU Representative: SmartAdDeals EU Ltd., Dublin, Ireland</p>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
