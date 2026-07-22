import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { ArrowLeft, Clock, Share2, Bookmark, Calendar, Newspaper } from 'lucide-react';
import { WatermarkBanner } from '@/components/ui/Watermark';
import { PageTransition } from '@/components/ui/PageTransition';

import { cn } from '@/lib/utils';

interface BlogPost {
  title: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  image: string;
  content: string;
}

const blogPostsDatabase = {
  1: {
    title: 'The Future of Geo-Targeted Advertising in 2026',
    author: 'Alex Chen',
    date: 'March 10, 2026',
    readTime: '6 min read',
    category: 'AdTech Trends',
    excerpt: 'How advances in geographic data and privacy-first targeting are reshaping the way advertisers reach local audiences at scale.',
    image: 'bg-blue-50 dark:bg-blue-900/20',
    content: `
    <h2>The Evolution of Geographic Targeting</h2>
    <p>Geographic targeting has always been a cornerstone of effective advertising. Whether it's a local restaurant promoting weekend specials or a national brand targeting major metros, location-based ads have proven to drive higher engagement and ROI.</p>

    <p>However, 2026 marks a significant inflection point. Privacy regulations like GDPR and evolving iOS privacy changes have forced the industry to rethink how we collect, store, and use location data. At the same time, new technologies are enabling hyper-precise, privacy-compliant geographic targeting at an unprecedented scale.</p>

    <h2>What's Changing</h2>
    <p><strong>1. Privacy-First Location Data</strong></p>
    <p>Rather than relying on precise GPS coordinates or IP addresses, advertisers are increasingly turning to privacy-safe location signals like ZIP codes, neighborhood clusters, and foot traffic patterns. These give you the geographic targeting power without the privacy concerns.</p>

    <p><strong>2. Contextual + Geographic Fusion</strong></p>
    <p>The combination of contextual signals (what someone is reading, watching, buying) with geographic information creates a powerful, privacy-compliant targeting engine. An ad about winter boots gets better ROI in colder climates—and we know that through both context and location.</p>

    <p><strong>3. Real-Time Geofencing for Mobile-First Brands</strong></p>
    <p>Retail and hospitality brands are leveraging real-time geofencing to reach users entering competitor locations or high-value shopping zones. The timing, precision, and privacy aspects are now mature enough for mass adoption.</p>

    <h2>What SmartAdDeals Offers</h2>
    <p>Our geographic heatmap feature gives advertisers a real-time view of where their ads are performing best. Combined with our AI optimization engine, we automatically adjust targeting and creative based on regional performance—without ever touching raw location data.</p>

    <p>As privacy regulations tighten, the brands that master privacy-first geographic targeting will be the ones winning with local audiences in 2026 and beyond.</p>
    `,
  },
  2: {
    title: 'Introducing the Ad Journey Storyteller',
    author: 'Maria Silva',
    date: 'March 5, 2026',
    readTime: '4 min read',
    category: 'Platform Updates',
    excerpt: 'Our latest feature transforms raw campaign analytics into compelling narratives. Learn how it works and why it matters for your reporting.',
    image: 'bg-purple-50 dark:bg-purple-900/20',
    content: `
    <h2>Why Storytelling Matters in Advertising</h2>
    <p>Numbers tell part of the story. A 15% increase in CTR, $50K in spend, 2.3M impressions—these metrics are crucial. But they don't tell the *story* behind your campaign's success (or failure).</p>

    <p>What if you could instantly generate a narrative that explains your campaign's lifecycle? Why did engagement spike on Day 4? Which creative resonated most, and why? What did the data tell you that you didn't expect?</p>

    <h2>Meet the Ad Journey Storyteller</h2>
    <p>The Storyteller is our latest AI-powered feature, designed to transform raw analytics into a 5-chapter narrative:</p>

    <p><strong>Chapter 1: The Setup</strong> — Campaign goals, audience, budget, and timeline</p>
    <p><strong>Chapter 2: The Launch</strong> — Initial performance, early wins, and surprises</p>
    <p><strong>Chapter 3: The Climb</strong> — How engagement evolved and which levers moved the needle</p>
    <p><strong>Chapter 4: The Insights</strong> — Anomalies, optimizations applied, and their impact</p>
    <p><strong>Chapter 5: The Lessons</strong> — Key takeaways and recommendations for next time</p>

    <h2>How It Works</h2>
    <p>Simply click "Generate Story" on any completed campaign, and our AI analyzes your analytics data to craft a human-readable narrative. You get HTML and PDF versions, perfect for sharing with stakeholders or archiving in your campaign library.</p>

    <h2>Why You'll Love It</h2>
    <ul>
    <li>Cuts reporting time from hours to minutes</li>
    <li>Communicates insights to non-technical stakeholders effortlessly</li>
    <li>Generates ideas for next campaign iterations</li>
    <li>Creates a searchable archive of your advertising knowledge</li>
    </ul>
    `,
  },
  3: {
    title: 'How FitLife Increased Conversions by 340% with SmartAdDeals',
    author: 'David Mensah',
    date: 'February 28, 2026',
    readTime: '8 min read',
    category: 'Case Studies',
    excerpt: 'A deep dive into how a fitness brand leveraged our AI optimization engine and reward-based engagement to achieve record-breaking results.',
    image: 'bg-emerald-50 dark:bg-emerald-900/20',
    content: `
    <h2>The Challenge</h2>
    <p>FitLife, a premium fitness app, had solid brand recognition but struggled with conversion. They were spending $200K monthly on ads across Meta and Google, with a 2.8% conversion rate. For a fitness app, this was below industry standard (3.5-4%).</p>

    <p>Their main pain points:</p>
    <ul>
    <li>High cost per install ($3.50+ CAC)</li>
    <li>Creative fatigue — same three ads running for months</li>
    <li>No visibility into which creatives drove conversions vs. just clicks</li>
    <li>Manual bid adjustments based on gut feel, not data</li>
    </ul>

    <h2>The Solution</h2>
    <p><strong>1. Campaign Segmentation & A/B Creative Testing</strong></p>
    <p>We helped FitLife restructure their campaigns by audience segment (Android vs iOS, age, region) and enabled creative A/B testing. They tested 12 new creative variations within 2 weeks.</p>

    <p><strong>2. AI Optimization</strong></p>
    <p>Using SmartAdDeals's AI engine, we configured automated recommendations for bid adjustments, audience expansion, and budget reallocation. The AI identified that their "Results Testimonials" creative was 3x more likely to drive installs than their "Feature Showcase" ads.</p>

    <p><strong>3. Reward-Based Incentives</strong></p>
    <p>We integrated SmartAdDeals's reward system, offering new users a 50% discount on their first month if they installed and opened the app within 24 hours. This increased post-install engagement significantly.</p>

    <h2>The Results</h2>
    <p>Over 90 days:</p>
    <ul>
    <li>✅ Conversion rate increased from 2.8% to 12.2% (340% improvement)</li>
    <li>✅ Cost per install dropped from $3.50 to $1.20</li>
    <li>✅ ROI went from 1.2x to 4.8x</li>
    <li>✅ Total spend remained flat, but monthly signups increased from ~1,900 to ~8,200</li>
    </ul>

    <h2>Key Takeaways</h2>
    <p>FitLife's success wasn't luck—it came from:</p>
    <ol>
    <li>Data-driven creative testing instead of guesswork</li>
    <li>AI recommendations to optimize budget allocation</li>
    <li>Reward incentives aligned with their app's value prop</li>
    <li>Weekly reporting and iteration cycles</li>
    </ol>

    <p>If you're running ads for an app or SaaS product, this playbook is replicable. Ready to transform your campaigns? Get in touch with our team.</p>
    `,
  },
  4: {
    title: '5 Tips for Writing High-Converting Ad Copy',
    author: 'Priya Sharma',
    date: 'February 20, 2026',
    readTime: '5 min read',
    category: 'Tips & Guides',
    excerpt: 'Practical advice on crafting ad copy that resonates with reward-motivated audiences. Includes real examples from top-performing campaigns.',
    image: 'bg-amber-50 dark:bg-amber-900/20',
    content: `
    <h2>The Psychology of Ad Copy</h2>
    <p>Great ad copy doesn't just inform—it persuades. It speaks to what your audience actually wants, not just what you want to sell them.</p>

    <h2>Tip 1: Lead with Benefit, Not Feature</h2>
    <p><strong>❌ Bad:</strong> "Download FitLife App—AI-powered workouts"</p>
    <p><strong>✅ Good:</strong> "Get fit in 20 minutes a day—personalized to your body"</p>

    <p>The first tells features. The second tells benefits. People don't want features; they want outcomes.</p>

    <h2>Tip 2: Use Specific Numbers</h2>
    <p><strong>❌ Bad:</strong> "Earn big rewards"</p>
    <p><strong>✅ Good:</strong> "Earn up to $50 per referral"</p>

    <p>Specific numbers create credibility and reduce friction. "Up to $50" is more believable and motivating than "big rewards."</p>

    <h2>Tip 3: Create Urgency (Ethically)</h2>
    <p><strong>❌ Misleading:</strong> "Limited time offer!!" (always limited)</p>
    <p><strong>✅ Authentic:</strong> "Unlock rewards this month only"</p>

    <p>If there's a genuine time limit or scarcity, use it. If not, don't artificially create urgency—it hurts trust.</p>

    <h2>Tip 4: Address Objections</h2>
    <p><strong>❌ Missing objection handling:</strong> "Join our rewards program"</p>
    <p><strong>✅ Objection addressed:</strong> "Join our rewards program—no credit card needed"</p>

    <p>Think: What's stopping my audience from converting? Address it head-on in your copy.</p>

    <h2>Tip 5: Use Social Proof</h2>
    <p><strong>❌ Basic:</strong> "Download now"</p>
    <p><strong>✅ With proof:</strong> "Join 2M+ users earning rewards"</p>

    <p>Social proof (users, ratings, testimonials) reduces perceived risk and encourages action.</p>

    <h2>Putting It Together</h2>
    <p>Here's a high-performing example: "Earn up to $50 per referral—no credit card needed. Join 2M+ users making money on their own terms."</p>

    <p>This copy:</p>
    <ul>
    <li>Leads with benefit ($50 earning potential)</li>
    <li>Uses specific numbers ($50, 2M+)</li>
    <li>Addresses objection (no credit card)</li>
    <li>Includes social proof (2M+ users)</li>
    </ul>
    `,
  },
  5: {
    title: 'Privacy-First Advertising: What GDPR Means for AdTech',
    author: 'Sarah Okafor',
    date: 'February 15, 2026',
    readTime: '7 min read',
    category: 'AdTech Trends',
    excerpt: 'Navigating the evolving landscape of data privacy regulations while still delivering effective, personalized ad experiences.',
    image: 'bg-rose-50 dark:bg-rose-900/20',
    content: `
    <h2>The Privacy Regulation Landscape</h2>
    <p>If you work in advertising, you've felt the shift: iOS privacy changes, GDPR, CCPA, and now governments worldwide tightening data protection rules. The days of unlimited, opaque data collection are over.</p>

    <p>But here's the good news: privacy-first advertising isn't just compliant—it's often *more effective* because it builds trust and relies on cleaner, more intentional data.</p>

    <h2>What GDPR Changed</h2>
    <p>GDPR (enforced since 2018) established principles still reshaping AdTech:</p>

    <p><strong>1. Consent First</strong> — You can't collect or use data without explicit, informed consent. Vague "terms of service" don't cut it.</p>

    <p><strong>2. Right to Access & Deletion</strong> — Users can request all data you have on them and ask for deletion. You must comply within 30 days.</p>

    <p><strong>3. Data Minimization</strong> — Collect only what you need. If you don't need someone's home address, don't ask for it.</p>

    <h2>What This Means for Advertisers</h2>
    <p><strong>Challenge: Smaller audiences</strong> — You can't target everyone. Build audiences only from users who explicitly opted in.</p>
    <p><strong>Opportunity: Loyalty</strong> — Users who consent to share data are already 2-3x more engaged.</p>

    <p><strong>Challenge: Cross-device tracking is harder</strong> — Matching users across devices requires consent now.</p>
    <p><strong>Opportunity: First-party data</strong> — Invest in your own customer relationships, not rented third-party lists.</p>

    <h2>Privacy-First Advertising Best Practices</h2>

    <p><strong>1. Be Transparent About Data Use</strong></p>
    <p>Don't hide what you're doing. Tell users: "We'll use your location to show you ads about nearby stores." Simple, clear, honest.</p>

    <p><strong>2. Offer Value in Exchange for Data</strong></p>
    <p>If you want someone's data, give them something worth it: discounts, personalization, exclusive content. "Share your fitness goals for a personalized workout plan."</p>

    <p><strong>3. Use Privacy-Safe Technologies</strong></p>
    <p>Federated Learning of Cohorts (FLoC), contextual targeting, and on-device processing let you deliver personalized ads without centralizing user data.</p>

    <p><strong>4. Invest in First-Party Data</strong></p>
    <p>Build your own CRM. Email lists, purchase history, and user preferences collected directly give you sustainable competitive advantage.</p>

    <h2>The Bottom Line</h2>
    <p>Privacy regulations aren't going away—they're the future. The advertisers and platforms that embrace privacy-first approaches now will be better positioned for the next decade of advertising.</p>

    <p>SmartAdDeals is built on privacy-first principles: we use heatmaps instead of raw location tracking, we rely on contextual signals alongside audience data, and we never sell user data to third parties.</p>
    `,
  },
  6: {
    title: 'New Anomaly Detection Dashboard: What You Need to Know',
    author: 'James Park',
    date: 'February 8, 2026',
    readTime: '4 min read',
    category: 'Platform Updates',
    excerpt: 'Our upgraded anomaly detection system now catches budget spikes, CTR drops, and suspicious activity in real time. Here is what changed.',
    image: 'bg-cyan-50 dark:bg-cyan-900/20',
    content: `
    <h2>What's New</h2>
    <p>We've completely rebuilt our anomaly detection system to catch issues faster and with fewer false positives. Here's what changed:</p>

    <h2>Smarter Detection Algorithms</h2>
    <p>The new system uses machine learning to understand your campaign's baseline and flag real anomalies—not just statistical variations. It learns from your historical data to adapt to seasonal patterns and growth trends.</p>

    <p><strong>What we now detect:</strong></p>
    <ul>
    <li>Budget burn spikes (unexpected spend increases)</li>
    <li>CTR crashes (engagement suddenly dropping)</li>
    <li>CPC jumps (cost-per-click spiking unexpectedly)</li>
    <li>Impression drop-offs</li>
    <li>Suspicious click patterns (potential click fraud)</li>
    <li>Conversion rate anomalies</li>
    </ul>

    <h2>Real-Time Alerts</h2>
    <p>Instead of waiting for a daily report, anomalies are now detected in real-time and surfaced immediately in your dashboard. If your budget is burning 3x faster than expected, you'll know within minutes.</p>

    <h2>Auto-Actions</h2>
    <p>You can now configure auto-actions: if an anomaly is detected, automatically pause the campaign, reduce budget, or pause specific creatives. Control the risk yourself.</p>

    <h2>False Positive Reduction</h2>
    <p>We've dramatically reduced false positives by using contextual awareness. The system knows about holidays, day-of-week patterns, and even time-of-day effects. A spike on Friday evening is normal; a spike at 3 AM on a Tuesday isn't.</p>

    <h2>How to Use It</h2>
    <p>Visit the new "Anomalies" dashboard in your account. You'll see:</p>
    <ul>
    <li>Active anomalies on all your campaigns</li>
    <li>Historical anomalies and what caused them</li>
    <li>Recommended actions</li>
    <li>Auto-action rules you've configured</li>
    </ul>

    <h2>Example</h2>
    <p>Campaign X's CTR drops 50% mid-campaign. The system detects this, calculates it's statistically significant, and alerts you. You review the data and realize a platform algorithm changed. You can pause the campaign immediately or let our AI suggest optimizations.</p>

    <p>Previously, you might not have noticed for 12 hours. Now you can act in minutes.</p>
    `,
  },
} as Record<number, BlogPost>;

export function BlogPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const postId = id ? parseInt(id, 10) : null;
  const post = postId && blogPostsDatabase[postId] ? blogPostsDatabase[postId] : null;

  if (!post) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-text-primary">Post Not Found</h1>
            <button
              onClick={() => navigate('/blog')}
              className="text-primary-700 hover:text-primary-800 font-medium flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-5 w-5" />
              {t('blog.allPosts')}
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-bg-secondary">
        {/* Header */}
        <section className={cn('relative overflow-hidden py-16 sm:py-20', post.image)}>
          <div className="absolute inset-0 bg-primary-700/90 dark:bg-primary-900/90" />
          <WatermarkBanner className="opacity-40" icon={<Newspaper />} />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-secondary-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4">
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 mb-8 text-white/80 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </button>

            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border mb-4',
              'bg-white/10 text-white border-white/20'
            )}>
              {post.category}
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold">
                  {post.author.charAt(0)}
                </div>
                <span className="font-medium text-white">{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-card-bg rounded-2xl border border-border-color p-6 sm:p-8 shadow-sm">
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
                </div>
              </div>

              {/* Share Section */}
              <div className="mt-8 bg-card-bg rounded-2xl border border-border-color p-6 shadow-sm">
                <p className="text-sm font-medium text-text-primary mb-4">Share this post:</p>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium border border-primary-100 dark:border-primary-900/30">
                    <Share2 className="h-4 w-4" />
                    {t('blog.readMore')}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cream-50 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300 hover:bg-cream-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium border border-secondary-200 dark:border-primary-900/30">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 bg-card-bg rounded-2xl p-6 border border-border-color shadow-sm">
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500" />
                  About the Author
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{post.author}</p>
                    <p className="text-xs text-text-secondary">SmartAdDeals Team</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-6">
                  Expert insights from the SmartAdDeals team on advertising trends, platform updates, and industry best practices.
                </p>

                <div className="h-px bg-border-color mb-6" />

                <h4 className="font-semibold text-text-primary mb-3 text-sm">More from this category</h4>
                <div className="space-y-3 text-sm">
                  {Object.entries(blogPostsDatabase)
                    .filter(
                      ([key, p]) =>
                        p.category === post.category && Number(key) !== postId
                    )
                    .slice(0, 3)
                    .map(([key, p]) => (
                      <button
                        key={key}
                        onClick={() => navigate(`/blog/${key}`)}
                        className="block text-left text-text-secondary hover:text-primary-700 dark:hover:text-secondary-400 transition-colors leading-snug"
                      >
                        {p.title}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
