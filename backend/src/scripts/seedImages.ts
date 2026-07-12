import 'dotenv/config';
import mongoose from 'mongoose';
import { Ad } from '../models';

async function seedImages(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const ads = await Ad.find({});
  console.log(`Found ${ads.length} ads`);

  for (const ad of ads) {
    const title = ad.title || 'ad';
    ad.image_url = `https://picsum.photos/seed/${encodeURIComponent(title)}/800/600`;
    if (!ad.media_url) {
      ad.media_url = `https://picsum.photos/seed/${encodeURIComponent(title + '-media')}/800/600`;
    }
    await ad.save();
  }

  console.log(`Updated ${ads.length} ads with images`);
  await mongoose.disconnect();
}

seedImages().catch((err) => {
  console.error('Failed to seed images:', err);
  process.exit(1);
});
