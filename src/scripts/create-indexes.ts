import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not found');

    console.log('Creating text indexes for Article...');
    await db.collection('articles').createIndex(
      {
        'title.ru': 'text', 'title.uz': 'text', 'title.tg': 'text', 'title.kk': 'text', 'title.ky': 'text',
        'overview.ru': 'text', 'overview.uz': 'text', 'overview.tg': 'text', 'overview.kk': 'text', 'overview.ky': 'text'
      },
      {
        name: 'ArticleTextIndex',
        weights: {
          'title.ru': 10, 'title.uz': 10, 'title.tg': 10, 'title.kk': 10, 'title.ky': 10,
          'overview.ru': 5, 'overview.uz': 5, 'overview.tg': 5, 'overview.kk': 5, 'overview.ky': 5
        }
      }
    );

    console.log('Creating text indexes for Doctor...');
    await db.collection('doctors').createIndex(
      {
        name: 'text',
        'specialty.ru': 'text', 'specialty.uz': 'text', 'specialty.tg': 'text', 'specialty.kk': 'text', 'specialty.ky': 'text',
        city: 'text'
      },
      {
        name: 'DoctorTextIndex',
        weights: {
          name: 10,
          'specialty.ru': 5, 'specialty.uz': 5, 'specialty.tg': 5, 'specialty.kk': 5, 'specialty.ky': 5,
          city: 3
        }
      }
    );

    console.log('Creating 2dsphere index for Doctor coordinates...');
    await db.collection('doctors').createIndex({ 'coordinates.coordinates': '2dsphere' });

    console.log('All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
