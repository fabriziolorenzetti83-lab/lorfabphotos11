#!/usr/bin/env python3
"""
generate-manifest.py
Scansiona automaticamente la cartella viaggi/ (incluse tutte le eventuali sottocartelle)
e genera manifest.json con percorsi web relativi deterministici.
"""

import os
import json
import re
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

VALID_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

def natural_key(text):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', text)]

def generate_manifest():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)
    viaggi_dir = os.path.join(root_dir, 'viaggi')
    manifest_file = os.path.join(root_dir, 'manifest.json')

    print("[SCAN] Avvio scansione ricorsiva cartella viaggi...")

    if not os.path.exists(viaggi_dir):
        print("[WARN] Cartella 'viaggi' non trovata. Creazione cartella vuota...")
        os.makedirs(viaggi_dir, exist_ok=True)

    manifest = {}
    total_trips = 0
    total_photos = 0

    try:
        entries = sorted(os.listdir(viaggi_dir), key=natural_key)
    except Exception as e:
        print(f"[ERROR] Errore nella lettura di viaggi: {e}")
        return

    for entry in entries:
        trip_path = os.path.join(viaggi_dir, entry)
        if not os.path.isdir(trip_path):
            continue

        trip_id = entry
        images = []

        # Scansione ricorsiva (gestisce sottocartelle come Siviglia/Alcazar, etc.)
        for root, dirs, files in os.walk(trip_path):
            for file in sorted(files, key=natural_key):
                ext = os.path.splitext(file)[1].lower()
                if ext in VALID_EXTENSIONS:
                    full_file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_file_path, root_dir)
                    # Converti in slash '/' per il web
                    web_path = rel_path.replace(os.path.sep, '/')
                    images.append(web_path)

        images.sort(key=natural_key)
        manifest[trip_id] = images
        total_trips += 1
        total_photos += len(images)
        print(f"  -> Viaggio '{trip_id}': {len(images)} fotografie trovate.")

    with open(manifest_file, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print(f"\n[OK] manifest.json generato con successo!")
    print(f"[STATS] Totale viaggi: {total_trips} | Totale fotografie: {total_photos}")
    print(f"[DEST] Percorso: {manifest_file}")

if __name__ == '__main__':
    generate_manifest()
