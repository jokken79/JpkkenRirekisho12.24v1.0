"""
Photo Upload to Supabase Storage
================================
Uploads employee photos to Supabase Storage bucket.
Supports optimized mode (only photos referenced by staff) or full mode.

Usage:
    python upload_photos.py              # Optimized (recommended)
    python upload_photos.py --all        # Upload all photos
    python upload_photos.py --dry-run    # Preview without uploading
"""

import sys
import json
import argparse
import mimetypes
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import httpx

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# Import centralized config
from config import (
    SUPABASE_URL, SUPABASE_SERVICE_KEY, BUCKET_NAME,
    PHOTOS_DIR, STAFF_JSON, get_headers
)


def get_mime_type(filename: str) -> str:
    """Get MIME type for a file."""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "image/jpeg"


def create_bucket() -> bool:
    """Create the photos bucket if it doesn't exist."""
    headers = get_headers(use_service_key=True)

    # Check if bucket exists
    url = f"{SUPABASE_URL}/storage/v1/bucket/{BUCKET_NAME}"
    response = httpx.get(url, headers=headers, timeout=10)

    if response.status_code == 200:
        print(f"   Bucket '{BUCKET_NAME}' already exists")
        return True

    # Create bucket
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    payload = {
        "id": BUCKET_NAME,
        "name": BUCKET_NAME,
        "public": True,
        "file_size_limit": 5242880,  # 5MB
        "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp"]
    }

    response = httpx.post(url, headers=headers, json=payload, timeout=10)

    if response.status_code in [200, 201]:
        print(f"   Bucket '{BUCKET_NAME}' created successfully!")
        return True
    else:
        print(f"   Error creating bucket: {response.status_code} - {response.text}")
        return False


def get_staff_photos() -> set:
    """Get set of photos referenced by staff records."""
    if not STAFF_JSON.exists():
        print(f"   Warning: {STAFF_JSON} not found, using all photos")
        return set()

    with open(STAFF_JSON, 'r', encoding='utf-8') as f:
        staff = json.load(f)

    return {s.get('avatar') for s in staff if s.get('avatar')}


def get_existing_files() -> set:
    """Get list of files already in the bucket."""
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET_NAME}"
        headers = get_headers(use_service_key=True)
        response = httpx.post(url, headers=headers, json={"prefix": "", "limit": 10000}, timeout=30)
        if response.status_code == 200:
            files = response.json()
            return {f["name"] for f in files}
        return set()
    except Exception as e:
        print(f"   Warning: Could not list files: {e}")
        return set()


def upload_file(file_path: Path) -> dict:
    """Upload a single file to Supabase Storage."""
    try:
        filename = file_path.name
        mime_type = get_mime_type(filename)

        with open(file_path, "rb") as f:
            file_data = f.read()

        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
        headers = {
            **get_headers(use_service_key=True),
            "Content-Type": mime_type,
            "x-upsert": "true"
        }

        response = httpx.put(url, headers=headers, content=file_data, timeout=60)

        if response.status_code in [200, 201]:
            return {"success": True, "filename": filename}
        else:
            return {"success": False, "filename": filename, "error": f"{response.status_code}: {response.text[:100]}"}
    except Exception as e:
        return {"success": False, "filename": file_path.name, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Upload photos to Supabase Storage")
    parser.add_argument("--all", action="store_true", help="Upload all photos, not just referenced ones")
    parser.add_argument("--dry-run", action="store_true", help="Preview without uploading")
    parser.add_argument("--workers", type=int, default=5, help="Number of parallel uploads")
    args = parser.parse_args()

    print("=" * 60)
    print("SUPABASE PHOTO UPLOAD")
    print("=" * 60)
    print(f"Mode: {'All photos' if args.all else 'Optimized (staff-referenced only)'}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Bucket: {BUCKET_NAME}")

    if not SUPABASE_SERVICE_KEY:
        print("\nError: SUPABASE_SERVICE_ROLE_KEY not set in .env.local")
        print("Add this line to .env.local:")
        print("  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here")
        return

    # Step 1: Create bucket
    print("\n[1/4] Checking bucket...")
    if not args.dry_run:
        if not create_bucket():
            return

    # Step 2: Get photos to upload
    print("\n[2/4] Analyzing photos...")
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.JPG', '.JPEG', '.PNG'}
    all_photos = [f for f in PHOTOS_DIR.iterdir() if f.suffix in image_extensions]
    print(f"   Total photos in folder: {len(all_photos)}")

    if args.all:
        photos_to_check = all_photos
    else:
        staff_photos = get_staff_photos()
        print(f"   Staff-referenced photos: {len(staff_photos)}")
        photos_to_check = [p for p in all_photos if p.name in staff_photos]
        print(f"   Found locally: {len(photos_to_check)}")

    # Step 3: Filter already uploaded
    print("\n[3/4] Checking existing files...")
    if not args.dry_run:
        existing = get_existing_files()
        print(f"   Already in bucket: {len(existing)}")
        to_upload = [p for p in photos_to_check if p.name not in existing]
    else:
        to_upload = photos_to_check
    print(f"   To upload: {len(to_upload)}")

    total_size = sum(p.stat().st_size for p in to_upload) / (1024 * 1024)
    print(f"   Total size: {total_size:.1f} MB")

    if not to_upload:
        print("\nAll photos already uploaded!")
        return

    if args.dry_run:
        print("\n[DRY RUN] Would upload:")
        for p in to_upload[:10]:
            print(f"   - {p.name}")
        if len(to_upload) > 10:
            print(f"   ... and {len(to_upload) - 10} more")
        return

    # Step 4: Upload
    print(f"\n[4/4] Uploading {len(to_upload)} photos...")

    uploaded = 0
    failed = 0
    errors = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(upload_file, photo): photo for photo in to_upload}

        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()

            if result["success"]:
                uploaded += 1
            else:
                failed += 1
                errors.append(f"{result['filename']}: {result['error']}")

            if i % 25 == 0 or i == len(to_upload):
                pct = i * 100 // len(to_upload)
                print(f"   Progress: {i}/{len(to_upload)} ({pct}%) - OK: {uploaded}, Failed: {failed}")

    # Summary
    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
    print(f"Uploaded: {uploaded}")
    print(f"Failed: {failed}")

    if errors:
        print(f"\nErrors (first 5):")
        for err in errors[:5]:
            print(f"  - {err}")

    print(f"\nPublic URL format:")
    print(f"   {SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{{filename}}")


if __name__ == "__main__":
    main()
