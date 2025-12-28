# -*- coding: utf-8 -*-
"""
Access Database Analyzer v2
Handles Japanese text properly
"""

import win32com.client
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

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
    output = []

    def log(text=""):
        output.append(text)
        print(text)

    log("=" * 80)
    log("ACCESS DATABASE STRUCTURE ANALYSIS")
    log("=" * 80)
    log(f"\nDatabase: {DB_PATH}\n")

    try:
        # Open database using DAO
        dao = win32com.client.Dispatch("DAO.DBEngine.120")
        db = dao.OpenDatabase(DB_PATH)

        # =====================================================
        # 1. LIST ALL TABLES
        # =====================================================
        log("\n" + "=" * 80)
        log("1. TABLES IN DATABASE")
        log("=" * 80)

        tables = []
        for tdef in db.TableDefs:
            # Skip system tables (start with MSys or ~)
            if not tdef.Name.startswith("MSys") and not tdef.Name.startswith("~"):
                tables.append(tdef.Name)

        log(f"\nFound {len(tables)} user tables:\n")
        for i, table_name in enumerate(sorted(tables), 1):
            log(f"  {i}. {table_name}")

        # =====================================================
        # 2. DETAILED TABLE STRUCTURE
        # =====================================================
        log("\n" + "=" * 80)
        log("2. DETAILED TABLE STRUCTURE")
        log("=" * 80)

        table_info = {}
        attachment_fields = []

        for table_name in sorted(tables):
            log(f"\n{'-' * 80}")
            log(f"TABLE: {table_name}")
            log(f"{'-' * 80}")

            tdef = db.TableDefs(table_name)

            # Get record count
            try:
                rs = db.OpenRecordset(table_name)
                rs.MoveLast()
                record_count = rs.RecordCount
                rs.Close()
            except:
                record_count = 0

            log(f"Record Count: {record_count}")
            log(f"\nFields ({tdef.Fields.Count} total):")

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

                marker = " [ATTACHMENT]" if field.Type == 101 else (" [OLE]" if field.Type == 11 else "")
                log(f"  - {field.Name}: {field_type}{marker}")

            table_info[table_name] = {
                "record_count": record_count,
                "fields": fields_info
            }

        # =====================================================
        # 3. ATTACHMENT/PHOTO FIELDS SUMMARY
        # =====================================================
        log("\n" + "=" * 80)
        log("3. ATTACHMENT / PHOTO FIELDS")
        log("=" * 80)

        if attachment_fields:
            log(f"\nFound {len(attachment_fields)} attachment/OLE fields:\n")
            for af in attachment_fields:
                log(f"  Table: {af['table']}")
                log(f"  Field: {af['field']}")
                log(f"  Type:  {af['type']}")
                log()
        else:
            log("\nNo attachment or OLE fields found.")

        # =====================================================
        # 4. RELATIONSHIPS
        # =====================================================
        log("\n" + "=" * 80)
        log("4. TABLE RELATIONSHIPS")
        log("=" * 80)

        relations = db.Relations
        if relations.Count > 0:
            log(f"\nFound {relations.Count} relationships:\n")
            for rel in relations:
                log(f"  Relationship: {rel.Name}")
                log(f"  From Table:   {rel.Table}")
                log(f"  To Table:     {rel.ForeignTable}")
                log(f"  Fields:")
                for field in rel.Fields:
                    log(f"    {field.Name} -> {field.ForeignName}")
                log()
        else:
            log("\nNo explicit relationships defined.")

        # =====================================================
        # 5. RECORD COUNT SUMMARY
        # =====================================================
        log("\n" + "=" * 80)
        log("5. RECORD COUNT SUMMARY")
        log("=" * 80)
        log()

        total_records = 0
        for table_name in sorted(tables):
            count = table_info[table_name]["record_count"]
            total_records += count
            log(f"  {table_name}: {count} records")

        log(f"\n  TOTAL: {total_records} records")

        # =====================================================
        # 6. KEY TABLES ANALYSIS
        # =====================================================
        log("\n" + "=" * 80)
        log("6. KEY EMPLOYEE/RESUME TABLES")
        log("=" * 80)

        key_tables = ["T_履歴書", "DBGenzaiX", "DBUkeoiX", "DBStaffX", "T_派遣連携", "T_派遣先"]

        for kt in key_tables:
            if kt in tables:
                log(f"\n--- {kt} ---")
                log(f"Records: {table_info[kt]['record_count']}")
                log("Important fields:")
                for f in table_info[kt]['fields']:
                    if any(x in f['name'].lower() for x in ['id', '名', 'name', '写真', 'photo', '在留', 'visa', '生年', 'birth', '派遣', '電話', 'tel']):
                        log(f"  * {f['name']}: {f['type']}")

        db.Close()

        # Write to file
        with open(r"C:\Users\Jpkken\JpkkenRirekisho12.24v1.0\db_analysis_report.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(output))

        log("\n" + "=" * 80)
        log("ANALYSIS COMPLETE - Report saved to db_analysis_report.txt")
        log("=" * 80)

    except Exception as e:
        log(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_database()
