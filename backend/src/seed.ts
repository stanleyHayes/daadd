import bcrypt from 'bcryptjs';
import { User, Campaign, Ad, Review, Reward, Notification } from './models';

const sampleIndustries = [
  'Technology',
  'Fashion',
  'Food & Beverage',
  'Finance',
  'Entertainment',
  'Travel',
  'Health & Wellness',
  'Automotive',
];

const campaignTemplates = [
  { name: 'Summer Tech Launch', industry: 'Technology', budget: 50000 },
  { name: 'Urban Streetwear Drop', industry: 'Fashion', budget: 25000 },
  { name: 'Organic Smoothie Campaign', industry: 'Food & Beverage', budget: 15000 },
  { name: 'Smart Savings App', industry: 'Finance', budget: 40000 },
  { name: 'Indie Film Premiere', industry: 'Entertainment', budget: 30000 },
  { name: 'Tropical Getaway', industry: 'Travel', budget: 35000 },
  { name: 'Mindfulness Month', industry: 'Health & Wellness', budget: 20000 },
  { name: 'Electric Vehicle Tour', industry: 'Automotive', budget: 60000 },
];

const adTitles: Record<string, string[]> = {
  Technology: ['New 5G Smartphone', 'AI Laptop Pro', 'Smart Watch Ultra'],
  Fashion: ['Limited Hoodie', 'Vintage Sneakers', 'Designer Shades'],
  'Food & Beverage': ['Cold Brew Bundle', 'Plant Protein Bar', 'Sparkling Water Pack'],
  Finance: ['No-Fee Credit Card', 'High-Yield Savings', 'Micro-Invest App'],
  Entertainment: ['Streaming Free Trial', 'Concert Tickets', 'Indie Game Pass'],
  Travel: ['Weekend Hotel Deal', 'Adventure Tour', 'Flight Cashback'],
  'Health & Wellness': ['Yoga Class Pass', 'Vitamin Subscription', 'Meditation App'],
  Automotive: ['EV Test Drive', 'Car Care Kit', 'Roadside Assistance Plan'],
};

const testAccounts = [
  { name: 'Demo User', email: 'demo@example.com', role: 'end_user' },
  { name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { name: 'James Owusu', email: 'admin@daadd.com', role: 'admin' },
  { name: 'Sarah Johnson', email: 'advertiser1@daadd.com', role: 'advertiser' },
  { name: 'Michael Chen', email: 'advertiser2@daadd.com', role: 'advertiser' },
  { name: 'Emma Williams', email: 'advertiser3@daadd.com', role: 'advertiser' },
  { name: 'Kofi Mensah', email: 'advertiser4@daadd.com', role: 'advertiser' },
  { name: 'David Rodriguez', email: 'manager@daadd.com', role: 'campaign_manager' },
  { name: 'Priya Sharma', email: 'manager2@daadd.com', role: 'campaign_manager' },
  { name: 'Lisa Park', email: 'analyst@daadd.com', role: 'analyst' },
  { name: 'Mary Osei', email: 'merchant@daadd.com', role: 'merchant' },
  { name: 'Alex Turner', email: 'user1@example.com', role: 'end_user' },
  { name: 'Jordan Blake', email: 'user2@example.com', role: 'end_user' },
  { name: 'Fatima Al-Hassan', email: 'user3@example.com', role: 'end_user' },
  { name: 'Carlos Rivera', email: 'user4@example.com', role: 'end_user' },
];

export async function seedDatabase(): Promise<void> {
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  const seededUsers: InstanceType<typeof User>[] = [];
  for (const account of testAccounts) {
    // $setOnInsert keeps seeding insert-only: an existing account (and its
    // password) is left untouched instead of being reset every boot.
    const user = await User.findOneAndUpdate(
      { email: account.email.toLowerCase() },
      {
        $setOnInsert: {
          name: account.name,
          email: account.email.toLowerCase(),
          password_hash: passwordHash,
          role: account.role,
          avatar_url: `https://i.pravatar.cc/150?u=${account.email.toLowerCase()}`,
        },
      },
      { upsert: true, new: true }
    );
    seededUsers.push(user!);
  }

  // Demo advertiser accounts ship pre-cleared (email verified, admin-approved,
  // billing ready) so the seeded data can "run ads" out of the box. Real,
  // self-registered advertisers still go through the onboarding gate.
  const advertiserEmails = testAccounts
    .filter((a) => a.role === 'advertiser')
    .map((a) => a.email.toLowerCase());
  await User.updateMany(
    { email: { $in: advertiserEmails } },
    { $set: { email_verified: true, advertiser_approval: 'approved', billing_ready: true } }
  );

  const adminUser = seededUsers.find((u) => u.email === 'admin@example.com') || seededUsers[0];
  const demoUser = seededUsers.find((u) => u.email === 'demo@example.com') || seededUsers[0];

  if (await Campaign.countDocuments() > 0) {
    console.log('Campaigns already seeded.');
    return;
  }

  const campaigns = await Campaign.insertMany(
    campaignTemplates.map((template, index) => ({
      name: template.name,
      description: `Sample ${template.industry} campaign generated for demo purposes.`,
      status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'paused' : 'draft',
      industry: template.industry,
      budget_total: template.budget,
      budget_spent: Math.floor(template.budget * (Math.random() * 0.4)),
      start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * (10 + index * 5)),
      end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * (30 + index * 5)),
      enable_ai_optimization: index % 2 === 0,
      language: 'en',
      platform_ids: ['web', 'mobile', 'social'].slice(0, (index % 3) + 1),
      owner: adminUser._id,
    }))
  );

  const adsToInsert: {
    title: string;
    description: string;
    brand: string;
    industry: string;
    image_url: string;
    media_url: string;
    isAgeRestricted: boolean;
    reward_amount: number;
    status: string;
    campaign_id: import('mongoose').Types.ObjectId;
  }[] = [];

  for (const campaign of campaigns) {
    const titles = adTitles[campaign.industry] || ['Generic Ad'];
    titles.forEach((title, idx) => {
      adsToInsert.push({
        title,
        description: `Engaging ${campaign.industry.toLowerCase()} creative for ${campaign.name}.`,
        brand: campaign.name.split(' ').slice(0, 2).join(' '),
        industry: campaign.industry,
        image_url: `https://picsum.photos/seed/${encodeURIComponent(title)}/800/600`,
        media_url: `https://picsum.photos/seed/${encodeURIComponent(title + '-media')}/800/600`,
        isAgeRestricted: false,
        reward_amount: Math.floor(Math.random() * 5) + 1,
        status: idx === 0 ? 'active' : 'draft',
        campaign_id: campaign._id,
      });
    });
  }

  const ads = await Ad.insertMany(adsToInsert);

  const reviews = await Review.insertMany(
    campaigns.slice(0, 4).map((campaign, index) => ({
      campaign_id: campaign._id,
      user: demoUser._id,
      rating: 4 + (index % 2),
      comment: `Great ${campaign.industry.toLowerCase()} campaign experience!`,
    }))
  );

  const rewards = await Reward.insertMany(
    ads.slice(0, 5).map((ad, index) => ({
      user_id: demoUser._id,
      ad_id: ad._id,
      ad_title: ad.title,
      amount: ad.reward_amount,
      status: index % 2 === 0 ? 'approved' : 'pending',
    }))
  );

  await Notification.insertMany([
    {
      user_id: demoUser._id,
      type: 'welcome',
      title: 'Welcome to SmartDeals',
      message: 'Your demo account is ready. Explore campaigns and ads.',
    },
    {
      user_id: demoUser._id,
      type: 'reward',
      title: 'Reward Earned',
      message: `You earned a reward for viewing an ad.`,
    },
  ]);

  console.log(
    `Seeded ${campaigns.length} campaigns, ${ads.length} ads, ${reviews.length} reviews, ${rewards.length} rewards.`
  );
}
