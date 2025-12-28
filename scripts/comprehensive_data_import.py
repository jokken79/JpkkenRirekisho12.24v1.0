"""
Comprehensive Data Import Script for StaffHub UNS Pro
======================================================
Imports ALL data from:
1. Excel file (社員台帳) - Current employee records
2. Access database (履歴書) - Candidate/employee photos and documents
3. Maps photos in public/photos/ to employee records

Creates JSON files ready for IndexedDB import.
"""

import win32com.client
import os
import json
import re
from datetime import datetime
from pathlib import Path
import pandas as pd
import hashlib

# Configuration
BASE_DIR = Path(r"C:\Users\Jpkken\JpkkenRirekisho12.24v1.0")
EXCEL_PATH = BASE_DIR / "【新】社員台帳(UNS)T　2022.04.05～.xlsm"
ACCESS_PATH = Path(r"C:\Users\Jpkken\Downloads\ユニバーサル企画㈱データベースv25.3.24_be.accdb")
PHOTOS_DIR = BASE_DIR / "public" / "photos"
OUTPUT_DIR = BASE_DIR / "scripts" / "import_data"

# Create output directory
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def excel_date_to_iso(val):
    """Convert Excel date (serial or datetime) to ISO string"""
    if pd.isna(val) or val == 0:
        return None
    try:
        if isinstance(val, (int, float)):
            # Excel serial date
            if val > 50000:  # Too large, probably not a date
                return None
            dt = pd.to_datetime('1899-12-30') + pd.to_timedelta(val, 'D')
            return dt.strftime('%Y-%m-%d')
        elif isinstance(val, datetime):
            return val.strftime('%Y-%m-%d')
        elif isinstance(val, str):
            return val
    except:
        return None
    return None

def normalize_name(name):
    """Normalize name for matching"""
    if not name:
        return ""
    # Remove spaces, convert to uppercase, remove special chars
    name = str(name).upper().strip()
    name = re.sub(r'[\s\u3000]+', ' ', name)  # Normalize spaces
    return name

def find_photo_for_employee(emp_id, name, existing_photos):
    """Find the best matching photo for an employee"""
    matches = []

    emp_id_str = str(emp_id) if emp_id else ""
    name_normalized = normalize_name(name)

    for photo in existing_photos:
        photo_name = Path(photo).stem.upper()

        # Direct ID match (highest priority)
        if emp_id_str and photo_name == emp_id_str:
            return photo  # Exact match

        # Numeric ID in filename
        if emp_id_str and re.match(r'^\d+$', photo_name):
            if photo_name == emp_id_str:
                return photo

        # Name match (for Vietnamese names in filename)
        if name_normalized:
            # Remove accents for comparison
            photo_clean = re.sub(r'[_\-\.]', ' ', photo_name)
            if photo_clean == name_normalized:
                matches.append((photo, 100))
            elif name_normalized in photo_clean or photo_clean in name_normalized:
                matches.append((photo, 50))

    # Return best match if any
    if matches:
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches[0][0]

    return None

def import_excel_employees():
    """Import employee data from Excel"""
    print("\n" + "="*60)
    print("IMPORTING EXCEL EMPLOYEE DATA")
    print("="*60)

    # Read all sheets
    xl = pd.ExcelFile(EXCEL_PATH)

    all_employees = []

    # Process GenzaiX (Dispatched workers)
    print("\nReading DBGenzaiX sheet...")
    df_genzai = pd.read_excel(EXCEL_PATH, sheet_name='DBGenzaiX')

    for _, row in df_genzai.iterrows():
        if pd.isna(row.get('社員№')):
            continue

        emp = {
            'type': 'GenzaiX',
            'status': row.get('現在', ''),
            'empId': str(int(row.get('社員№', 0))) if pd.notna(row.get('社員№')) else '',
            'fullName': row.get('氏名', ''),
            'furigana': row.get('カナ', ''),
            'gender': row.get('性別', ''),
            'nationality': row.get('国籍', ''),
            'birthDate': excel_date_to_iso(row.get('生年月日')),
            'age': int(row.get('年齢', 0)) if pd.notna(row.get('年齢')) else None,
            'dispatchCompany': row.get('派遣先', ''),
            'dispatchId': row.get('派遣先ID', ''),
            'department': row.get('配属先', ''),
            'assignmentLine': row.get('配属ライン', ''),
            'jobContent': row.get('仕事内容', ''),
            'hourlyWage': int(row.get('時給', 0)) if pd.notna(row.get('時給')) else None,
            'billingUnit': int(row.get('請求単価', 0)) if pd.notna(row.get('請求単価')) else None,
            'profitMargin': int(row.get('差額利益', 0)) if pd.notna(row.get('差額利益')) else None,
            'standardRemuneration': int(row.get('標準報酬', 0)) if pd.notna(row.get('標準報酬')) else None,
            'healthIns': float(row.get('健康保険', 0)) if pd.notna(row.get('健康保険')) else None,
            'nursingIns': float(row.get('介護保険', 0)) if pd.notna(row.get('介護保険')) else None,
            'pension': float(row.get('厚生年金', 0)) if pd.notna(row.get('厚生年金')) else None,
            'visaExpiry': excel_date_to_iso(row.get('ビザ期限')),
            'visaType': row.get('ビザ種類', ''),
            'postalCode': row.get('〒', ''),
            'address': row.get('住所', ''),
            'apartment': row.get('アパート', ''),
            'hireDate': excel_date_to_iso(row.get('入社日')),
            'resignDate': excel_date_to_iso(row.get('退社日')),
            'socialInsStatus': row.get('社保加入', ''),
            'notes': row.get('備考', ''),
            'licenseType': row.get('免許種類', ''),
            'licenseExpiry': row.get('免許期限', ''),
            'commuteMethod': row.get('通勤方法', ''),
            'japaneseLevel': row.get('日本語検定', ''),
        }

        # Clean None values
        emp = {k: v for k, v in emp.items() if v is not None and v != '' and v != 0}
        all_employees.append(emp)

    print(f"  -> {len([e for e in all_employees if e.get('type') == 'GenzaiX'])} GenzaiX records")

    # Process Ukeoi (Contract workers)
    print("\nReading DBUkeoiX sheet...")
    df_ukeoi = pd.read_excel(EXCEL_PATH, sheet_name='DBUkeoiX')

    for _, row in df_ukeoi.iterrows():
        if pd.isna(row.get('社員№')):
            continue

        emp = {
            'type': 'Ukeoi',
            'status': row.get('現在', ''),
            'empId': str(int(row.get('社員№', 0))) if pd.notna(row.get('社員№')) else '',
            'fullName': row.get('氏名', ''),
            'furigana': row.get('カナ', ''),
            'gender': row.get('性別', ''),
            'nationality': row.get('国籍', ''),
            'birthDate': excel_date_to_iso(row.get('生年月日')),
            'age': int(row.get('年齢', 0)) if pd.notna(row.get('年齢')) else None,
            'contractWork': row.get('請負業務', ''),
            'department': row.get('部署', '') if '部署' in row else '',
            'hourlyWage': int(row.get('時給', 0)) if pd.notna(row.get('時給')) else None,
            'standardRemuneration': int(row.get('標準報酬', 0)) if pd.notna(row.get('標準報酬')) else None,
            'healthIns': float(row.get('健康保険', 0)) if pd.notna(row.get('健康保険')) else None,
            'nursingIns': float(row.get('介護保険', 0)) if pd.notna(row.get('介護保険')) else None,
            'pension': float(row.get('厚生年金', 0)) if pd.notna(row.get('厚生年金')) else None,
            'visaExpiry': excel_date_to_iso(row.get('ビザ期限')),
            'visaType': row.get('ビザ種類', ''),
            'postalCode': row.get('〒', ''),
            'address': row.get('住所', ''),
            'hireDate': excel_date_to_iso(row.get('入社日')),
            'resignDate': excel_date_to_iso(row.get('退社日')),
            'notes': row.get('備考', ''),
        }

        emp = {k: v for k, v in emp.items() if v is not None and v != '' and v != 0}
        all_employees.append(emp)

    print(f"  -> {len([e for e in all_employees if e.get('type') == 'Ukeoi'])} Ukeoi records")

    return all_employees

def extract_access_photos():
    """Extract photos and data from Access database"""
    print("\n" + "="*60)
    print("EXTRACTING ACCESS DATABASE PHOTOS")
    print("="*60)

    photo_mapping = {}  # resume_id -> photo filename
    resume_data = []

    try:
        dao = win32com.client.Dispatch("DAO.DBEngine.120")
        db = dao.OpenDatabase(str(ACCESS_PATH))

        # Read T_履歴書 table
        print("\nReading T_履歴書 table...")
        rs = db.OpenRecordset("T_履歴書")

        count = 0
        photo_count = 0

        if not rs.EOF:
            rs.MoveFirst()

        while not rs.EOF:
            try:
                resume_id = rs.Fields("履歴書ID").Value
                name = rs.Fields("氏名").Value if rs.Fields("氏名").Value else ""
                name_roman = rs.Fields("氏名（ローマ字)").Value if "氏名（ローマ字)" in [f.Name for f in rs.Fields] else ""

                # Extract photo
                try:
                    attachment_rs = rs.Fields("写真").Value
                    if attachment_rs and not attachment_rs.EOF:
                        file_name = attachment_rs.Fields("FileName").Value
                        if file_name:
                            output_path = PHOTOS_DIR / file_name
                            if not output_path.exists():
                                field_data = attachment_rs.Fields("FileData")
                                field_data.SaveToFile(str(output_path))
                                print(f"  [NEW] Extracted: {file_name}")
                                photo_count += 1

                            photo_mapping[resume_id] = file_name
                except:
                    pass

                # Collect resume data for matching
                resume_data.append({
                    'resumeId': resume_id,
                    'name': name,
                    'nameRoman': name_roman,
                    'photo': photo_mapping.get(resume_id),
                })

            except Exception as e:
                pass

            rs.MoveNext()
            count += 1
            if count % 200 == 0:
                print(f"  Processed {count} records...")

        rs.Close()
        db.Close()

        print(f"\n  Total records: {count}")
        print(f"  New photos extracted: {photo_count}")
        print(f"  Total with photos: {len(photo_mapping)}")

    except Exception as e:
        print(f"ERROR: {e}")

    return photo_mapping, resume_data

def map_photos_to_employees(employees, resume_data):
    """Map photos to employees using multiple strategies"""
    print("\n" + "="*60)
    print("MAPPING PHOTOS TO EMPLOYEES")
    print("="*60)

    # Get list of all photos
    existing_photos = [f.name for f in PHOTOS_DIR.iterdir() if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']]
    print(f"\nTotal photos in folder: {len(existing_photos)}")

    # Create lookup tables
    name_to_photo = {}
    for r in resume_data:
        if r.get('photo'):
            if r.get('name'):
                name_to_photo[normalize_name(r['name'])] = r['photo']
            if r.get('nameRoman'):
                name_to_photo[normalize_name(r['nameRoman'])] = r['photo']

    # Create ID to photo map from filenames
    id_to_photo = {}
    for photo in existing_photos:
        stem = Path(photo).stem
        if re.match(r'^\d+$', stem):
            id_to_photo[stem] = photo

    matched = 0
    unmatched = []

    for emp in employees:
        emp_id = emp.get('empId', '')
        name = emp.get('fullName', '')

        photo = None
        match_type = None

        # Strategy 1: Direct ID match
        if emp_id in id_to_photo:
            photo = id_to_photo[emp_id]
            match_type = "ID"

        # Strategy 2: Name match from resume data
        if not photo and name:
            normalized = normalize_name(name)
            if normalized in name_to_photo:
                photo = name_to_photo[normalized]
                match_type = "NAME_RESUME"

        # Strategy 3: Name in filename
        if not photo and name:
            photo = find_photo_for_employee(emp_id, name, existing_photos)
            if photo:
                match_type = "NAME_FILE"

        if photo:
            emp['avatar'] = photo  # Use 'avatar' to match StaffMember type
            matched += 1
        else:
            unmatched.append({'empId': emp_id, 'name': name})

    print(f"\nMatched: {matched}/{len(employees)} ({matched*100//len(employees)}%)")
    print(f"Unmatched: {len(unmatched)}")

    # Save unmatched for review
    with open(OUTPUT_DIR / "unmatched_employees.json", 'w', encoding='utf-8') as f:
        json.dump(unmatched[:50], f, ensure_ascii=False, indent=2)

    return employees

def create_import_json(employees):
    """Create JSON files for IndexedDB import"""
    print("\n" + "="*60)
    print("CREATING IMPORT FILES")
    print("="*60)

    # Split by type
    genzaix = [e for e in employees if e.get('type') == 'GenzaiX']
    ukeoi = [e for e in employees if e.get('type') == 'Ukeoi']

    # Add IDs for IndexedDB
    for i, emp in enumerate(employees):
        emp['id'] = i + 1

    # Save files
    with open(OUTPUT_DIR / "staff_all.json", 'w', encoding='utf-8') as f:
        json.dump(employees, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_DIR / "staff_genzaix.json", 'w', encoding='utf-8') as f:
        json.dump(genzaix, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_DIR / "staff_ukeoi.json", 'w', encoding='utf-8') as f:
        json.dump(ukeoi, f, ensure_ascii=False, indent=2)

    # Create summary
    summary = {
        'generated': datetime.now().isoformat(),
        'total_employees': len(employees),
        'genzaix_count': len(genzaix),
        'ukeoi_count': len(ukeoi),
        'with_photos': len([e for e in employees if e.get('avatar')]),
        'active': len([e for e in employees if e.get('status') == '在職中']),
        'resigned': len([e for e in employees if e.get('status') == '退社']),
    }

    with open(OUTPUT_DIR / "import_summary.json", 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\nFiles created in: {OUTPUT_DIR}")
    print(f"  - staff_all.json ({len(employees)} records)")
    print(f"  - staff_genzaix.json ({len(genzaix)} records)")
    print(f"  - staff_ukeoi.json ({len(ukeoi)} records)")
    print(f"  - import_summary.json")
    print(f"  - unmatched_employees.json")

    return summary

def main():
    print("="*60)
    print("STAFFHUB UNS PRO - COMPREHENSIVE DATA IMPORT")
    print("="*60)
    print(f"\nSources:")
    print(f"  Excel: {EXCEL_PATH}")
    print(f"  Access: {ACCESS_PATH}")
    print(f"  Photos: {PHOTOS_DIR}")

    # Step 1: Import Excel employees
    employees = import_excel_employees()

    # Step 2: Extract Access photos
    photo_mapping, resume_data = extract_access_photos()

    # Step 3: Map photos to employees
    employees = map_photos_to_employees(employees, resume_data)

    # Step 4: Create import files
    summary = create_import_json(employees)

    print("\n" + "="*60)
    print("IMPORT COMPLETE!")
    print("="*60)
    print(f"\nSummary:")
    print(f"  Total employees: {summary['total_employees']}")
    print(f"  With photos: {summary['with_photos']}")
    print(f"  Active: {summary['active']}")
    print(f"  Resigned: {summary['resigned']}")
    print(f"\nNext steps:")
    print(f"  1. Run 'npm run dev' to start the app")
    print(f"  2. Go to Database Manager")
    print(f"  3. Import staff_all.json")

if __name__ == "__main__":
    main()
