"""
Upload all photos to Supabase Storage (using httpx)
====================================================
Uploads photos from public/photos/ to Supabase Storage bucket 'photos'
"""

import os
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import mimetypes
import httpx

# Configuration
SUPABASE_URL = "https://besembwtnuarriscreve.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc2VtYnd0bnVhcnJpc2NyZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDk2NzksImV4cCI6MjA4MjM4NTY3OX0.CTERCy1KPN1rRa99dC1OZ3438LuVjK_c1eP1A2zJ4E4"
BUCKET_NAME = "photos"
PHOTOS_DIR = Path(__file__).parent.parent / "public" / "photos"

# HTTP headers for Supabase
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}

def get_mime_type(filename):
    """Get MIME type for a file"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "image/jpeg"

def get_existing_files():
    """Get list of files already in the bucket"""
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET_NAME}"
        response = httpx.post(url, headers=HEADERS, json={"prefix": "", "limit": 10000}, timeout=30)
        if response.status_code == 200:
            files = response.json()
            return {f["name"] for f in files}
        return set()
    except Exception as e:
        print(f"Warning: Could not list existing files: {e}")
        return set()

def upload_file(file_path: Path):
    """Upload a single file to Supabase Storage"""
    try:
        filename = file_path.name
        mime_type = get_mime_type(filename)

        with open(file_path, "rb") as f:
            file_data = f.read()

        # Upload to Supabase Storage with upsert
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
        headers = {
            **HEADERS,
            "Content-Type": mime_type,
            "x-upsert": "true"
        }

        response = httpx.put(url, headers=headers, content=file_data, timeout=60)

        if response.status_code in [200, 201]:
            return {"success": True, "filename": filename}
        else:
            error_msg = response.text
            # Ignore "already exists" errors
            if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                return {"success": True, "filename": filename, "skipped": True}
            return {"success": False, "filename": filename, "error": f"{response.status_code}: {error_msg}"}
    except Exception as e:
        return {"success": False, "filename": file_path.name, "error": str(e)}

def main():
    print("="*60)
    print("SUPABASE STORAGE PHOTO UPLOAD")
    print("="*60)
    print(f"\nPhotos directory: {PHOTOS_DIR}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Bucket: {BUCKET_NAME}")

    # Check if bucket exists
    print("\n[1/4] Checking bucket...")
    try:
        url = f"{SUPABASE_URL}/storage/v1/bucket/{BUCKET_NAME}"
        response = httpx.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            print(f"Bucket '{BUCKET_NAME}' exists and is accessible.")
        else:
            print(f"Bucket status: {response.status_code} - {response.text}")
            print("Proceeding anyway...")
    except Exception as e:
        print(f"Warning: Could not check bucket: {e}")

    # Get list of photos to upload
    print("\n[2/4] Scanning photos...")
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.JPG', '.JPEG', '.PNG'}
    photos = [f for f in PHOTOS_DIR.iterdir() if f.suffix in image_extensions]
    print(f"Found {len(photos)} photos to upload")

    # Get existing files to skip
    print("\n[3/4] Checking existing files in bucket...")
    existing = get_existing_files()
    print(f"Already uploaded: {len(existing)} files")

    # Filter out already uploaded
    to_upload = [p for p in photos if p.name not in existing]
    print(f"New files to upload: {len(to_upload)}")

    if not to_upload:
        print("\nAll photos already uploaded!")
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

            # Progress update every 25 files
            if i % 25 == 0 or i == len(to_upload):
                print(f"  Progress: {i}/{len(to_upload)} ({i*100//len(to_upload)}%) - Uploaded: {uploaded}, Failed: {failed}")

    # Summary
    print("\n" + "="*60)
    print("UPLOAD COMPLETE!")
    print("="*60)
    print(f"\nUploaded: {uploaded}")
    print(f"Skipped (existing): {skipped}")
    print(f"Failed: {failed}")

    if errors:
        print(f"\nErrors (first 10):")
        for err in errors[:10]:
            print(f"  - {err}")

    # Print public URL format
    print(f"\nPublic URL format:")
    print(f"   {SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{{filename}}")

if __name__ == "__main__":
    main()
