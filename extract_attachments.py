import win32com.client
import os

# CONFIGURACIÓN
DB_PATH = r"D:\RirekishoDBaseAntigua\ユニバーサル企画㈱データベースv24.1.1_be.accdb"
OUTPUT_DIR = r"D:\staffhub-uns-pro\public\photos"
TABLE_NAME = "T_履歴書"
PHOTO_FIELD = "写真"

# Asegurar que existe el directorio
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

try:
    print(f"Iniciando motor DAO para abrir: {DB_PATH}")
    # Usamos DAO.DBEngine.120 (para accdb)
    dao = win32com.client.Dispatch("DAO.DBEngine.120")
    db = dao.OpenDatabase(DB_PATH)
    
    print(f"Abriendo tabla: {TABLE_NAME}...")
    rs = db.OpenRecordset(TABLE_NAME)
    
    count = 0
    success_count = 0
    
    if not rs.EOF:
        rs.MoveFirst()
        
    while not rs.EOF:
        try:
            # Obtener el campo de adjuntos (es un Recordset hijo)
            attachment_rs = rs.Fields(PHOTO_FIELD).Value
            
            # Verificar si hay adjuntos en este registro
            if attachment_rs and not attachment_rs.EOF:
                while not attachment_rs.EOF:
                    # Access guarda varios datos del archivo adjunto:
                    # FileData, FileName, FileType
                    file_name = attachment_rs.Fields("FileName").Value
                    
                    if file_name:
                        output_path = os.path.join(OUTPUT_DIR, file_name)
                        
                        # Si el archivo ya existe, saltar para ahorrar tiempo
                        if not os.path.exists(output_path):
                            # Guardar el binario al disco
                            field_data = attachment_rs.Fields("FileData")
                            field_data.SaveToFile(output_path)
                            print(f"[OK] Guardado: {file_name}")
                            success_count += 1
                        else:
                            # print(f"[SKIP] Ya existe: {file_name}")
                            pass
                            
                    attachment_rs.MoveNext()
            
        except Exception as e:
            # A veces un registro específico falla, seguimos al siguiente
            print(f"[ERROR] Fallo en registro {count}: {e}")

        rs.MoveNext()
        count += 1
        if count % 100 == 0:
            print(f"Procesados {count} registros...")

    print("-" * 30)
    print(f"PROCESO TERMINADO.")
    print(f"Registros analizados: {count}")
    print(f"Fotos nuevas extraídas: {success_count}")
    print(f"Ubicación: {OUTPUT_DIR}")

except Exception as e:
    print(f"\nERROR CRÍTICO: {e}")
    print("Asegúrate de que la base de datos NO esté abierta en Access.")
finally:
    try:
        if 'rs' in locals(): rs.Close()
        if 'db' in locals(): db.Close()
    except:
        pass
