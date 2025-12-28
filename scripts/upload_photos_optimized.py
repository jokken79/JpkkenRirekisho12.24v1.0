"""
Optimized Photo Upload to Supabase Storage
===========================================
Only uploads photos that are actually used by staff records.
Requires service_role key to create bucket and bypass RLS.
"""

import json
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import mimetypes
import httpx

# Reconfigure stdout for UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Configuration
SUPABASE_URL = "https://besembwtnuarriscreve.supabase.co"
BUCKET_NAME = "photos"
PHOTOS_DIR = Path(__file__).parent.parent / "public" / "photos"
STAFF_JSON = Path(__file__).parent / "import_data" / "staff_all.json"

# Will be set from command line or prompt
SERVICE_ROLE_KEY = None

def get_headers(key):
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }

def get_mime_type(filename):
    """Get MIME type for a file"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "image/jpeg"

def create_bucket(key):
    """Create the photos bucket with public access"""
    print("\n[1/5] Creating bucket...")
    headers = get_headers(key)
    headers["Content-Type"] = "application/json"

    # First check if bucket exists
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

def get_needed_photos():
    """Get list of photos that are actually used by staff"""
    print("\n[2/5] Analyzing staff data...")

    with open(STAFF_JSON, 'r', encoding='utf-8') as f:
        staff = json.load(f)

    # Get unique photos from staff
    staff_photos = set(s.get('avatar') for s in staff if s.get('avatar'))
    print(f"   Staff records: {len(staff)}")
    print(f"   Unique photos referenced: {len(staff_photos)}")

    # Check which exist in folder
    existing_photos = []
    missing = 0

    for photo_name in staff_photos:
        photo_path = PHOTOS_DIR / photo_name
        if photo_path.exists():
            existing_photos.append(photo_path)
        else:
            missing += 1

    print(f"   Photos found in folder: {len(existing_photos)}")
    if missing:
        print(f"   Photos missing: {missing}")

    # Calculate size
    total_size = sum(p.stat().st_size for p in existing_photos)
    print(f"   Total size to upload: {total_size / (1024*1024):.1f} MB")

    return existing_photos

def get_existing_files(key):
    """Get list of files already in the bucket"""
    print("\n[3/5] Checking existing files in bucket...")
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET_NAME}"
        headers = get_headers(key)
        response = httpx.post(url, headers=headers, json={"prefix": "", "limit": 10000}, timeout=30)
        if response.status_code == 200:
            files = response.json()
            existing = {f["name"] for f in files}
            print(f"   Already uploaded: {len(existing)} files")
            return existing
        return set()
    except Exception as e:
        print(f"   Warning: Could not list files: {e}")
        return set()

def upload_file(file_path: Path, key: str):
    """Upload a single file to Supabase Storage"""
    try:
        filename = file_path.name
        mime_type = get_mime_type(filename)

        with open(file_path, "rb") as f:
            file_data = f.read()

        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
        headers = {
            **get_headers(key),
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
    global SERVICE_ROLE_KEY

    print("=" * 60)
    print("OPTIMIZED SUPABASE PHOTO UPLOAD")
    print("=" * 60)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Bucket: {BUCKET_NAME}")

    # Get service role key
    if len(sys.argv) > 1:
        SERVICE_ROLE_KEY = sys.argv[1]
    else:
        print("\nEnter your Supabase service_role key:")
        SERVICE_ROLE_KEY = input().strip()

    if not SERVICE_ROLE_KEY or len(SERVICE_ROLE_KEY) < 100:
        print("Error: Invalid service_role key")
        return

    # Create bucket
    if not create_bucket(SERVICE_ROLE_KEY):
        print("Failed to create bucket. Aborting.")
        return

    # Get photos that are actually needed
    needed_photos = get_needed_photos()

    if not needed_photos:
        print("\nNo photos to upload!")
        return

    # Get existing files
    existing = get_existing_files(SERVICE_ROLE_KEY)

    # Filter out already uploaded
    to_upload = [p for p in needed_photos if p.name not in existing]
    print(f"   New files to upload: {len(to_upload)}")

    if not to_upload:
        print("\nAll needed photos already uploaded!")
        return

    # Upload
    print(f"\n[4/5] Uploading {len(to_upload)} photos...")

    uploaded = 0
    failed = 0
    errors = []

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(upload_file, photo, SERVICE_ROLE_KEY): photo for photo in to_upload}

        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()

            if result["success"]:
                uploaded += 1
            else:
                failed += 1
                errors.append(f"{result['filename']}: {result['error']}")

            if i % 25 == 0 or i == len(to_upload):
                print(f"   Progress: {i}/{len(to_upload)} ({i*100//len(to_upload)}%) - OK: {uploaded}, Failed: {failed}")

    # Summary
    print("\n[5/5] COMPLETE!")
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
