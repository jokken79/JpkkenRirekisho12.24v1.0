"""
Full Excel to Supabase Import
=============================
Imports ALL data from 社員台帳 Excel to Supabase with proper field mapping.
"""

import pandas as pd
import httpx
import sys
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Configuration
EXCEL_PATH = Path(__file__).parent.parent / "【新】社員台帳(UNS)T　2022.04.05～.xlsm"
SUPABASE_URL = 'https://besembwtnuarriscreve.supabase.co'
SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc2VtYnd0bnVhcnJpc2NyZXZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwOTY3OSwiZXhwIjoyMDgyMzg1Njc5fQ.6FB1US69sX5XbdlvBF8HNubDKxdhCo8cjKbTZHP6pnc'

# Excel column to Supabase field mapping (only existing columns)
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

# Status mapping
STATUS_MAP = {
    '在職中': '在職中',
    '退社': '退社',
    '待機中': '待機中',
    0: '在職中',
    '0': '在職中',
}

def clean_value(val, field_type='string'):
    """Clean and convert value based on field type"""
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

def read_excel_data():
    """Read all data from Excel sheets"""
    print(f"Reading Excel: {EXCEL_PATH}")

    all_staff = []

    # Read GenzaiX (dispatched employees)
    df_genzai = pd.read_excel(EXCEL_PATH, sheet_name='DBGenzaiX', header=0)
    print(f"  DBGenzaiX: {len(df_genzai)} rows")
    for _, row in df_genzai.iterrows():
        staff = map_row_to_staff(row, 'GenzaiX')
        if staff.get('emp_id'):
            all_staff.append(staff)

    # Read Ukeoi (contract employees)
    df_ukeoi = pd.read_excel(EXCEL_PATH, sheet_name='DBUkeoiX', header=0)
    print(f"  DBUkeoiX: {len(df_ukeoi)} rows")
    for _, row in df_ukeoi.iterrows():
        staff = map_row_to_staff(row, 'Ukeoi')
        if staff.get('emp_id'):
            all_staff.append(staff)

    print(f"  Total: {len(all_staff)} staff")
    return all_staff

def map_row_to_staff(row, staff_type):
    """Map Excel row to Supabase staff record"""
    staff = {'type': staff_type}

    for excel_col, db_field in COLUMN_MAP.items():
        if excel_col in row.index:
            val = row[excel_col]

            # Determine field type
            if db_field in ['birth_date', 'visa_expiry', 'hire_date', 'leave_date', 'license_expiry']:
                staff[db_field] = clean_value(val, 'date')
            elif db_field in ['age', 'hourly_wage', 'billing_unit', 'profit_margin']:
                staff[db_field] = clean_value(val, 'int')
            elif db_field in ['health_ins', 'nursing_ins', 'pension', 'standard_remuneration']:
                staff[db_field] = clean_value(val, 'float')
            else:
                staff[db_field] = clean_value(val, 'string')

    # Clean up status
    if staff.get('status') in STATUS_MAP:
        staff['status'] = STATUS_MAP[staff['status']]
    elif not staff.get('status'):
        staff['status'] = '在職中'

    # Ensure emp_id is string
    if staff.get('emp_id'):
        staff['emp_id'] = str(int(staff['emp_id'])) if isinstance(staff['emp_id'], float) else str(staff['emp_id'])

    return staff

def get_existing_staff(client, headers):
    """Get all existing staff from Supabase"""
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

def upsert_staff(client, headers, staff_list, existing):
    """Upsert staff to Supabase"""
    inserted = 0
    updated = 0
    errors = 0

    headers_post = {**headers, 'Prefer': 'return=minimal'}

    for i, staff in enumerate(staff_list):
        emp_id = staff.get('emp_id')
        if not emp_id:
            continue

        try:
            if emp_id in existing:
                # Update existing
                staff_id = existing[emp_id]
                url = f'{SUPABASE_URL}/rest/v1/staff?id=eq.{staff_id}'
                resp = client.patch(url, headers=headers_post, json=staff)
                if resp.status_code in [200, 204]:
                    updated += 1
                else:
                    errors += 1
            else:
                # Insert new
                url = f'{SUPABASE_URL}/rest/v1/staff'
                resp = client.post(url, headers=headers_post, json=staff)
                if resp.status_code in [200, 201]:
                    inserted += 1
                else:
                    errors += 1
                    if errors <= 3:
                        print(f"  Error inserting {emp_id}: {resp.text[:100]}")
        except Exception as e:
            errors += 1

        if (i + 1) % 200 == 0:
            print(f"  Progress: {i+1}/{len(staff_list)} - Inserted: {inserted}, Updated: {updated}")

    return inserted, updated, errors

def main():
    print("=" * 60)
    print("FULL EXCEL TO SUPABASE IMPORT")
    print("=" * 60)

    # Read Excel
    print("\n[1/3] Reading Excel data...")
    staff_list = read_excel_data()

    # Setup Supabase client
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
    }

    with httpx.Client(timeout=60) as client:
        # Get existing staff
        print("\n[2/3] Getting existing staff from Supabase...")
        existing = get_existing_staff(client, headers)
        print(f"  Found {len(existing)} existing staff")

        # Upsert
        print("\n[3/3] Importing to Supabase...")
        inserted, updated, errors = upsert_staff(client, headers, staff_list, existing)

    print("\n" + "=" * 60)
    print("IMPORT COMPLETE!")
    print("=" * 60)
    print(f"Inserted: {inserted}")
    print(f"Updated: {updated}")
    print(f"Errors: {errors}")
    print(f"Total processed: {len(staff_list)}")

if __name__ == "__main__":
    main()
