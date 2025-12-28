"""
Centralized Configuration for Scripts
======================================
Loads configuration from environment variables or .env file.
NEVER commit API keys to version control.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / '.env.local')
load_dotenv(PROJECT_ROOT / '.env')

# Supabase Configuration
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL', 'https://besembwtnuarriscreve.supabase.co')
SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

# Paths
EXCEL_PATH = PROJECT_ROOT / "【新】社員台帳(UNS)T　2022.04.05～.xlsm"
PHOTOS_DIR = PROJECT_ROOT / "public" / "photos"
IMPORT_DATA_DIR = Path(__file__).parent / "import_data"
STAFF_JSON = IMPORT_DATA_DIR / "staff_all.json"

# Storage
BUCKET_NAME = "photos"
PHOTO_BASE_URL = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/"

def get_headers(use_service_key: bool = False) -> dict:
    """Get HTTP headers for Supabase API requests."""
    key = SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY
    if not key:
        raise ValueError(
            "API key not found. Set SUPABASE_SERVICE_ROLE_KEY in .env.local for admin operations, "
            "or VITE_SUPABASE_ANON_KEY for public operations."
        )
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

def validate_config():
    """Validate that required configuration is present."""
    errors = []

    if not SUPABASE_URL:
        errors.append("VITE_SUPABASE_URL not set")

    if not SUPABASE_ANON_KEY:
        errors.append("VITE_SUPABASE_ANON_KEY not set")

    if not EXCEL_PATH.exists():
        errors.append(f"Excel file not found: {EXCEL_PATH}")

    if errors:
        print("Configuration errors:")
        for err in errors:
            print(f"  - {err}")
        return False

    return True

if __name__ == "__main__":
    print("Configuration Check")
    print("=" * 40)
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Anon Key: {'Set' if SUPABASE_ANON_KEY else 'NOT SET'}")
    print(f"Service Key: {'Set' if SUPABASE_SERVICE_KEY else 'NOT SET'}")
    print(f"Excel Path: {EXCEL_PATH} ({'exists' if EXCEL_PATH.exists() else 'NOT FOUND'})")
    print(f"Photos Dir: {PHOTOS_DIR} ({'exists' if PHOTOS_DIR.exists() else 'NOT FOUND'})")
    validate_config()
