"""
Upload all photos to Supabase Storage
=====================================
Uploads photos from public/photos/ to Supabase Storage bucket 'photos'
"""

import os
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import mimetypes

# Install supabase if not available
try:
    from supabase import create_client, Client
except ImportError:
    print("Installing supabase-py...")
    os.system(f"{sys.executable} -m pip install supabase")
    from supabase import create_client, Client

# Configuration
SUPABASE_URL = "https://besembwtnuarriscreve.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc2VtYnd0bnVhcnJpc2NyZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDk2NzksImV4cCI6MjA4MjM4NTY3OX0.CTERCy1KPN1rRa99dC1OZ3438LuVjK_c1eP1A2zJ4E4"
BUCKET_NAME = "photos"
PHOTOS_DIR = Path(__file__).parent.parent / "public" / "photos"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def ensure_bucket_exists():
    """Create the photos bucket if it doesn't exist"""
    try:
        # List existing buckets
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]

        if BUCKET_NAME not in bucket_names:
            print(f"Creating bucket '{BUCKET_NAME}'...")
            supabase.storage.create_bucket(
                BUCKET_NAME,
                options={
                    "public": True,  # Make files publicly accessible
                    "file_size_limit": 5242880,  # 5MB limit per file
                    "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp"]
                }
            )
            print(f"Bucket '{BUCKET_NAME}' created successfully!")
        else:
            print(f"Bucket '{BUCKET_NAME}' already exists.")
        return True
    except Exception as e:
        print(f"Error with bucket: {e}")
        # Try to continue anyway - bucket might exist with different permissions
        return True

def get_mime_type(filename):
    """Get MIME type for a file"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "image/jpeg"

def upload_file(file_path: Path):
    """Upload a single file to Supabase Storage"""
    try:
        filename = file_path.name
        mime_type = get_mime_type(filename)

        with open(file_path, "rb") as f:
            file_data = f.read()

        # Upload to Supabase Storage
        result = supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=file_data,
            file_options={"content-type": mime_type, "upsert": "true"}
        )

        return {"success": True, "filename": filename}
    except Exception as e:
        error_msg = str(e)
        # Ignore "already exists" errors
        if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
            return {"success": True, "filename": filename, "skipped": True}
        return {"success": False, "filename": file_path.name, "error": error_msg}

def get_existing_files():
    """Get list of files already in the bucket"""
    try:
        files = supabase.storage.from_(BUCKET_NAME).list()
        return {f["name"] for f in files}
    except:
        return set()

def main():
    print("="*60)
    print("SUPABASE STORAGE PHOTO UPLOAD")
    print("="*60)
    print(f"\nPhotos directory: {PHOTOS_DIR}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Bucket: {BUCKET_NAME}")

    # Ensure bucket exists
    print("\n[1/4] Checking bucket...")
    ensure_bucket_exists()

    # Get list of photos to upload
    print("\n[2/4] Scanning photos...")
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.JPG', '.JPEG', '.PNG'}
    photos = [f for f in PHOTOS_DIR.iterdir() if f.suffix in image_extensions]
    print(f"Found {len(photos)} photos to upload")

    # Get existing files to skip
    print("\n[3/4] Checking existing files...")
    existing = get_existing_files()
    print(f"Already uploaded: {len(existing)} files")

    # Filter out already uploaded
    to_upload = [p for p in photos if p.name not in existing]
    print(f"New files to upload: {len(to_upload)}")

    if not to_upload:
        print("\n✅ All photos already uploaded!")
        return

    # Upload with progress
    print(f"\n[4/4] Uploading {len(to_upload)} photos...")

    uploaded = 0
    skipped = 0
    failed = 0
    errors = []

    # Use thread pool for parallel uploads
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(upload_file, photo): photo for photo in to_upload}

        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()

            if result["success"]:
                if result.get("skipped"):
                    skipped += 1
                else:
                    uploaded += 1
            else:
                failed += 1
                errors.append(f"{result['filename']}: {result['error']}")

            # Progress update every 50 files
            if i % 50 == 0 or i == len(to_upload):
                print(f"  Progress: {i}/{len(to_upload)} ({i*100//len(to_upload)}%)")

    # Summary
    print("\n" + "="*60)
    print("UPLOAD COMPLETE!")
    print("="*60)
    print(f"\n✅ Uploaded: {uploaded}")
    print(f"⏭️  Skipped (existing): {skipped}")
    print(f"❌ Failed: {failed}")

    if errors:
        print(f"\nErrors (first 5):")
        for err in errors[:5]:
            print(f"  - {err}")

    # Print public URL format
    print(f"\n📷 Public URL format:")
    print(f"   {SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{{filename}}")

if __name__ == "__main__":
    main()
