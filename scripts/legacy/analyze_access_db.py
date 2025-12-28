"""
Access Database Analyzer
Analyzes the structure of an Access database including:
- Tables and their columns
- Field types and properties
- Record counts
- Relationships
"""

import win32com.client
import sys

DB_PATH = r"C:\Users\Jpkken\Downloads\ユニバーサル企画㈱データベースv25.3.24_be.accdb"

# DAO field type constants
FIELD_TYPES = {
    1: "Boolean",
    2: "Byte",
    3: "Integer",
    4: "Long",
    5: "Currency",
    6: "Single",
    7: "Double",
    8: "Date/Time",
    9: "Binary",
    10: "Text",
    11: "Long Binary (OLE Object)",
    12: "Memo",
    15: "GUID",
    16: "BigInt",
    17: "VarBinary",
    18: "Char",
    19: "Numeric",
    20: "Decimal",
    21: "Float",
    22: "Time",
    23: "Timestamp",
    101: "Attachment",
    102: "Complex Byte",
    103: "Complex Integer",
    104: "Complex Long",
    105: "Complex Single",
    106: "Complex Double",
    107: "Complex GUID",
    108: "Complex Decimal",
    109: "Complex Text",
}

def get_field_type_name(type_code):
    return FIELD_TYPES.get(type_code, f"Unknown ({type_code})")

def analyze_database():
    print("=" * 80)
    print("ACCESS DATABASE STRUCTURE ANALYSIS")
    print("=" * 80)
    print(f"\nDatabase: {DB_PATH}\n")

    try:
        # Open database using DAO
        dao = win32com.client.Dispatch("DAO.DBEngine.120")
        db = dao.OpenDatabase(DB_PATH)

        # =====================================================
        # 1. LIST ALL TABLES
        # =====================================================
        print("\n" + "=" * 80)
        print("1. TABLES IN DATABASE")
        print("=" * 80)

        tables = []
        for tdef in db.TableDefs:
            # Skip system tables (start with MSys or ~)
            if not tdef.Name.startswith("MSys") and not tdef.Name.startswith("~"):
                tables.append(tdef.Name)

        print(f"\nFound {len(tables)} user tables:\n")
        for i, table_name in enumerate(sorted(tables), 1):
            print(f"  {i}. {table_name}")

        # =====================================================
        # 2. DETAILED TABLE STRUCTURE
        # =====================================================
        print("\n" + "=" * 80)
        print("2. DETAILED TABLE STRUCTURE")
        print("=" * 80)

        table_info = {}
        attachment_fields = []

        for table_name in sorted(tables):
            print(f"\n{'─' * 80}")
            print(f"TABLE: {table_name}")
            print(f"{'─' * 80}")

            tdef = db.TableDefs(table_name)

            # Get record count
            try:
                rs = db.OpenRecordset(table_name)
                rs.MoveLast()
                record_count = rs.RecordCount
                rs.Close()
            except:
                record_count = 0

            print(f"Record Count: {record_count}")
            print(f"\nFields ({tdef.Fields.Count} total):")
            print("-" * 60)

            fields_info = []
            for field in tdef.Fields:
                field_type = get_field_type_name(field.Type)
                size = field.Size if field.Size else "-"
                required = "Yes" if field.Required else "No"

                fields_info.append({
                    "name": field.Name,
                    "type": field_type,
                    "type_code": field.Type,
                    "size": size,
                    "required": required
                })

                # Track attachment and OLE fields
                if field.Type in [11, 101]:  # OLE or Attachment
                    attachment_fields.append({
                        "table": table_name,
                        "field": field.Name,
                        "type": field_type
                    })

                print(f"  {field.Name:<35} {field_type:<20} Size: {size:<10} Required: {required}")

            table_info[table_name] = {
                "record_count": record_count,
                "fields": fields_info
            }

        # =====================================================
        # 3. ATTACHMENT/PHOTO FIELDS SUMMARY
        # =====================================================
        print("\n" + "=" * 80)
        print("3. ATTACHMENT / PHOTO FIELDS")
        print("=" * 80)

        if attachment_fields:
            print(f"\nFound {len(attachment_fields)} attachment/OLE fields:\n")
            for af in attachment_fields:
                print(f"  Table: {af['table']}")
                print(f"  Field: {af['field']}")
                print(f"  Type:  {af['type']}")
                print()
        else:
            print("\nNo attachment or OLE fields found.")

        # =====================================================
        # 4. RELATIONSHIPS
        # =====================================================
        print("\n" + "=" * 80)
        print("4. TABLE RELATIONSHIPS")
        print("=" * 80)

        relations = db.Relations
        if relations.Count > 0:
            print(f"\nFound {relations.Count} relationships:\n")
            for rel in relations:
                print(f"  Relationship: {rel.Name}")
                print(f"  From Table:   {rel.Table}")
                print(f"  To Table:     {rel.ForeignTable}")
                print(f"  Fields:")
                for field in rel.Fields:
                    print(f"    {field.Name} -> {field.ForeignName}")
                print()
        else:
            print("\nNo explicit relationships defined.")

        # =====================================================
        # 5. RECORD COUNT SUMMARY
        # =====================================================
        print("\n" + "=" * 80)
        print("5. RECORD COUNT SUMMARY")
        print("=" * 80)
        print()

        total_records = 0
        for table_name in sorted(tables):
            count = table_info[table_name]["record_count"]
            total_records += count
            print(f"  {table_name:<40} {count:>8} records")

        print(f"\n  {'TOTAL':<40} {total_records:>8} records")

        # =====================================================
        # 6. CANDIDATE/EMPLOYEE TABLES DEEP DIVE
        # =====================================================
        print("\n" + "=" * 80)
        print("6. EMPLOYEE/CANDIDATE DATA ANALYSIS")
        print("=" * 80)

        # Look for tables that might contain employee data
        employee_keywords = ["履歴", "社員", "従業員", "スタッフ", "人事", "candidate", "employee", "staff"]

        for table_name in sorted(tables):
            is_employee_table = any(kw.lower() in table_name.lower() for kw in employee_keywords)

            if is_employee_table:
                print(f"\n{'─' * 80}")
                print(f"EMPLOYEE TABLE: {table_name}")
                print(f"{'─' * 80}")
                print(f"Records: {table_info[table_name]['record_count']}")
                print("\nKey Fields:")

                for field in table_info[table_name]["fields"]:
                    # Highlight important fields
                    name_lower = field["name"].lower()
                    is_important = any(kw in name_lower for kw in
                        ["名前", "氏名", "name", "id", "番号", "写真", "photo", "image", "在留", "visa",
                         "電話", "tel", "phone", "住所", "address", "生年月日", "birth", "性別", "gender"])

                    if is_important:
                        print(f"  ** {field['name']:<35} {field['type']:<20}")
                    else:
                        print(f"     {field['name']:<35} {field['type']:<20}")

        db.Close()
        print("\n" + "=" * 80)
        print("ANALYSIS COMPLETE")
        print("=" * 80)

    except Exception as e:
        print(f"\nERROR: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure the database file exists")
        print("2. Close the database if it's open in Access")
        print("3. Ensure you have Access Database Engine installed")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_database()
