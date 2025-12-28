
import json
import os
import shutil
import difflib

# RUTAS
JSON_PATH = r"D:\staffhub-uns-pro\public\legacy_resumes.json"
PHOTOS_DIR = r"D:\staffhub-uns-pro\public\photos"
OUTPUT_JSON = r"D:\staffhub-uns-pro\public\legacy_resumes_fixed.json"

def clean_filename(fname):
    """Intenta limpiar nombres corruptos o codificados extrañamente"""
    if not fname: return None
    # A veces Access devuelve rutas completas o con prefijos
    return os.path.basename(fname)

print("Cargando datos...")
with open(JSON_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total candidatos: {len(data)}")

# Obtener lista real de archivos en disco (puede tener nombres corruptos)
try:
    files_on_disk = os.listdir(PHOTOS_DIR)
    print(f"Total archivos en carpeta photos: {len(files_on_disk)}")
except Exception as e:
    print(f"Error leyendo directorio: {e}")
    files_on_disk = []

# Crear mapa de archivos en disco para búsqueda rápida (normalizados)
# Guardamos: { "nombre_limpio": "nombre_real_en_disco" }
disk_map = {}
for f in files_on_disk:
    disk_map[f] = f
    # También mapeamos versiones decodificadas si es posible
    try:
        # Intento común de arreglar mojibake Shift-JIS -> UTF-8
        decoded = f.encode('latin1').decode('shift_jis') 
        disk_map[decoded] = f
    except:
        pass

updated_count = 0
missing_count = 0
renamed_count = 0

for person in data:
    raw_photo_name = person.get("写真", "")
    person_id = person.get("履歴書ID", "")
    
    if not raw_photo_name or not person_id:
        continue
        
    # El nombre que Access "dice" que tiene
    target_name = clean_filename(raw_photo_name)
    
    # Buscar el archivo real
    real_file = None
    
    # 1. Búsqueda exacta
    if target_name in disk_map:
        real_file = disk_map[target_name]
    # 2. Búsqueda insensible a mayúsculas
    else:
        for disk_f in files_on_disk:
            if disk_f.lower() == target_name.lower():
                real_file = disk_f
                break
    
    # Si encontramos el archivo
    if real_file:
        # Crear nuevo nombre limpio basado en ID
        ext = os.path.splitext(real_file)[1].lower()
        if not ext: ext = ".jpg" # Asumir jpg si no tiene extensión
        
        new_clean_name = f"{person_id}{ext}"
        new_path = os.path.join(PHOTOS_DIR, new_clean_name)
        old_path = os.path.join(PHOTOS_DIR, real_file)
        
        # Renombrar (o copiar si queremos preservar el original, renombramos para limpiar)
        try:
            # Solo renombramos si el destino no existe o si es diferente
            if real_file != new_clean_name:
                # Copiar para seguridad (shutil.copy2 preserva metadatos)
                shutil.copy2(old_path, new_path)
                # print(f"Renombrado: {real_file} -> {new_clean_name}")
                renamed_count += 1
            
            # ACTUALIZAR EL JSON
            person["写真"] = new_clean_name
            updated_count += 1
            
        except Exception as e:
            print(f"Error copiando {real_file}: {e}")
            
    else:
        # print(f"Falta foto para ID {person_id}: {target_name}")
        missing_count += 1
        # Dejamos el campo vacío o mantenemos el original?
        # Mejor mantener el original por si acaso aparece luego
        pass

print("-" * 30)
print(f"Proceso finalizado.")
print(f"Fotos enlazadas y renombradas: {renamed_count}")
print(f"Registros actualizados en JSON: {updated_count}")
print(f"Fotos no encontradas (o nombres irreconocibles): {missing_count}")

# Guardar nuevo JSON limpio
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Nuevo JSON guardado en: {OUTPUT_JSON}")
print("IMPORTANTE: Ahora debes importar este archivo JSON en la app.")
