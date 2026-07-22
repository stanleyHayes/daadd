import React from 'react';
import { Cookie } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import { WatermarkBanner } from '@/components/ui/Watermark';

export function CookiePolicyPage() {
  return (
    <PageTransition>
      <section className="relative bg-primary-700 text-white py-16 sm:py-20 overflow-hidden">
        <WatermarkBanner icon={<Cookie />} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Cookie Policy</h1>
          <p className="text-sm text-primary-100">Last updated: March 1, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">

        <div className="prose-container space-y-10">
          {/* What Are Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What Are Cookies?</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or smartphone) when you visit a website. They are widely used to make websites work efficiently, provide a better user experience, and supply information to site operators. Cookies may be set by the site you are visiting ("first-party cookies") or by third-party services operating on that site ("third-party cookies").
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              SmartAdDeals uses cookies and similar technologies (such as local storage and pixel tags) to operate our advertising platform, measure ad engagement, and improve your experience. This policy explains what cookies we use, why we use them, and how you can manage your preferences.
            </p>
          </section>

          {/* Types We Use */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Types of Cookies We Use</h2>

            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Essential Cookies</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
                  These cookies are strictly necessary for the platform to function and cannot be disabled. They handle core functionality including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-slate-300">
                  <li>User authentication and session management</li>
                  <li>Security features such as CSRF protection</li>
                  <li>Load balancing and server routing</li>
                  <li>Age verification status for restricted content</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Analytics Cookies</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
                  These cookies help us understand how visitors use SmartAdDeals so we can measure and improve platform performance. The data collected is aggregated and anonymized. Analytics cookies enable:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-slate-300">
                  <li>Page view tracking and navigation flow analysis</li>
                  <li>Feature usage measurement to guide product development</li>
                  <li>Error monitoring and performance diagnostics</li>
                  <li>A/B testing for platform improvements</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Advertising Cookies</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
                  As an advertising platform, SmartAdDeals uses advertising cookies to deliver, measure, and optimize ad campaigns. These cookies are central to the core service we provide to advertisers and users:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-slate-300">
                  <li>Ad engagement tracking (views, clicks, interaction duration)</li>
                  <li>Cross-device attribution to understand campaign reach</li>
                  <li>Reward verification to confirm genuine ad engagement</li>
                  <li>Frequency capping to limit how often you see the same ad</li>
                  <li>Geographic heatmap data collection (aggregated)</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Preference Cookies</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
                  Preference cookies remember your settings and choices to provide a personalized experience:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-slate-300">
                  <li>Theme selection (dark or light mode)</li>
                  <li>Language and locale preferences</li>
                  <li>Dashboard layout customizations</li>
                  <li>Notification and communication preferences</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How to Manage */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How to Manage Cookies</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              You can manage your cookie preferences in several ways:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li><strong>Browser Settings:</strong> Most web browsers allow you to control cookies through their settings. You can typically set your browser to block or delete cookies, or to notify you when a cookie is being set. Refer to your browser's help documentation for instructions.</li>
              <li><strong>Platform Settings:</strong> When available, use the cookie consent banner displayed on your first visit to SmartAdDeals to select which optional cookie categories you wish to allow.</li>
              <li><strong>Opt-Out Links:</strong> For third-party analytics cookies, you can use opt-out mechanisms provided by the respective services (for example, Google Analytics opt-out browser add-on).</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mt-4">
              Please note that disabling essential cookies will prevent the platform from functioning correctly. Disabling advertising cookies may affect your ability to earn rewards, as we cannot verify genuine ad engagement without them.
            </p>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Third-Party Cookies</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              SmartAdDeals works with trusted third-party services that may set cookies on your device. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-slate-300">
              <li><strong>OpenStreetMap:</strong> Our geographic heatmap analytics feature renders maps with Leaflet using map tiles served by OpenStreetMap. No tracking cookies or API keys are used for map rendering. See the <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" className="text-primary-600 dark:text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer">OpenStreetMap Foundation Privacy Policy</a>.</li>
              <li><strong>Analytics Providers:</strong> We use analytics tools to monitor platform health and usage. These services collect anonymous usage data to help us improve the platform.</li>
              <li><strong>Payment Processors:</strong> Our payment providers may set cookies during billing and payout transactions for security and fraud prevention.</li>
              <li><strong>Cloud Infrastructure:</strong> Our hosting and CDN providers may set technical cookies for load balancing and performance optimization.</li>
            </ul>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mt-4">
              We carefully vet all third-party providers and require that they handle data in accordance with applicable privacy regulations.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Updates to This Policy</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We may update this Cookie Policy periodically to reflect changes in our cookie practices, new technologies, or regulatory requirements. When we make changes, we will update the "Last updated" date at the top of this page. For significant changes, we will provide a prominent notice on the platform.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              If you have questions about our use of cookies, please contact us at privacy@daadd.com.
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
