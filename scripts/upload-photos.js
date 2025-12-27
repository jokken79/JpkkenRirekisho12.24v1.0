/**
 * Script to upload photos from public/photos/ to Supabase Storage
 *
 * Prerequisites:
 * 1. Create a bucket named "photos" in Supabase Dashboard
 * 2. Set bucket to PUBLIC for read access
 * 3. Run: node scripts/upload-photos.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://besembwtnuarriscreve.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Run with: SUPABASE_SERVICE_KEY=your-service-key node scripts/upload-photos.js');
  console.error('\nGet your service key from: Supabase Dashboard > Settings > API > service_role');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET_NAME = 'photos';
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'photos');

// Mime types
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

async function ensureBucketExists() {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error.message);
    return false;
  }

  const exists = buckets.some(b => b.name === BUCKET_NAME);

  if (!exists) {
    console.log(`Creating bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5 * 1024 * 1024 // 5MB
    });

    if (createError) {
      console.error('Error creating bucket:', createError.message);
      return false;
    }
    console.log('Bucket created successfully!');
  } else {
    console.log(`Bucket "${BUCKET_NAME}" already exists.`);
  }

  return true;
}

async function uploadFile(filename) {
  const filepath = path.join(PHOTOS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'image/jpeg';

  try {
    const fileBuffer = fs.readFileSync(filepath);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, fileBuffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Supabase Photo Upload Script');
  console.log('='.repeat(50));

  // Check bucket
  const bucketReady = await ensureBucketExists();
  if (!bucketReady) {
    console.error('Failed to setup bucket. Exiting.');
    process.exit(1);
  }

  // Get list of photos
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`Photos directory not found: ${PHOTOS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PHOTOS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  console.log(`Found ${files.length} photos to upload.\n`);

  // Upload stats
  let uploaded = 0;
  let failed = 0;
  const errors = [];

  // Process in batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(batch.map(async (file) => {
      const result = await uploadFile(file);
      return { file, ...result };
    }));

    for (const result of results) {
      if (result.success) {
        uploaded++;
      } else {
        failed++;
        errors.push({ file: result.file, error: result.error });
      }
    }

    // Progress
    const progress = Math.round((i + batch.length) / files.length * 100);
    process.stdout.write(`\rProgress: ${progress}% (${uploaded} uploaded, ${failed} failed)`);
  }

  console.log('\n\n' + '='.repeat(50));
  console.log('Upload Complete!');
  console.log('='.repeat(50));
  console.log(`Total files: ${files.length}`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.slice(0, 10).forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  console.log(`\nPhotos URL: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`);
}

main().catch(console.error);
