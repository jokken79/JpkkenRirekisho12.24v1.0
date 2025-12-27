
import pyodbc
import json
import pandas as pd
import datetime
import os

# Configuration
DB_PATH = r"C:\Users\Jpkken\Downloads\ユニバーサル企画㈱データベースv25.3.24_be.accdb"
OUTPUT_FILE = r"C:\Users\Jpkken\JpkkenRirekisho12.24v1.0\legacy_resumes.json"

# Access Connection String
conn_str = (
    r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
    f"DBQ={DB_PATH};"
)

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    return str(obj)

try:
    print(f"Connecting to database: {DB_PATH}")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # 1. Find the correct table name
    print("Listing tables...")
    target_table = None
    for table_info in cursor.tables(tableType='TABLE'):
        print(f"Found table: {table_info.table_name}")
        if '履歴書' in table_info.table_name:
            target_table = table_info.table_name
            
    if not target_table:
        # Fallback if specific name not found, try generic search or prompt
        print("WARNING: Could not find table with '履歴書' in name. Listing all tables again to be sure.")
        # Defaulting to T_履歴書 if exists based on previous script, or just fail
        target_table = "履歴書" # Trying exact match

    print(f"Selected table for export: {target_table}")

    # 2. Extract Data using Pandas for easier handling
    sql = f"SELECT * FROM [{target_table}]"
    print(f"Executing: {sql}")
    
    df = pd.read_sql(sql, conn)
    
    print(f"Extracted {len(df)} rows.")
    
    # 3. Clean Data
    # Convert binary/OLE fields to string placeholder because JSON can't hold them directly
    # and extraction of Access OLE images is very complex without specialized C# libs.
    for col in df.columns:
        if df[col].dtype == 'object':
            # Check first non-null value to see if it looks binary
            sample = df[col].dropna().head(1)
            if not sample.empty and isinstance(sample.iloc[0], (bytes, bytearray)):
                print(f"Skipping binary column: {col}")
                df[col] = "[BINARY DATA SKIPPED]"
        
        # Fill NaNs with empty string or sensible defaults
        df[col] = df[col].fillna("")

    # 4. Convert to List of Dicts
    records = df.to_dict(orient='records')

    # 5. Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2, default=json_serial)

    print(f"Successfully exported {len(records)} records to {OUTPUT_FILE}")

    # 6. Analyze Columns for mapping suggestion
    print("\n--- Column Mapping Analysis ---")
    print("JSON Keys found:")
    print(list(df.columns))

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
finally:
    if 'conn' in locals():
        conn.close()
