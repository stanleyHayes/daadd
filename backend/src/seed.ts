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

export async function seedDatabase(): Promise<void> {
  const existingUser = await User.findOne({ email: 'demo@example.com' });
  if (existingUser) {
    return;
  }

  const passwordHash = bcrypt.hashSync('password', 10);

  const demoUser = await User.create({
    name: 'Demo User',
    email: 'demo@example.com',
    password_hash: passwordHash,
    role: 'end_user',
    avatar_url: 'https://i.pravatar.cc/150?u=demo@example.com',
  });

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password_hash: passwordHash,
    role: 'admin',
    avatar_url: 'https://i.pravatar.cc/150?u=admin@example.com',
  });

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
      title: 'Welcome to AdPlatform',
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
