import pyodbc

# Connection string
db_path = r"d:\Basededatosrirekiantiguo\ユニバーサル企画㈱データベースv25.3.24.accdb"
conn_str = (
    r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
    f"DBQ={db_path};"
)

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    print("--- Tablas encontradas ---")
    for row in cursor.tables():
        if row.table_type == 'TABLE':
            print(row.table_name)

    target_table = "T_履歴書"
    print(f"\n--- Columnas en '{target_table}' ---")
    try:
        columns = cursor.columns(table=target_table)
        for col in columns:
            print(f"{col.column_name} ({col.type_name})")
            
        # Quick peek at the photo column data type
        print(f"\n--- Muestra de datos (primer registro) ---")
        cursor.execute(f"SELECT TOP 1 * FROM {target_table}")
        row = cursor.fetchone()
        if row:
            # Print column names and values (truncated)
            columns = [column[0] for column in cursor.description]
            for col_name, value in zip(columns, row):
                val_str = str(value)
                if len(val_str) > 50:
                    val_str = val_str[:50] + "..."
                print(f"{col_name}: {val_str}")
        else:
            print("La tabla está vacía.")

    except Exception as e:
        print(f"Error inspeccionando tabla {target_table}: {e}")

    conn.close()

except Exception as e:
    print(f"Error de conexión: {e}")
