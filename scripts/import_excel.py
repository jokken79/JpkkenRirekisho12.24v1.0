"""
Excel to Supabase Import
========================
Imports employee data from 社員台帳 Excel to Supabase.

Usage:
    python import_excel.py              # Full import (upsert)
    python import_excel.py --dry-run    # Preview without importing
    python import_excel.py --sheet GenzaiX  # Import specific sheet only
"""

import sys
import argparse
from datetime import datetime
import pandas as pd
import httpx

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# Import centralized config
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, EXCEL_PATH, get_headers

# Excel column to Supabase field mapping
COLUMN_MAP = {
    '現在': 'status',
    '社員№': 'emp_id',
    '氏名': 'full_name',
    'カナ': 'full_name_kana',
    '性別': 'gender',
    '国籍': 'nationality',
    '生年月日': 'birth_date',
    '年齢': 'age',
    '時給': 'hourly_wage',
    '請求単価': 'billing_unit',
    '差額利益': 'profit_margin',
    '標準報酬': 'standard_remuneration',
    '健康保険': 'health_ins',
    '介護保険': 'nursing_ins',
    '厚生年金': 'pension',
    'ビザ期限': 'visa_expiry',
    'ビザ種類': 'visa_type',
    '〒': 'postal_code',
    '住所': 'address',
    '入社日': 'hire_date',
    '備考': 'notes',
}

# Status normalization
STATUS_MAP = {
    '在職中': '在職中',
    '退社': '退社',
    '待機中': '待機中',
    0: '在職中',
    '0': '在職中',
}

# Field type definitions
DATE_FIELDS = {'birth_date', 'visa_expiry', 'hire_date', 'leave_date', 'license_expiry'}
INT_FIELDS = {'age', 'hourly_wage', 'billing_unit', 'profit_margin'}
FLOAT_FIELDS = {'health_ins', 'nursing_ins', 'pension', 'standard_remuneration'}


def clean_value(val, field_type: str = 'string'):
    """Clean and convert value based on field type."""
    if pd.isna(val) or val == 0 or val == '0':
        return None

    if field_type == 'date':
        if isinstance(val, datetime):
            return val.strftime('%Y-%m-%d')
        elif isinstance(val, str):
            try:
                return pd.to_datetime(val).strftime('%Y-%m-%d')
            except:
                return None
        return None

    if field_type == 'int':
        try:
            return int(float(val))
        except:
            return None

    if field_type == 'float':
        try:
            return float(val)
        except:
            return None

    return str(val).strip() if val else None


def map_row_to_staff(row, staff_type: str) -> dict:
    """Map Excel row to Supabase staff record."""
    staff = {'type': staff_type}

    for excel_col, db_field in COLUMN_MAP.items():
        if excel_col in row.index:
            val = row[excel_col]

            if db_field in DATE_FIELDS:
                staff[db_field] = clean_value(val, 'date')
            elif db_field in INT_FIELDS:
                staff[db_field] = clean_value(val, 'int')
            elif db_field in FLOAT_FIELDS:
                staff[db_field] = clean_value(val, 'float')
            else:
                staff[db_field] = clean_value(val, 'string')

    # Normalize status
    if staff.get('status') in STATUS_MAP:
        staff['status'] = STATUS_MAP[staff['status']]
    elif not staff.get('status'):
        staff['status'] = '在職中'

    # Ensure emp_id is string
    if staff.get('emp_id'):
        emp_id = staff['emp_id']
        staff['emp_id'] = str(int(emp_id)) if isinstance(emp_id, float) else str(emp_id)

    return staff


def read_excel_data(sheet_filter: str = None) -> list:
    """Read all data from Excel sheets."""
    print(f"Reading Excel: {EXCEL_PATH.name}")

    all_staff = []
    sheets = [
        ('DBGenzaiX', 'GenzaiX'),
        ('DBUkeoiX', 'Ukeoi'),
    ]

    for sheet_name, staff_type in sheets:
        if sheet_filter and staff_type != sheet_filter:
            continue

        try:
            df = pd.read_excel(EXCEL_PATH, sheet_name=sheet_name, header=0)
            print(f"   {sheet_name}: {len(df)} rows")

            for _, row in df.iterrows():
                staff = map_row_to_staff(row, staff_type)
                if staff.get('emp_id'):
                    all_staff.append(staff)
        except Exception as e:
            print(f"   Error reading {sheet_name}: {e}")

    print(f"   Total: {len(all_staff)} staff records")
    return all_staff


def get_existing_staff(client, headers: dict) -> dict:
    """Get all existing staff from Supabase."""
    existing = {}
    offset = 0
    limit = 1000

    while True:
        url = f'{SUPABASE_URL}/rest/v1/staff?select=id,emp_id&offset={offset}&limit={limit}'
        response = client.get(url, headers=headers)

        if response.status_code != 200:
            break

        batch = response.json()
        if not batch:
            break

        for s in batch:
            existing[s['emp_id']] = s['id']

        offset += limit
        if len(batch) < limit:
            break

    return existing


def upsert_staff(client, headers: dict, staff_list: list, existing: dict, dry_run: bool = False):
    """Upsert staff to Supabase."""
    inserted = 0
    updated = 0
    errors = 0

    headers_post = {**headers, 'Prefer': 'return=minimal'}

    for i, staff in enumerate(staff_list):
        emp_id = staff.get('emp_id')
        if not emp_id:
            continue

        if dry_run:
            action = "update" if emp_id in existing else "insert"
            if i < 5:
                print(f"   [{action}] {emp_id}: {staff.get('full_name', 'N/A')}")
            continue

        try:
            if emp_id in existing:
                staff_id = existing[emp_id]
                url = f'{SUPABASE_URL}/rest/v1/staff?id=eq.{staff_id}'
                resp = client.patch(url, headers=headers_post, json=staff)
                if resp.status_code in [200, 204]:
                    updated += 1
                else:
                    errors += 1
            else:
                url = f'{SUPABASE_URL}/rest/v1/staff'
                resp = client.post(url, headers=headers_post, json=staff)
                if resp.status_code in [200, 201]:
                    inserted += 1
                else:
                    errors += 1
                    if errors <= 3:
                        print(f"   Error inserting {emp_id}: {resp.text[:100]}")
        except Exception as e:
            errors += 1

        if (i + 1) % 200 == 0:
            print(f"   Progress: {i+1}/{len(staff_list)} - Inserted: {inserted}, Updated: {updated}")

    return inserted, updated, errors


def main():
    parser = argparse.ArgumentParser(description="Import Excel data to Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Preview without importing")
    parser.add_argument("--sheet", choices=['GenzaiX', 'Ukeoi'], help="Import specific sheet only")
    args = parser.parse_args()

    print("=" * 60)
    print("EXCEL TO SUPABASE IMPORT")
    print("=" * 60)

    if not SUPABASE_SERVICE_KEY:
        print("\nError: SUPABASE_SERVICE_ROLE_KEY not set in .env.local")
        return

    if not EXCEL_PATH.exists():
        print(f"\nError: Excel file not found: {EXCEL_PATH}")
        return

    # Read Excel
    print("\n[1/3] Reading Excel data...")
    staff_list = read_excel_data(args.sheet)

    if not staff_list:
        print("No staff records found!")
        return

    # Setup headers
    headers = get_headers(use_service_key=True)

    with httpx.Client(timeout=60) as client:
        # Get existing staff
        print("\n[2/3] Getting existing staff from Supabase...")
        existing = get_existing_staff(client, headers)
        print(f"   Found {len(existing)} existing staff")

        # Upsert
        print(f"\n[3/3] {'[DRY RUN] Would import' if args.dry_run else 'Importing to Supabase'}...")
        inserted, updated, errors = upsert_staff(client, headers, staff_list, existing, args.dry_run)

    if not args.dry_run:
        print("\n" + "=" * 60)
        print("IMPORT COMPLETE!")
        print("=" * 60)
        print(f"Inserted: {inserted}")
        print(f"Updated: {updated}")
        print(f"Errors: {errors}")
        print(f"Total processed: {len(staff_list)}")
    else:
        print(f"\n[DRY RUN] Would process {len(staff_list)} records")
        print(f"   New: {len([s for s in staff_list if s.get('emp_id') not in existing])}")
        print(f"   Updates: {len([s for s in staff_list if s.get('emp_id') in existing])}")


if __name__ == "__main__":
    main()
