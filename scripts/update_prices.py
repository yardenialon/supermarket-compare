#!/usr/bin/env python3
"""Daily price update from Kaggle."""
import os, sys, csv, psycopg2
from pathlib import Path

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

KAGGLE_DATASET = "erlichsefi/israeli-supermarkets-2024"
EXTRACT_DIR = Path("kaggle_data")

CHAIN_MAP = {
    'shufersal': 'Shufersal', 'rami_levy': 'Rami Levy', 'yochananof': 'Yochananof',
    'victory': 'Victory', 'osher_ad': 'Osher Ad', 'mega': 'Mega', 'tiv_taam': 'Tiv Taam',
    'hazi_hinam': 'Hazi Hinam', 'keshet_taamim': 'Keshet Taamim', 'freshmarket': 'Freshmarket',
    'bareket': 'Bareket', 'city_market': 'City Market', 'dor_alon': 'Dor Alon',
    'good_pharm': 'Good Pharm', 'het_cohen': 'Het Cohen', 'king_store': 'King Store',
    'maayan_2000': 'Maayan 2000', 'mahsani_ashuk': 'Mahsani Ashuk',
    'meshmat_yosef': 'Meshmat Yosef', 'netiv_hased': 'Netiv Hased', 'polizer': 'Polizer',
    'salach_dabach': 'Salach Dabach', 'shefa_barcart_ashem': 'Shefa Barcart Ashem',
    'shuk_ahir': 'Shuk Ahir', 'stop_market': 'Stop Market', 'super_sapir': 'Super Sapir',
    'super_yuda': 'Super Yuda', 'super_dosh': 'Super Dosh', 'wolt': 'Wolt',
    'zol_vebegadol': 'Zol Vebegadol', 'yayno_bitan_and_carrefour': 'Carrefour',
    'yellow': None,
}

def process_price_file(cur, filepath, chain_name):
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    row = cur.fetchone()
    if not row: return 0
    chain_id = row[0]
    cur.execute("SELECT id, store_code FROM store WHERE chain_id=%s", (chain_id,))
    store_map = {code: sid for sid, code in cur.fetchall()}
    if not store_map: return 0
    updated = 0; last_store = None
    with open(filepath, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row.get('storeid','').strip()
            if sid: last_store = sid
            else: sid = last_store
            barcode = row.get('itemcode','').strip()
            price_str = row.get('itemprice','').strip()
            name = row.get('itemname','').strip()
            if not sid or not barcode or not price_str or not name: continue
            store_id = store_map.get(sid)
            if not store_id and sid.isdigit(): store_id = store_map.get(str(int(sid)))
            if not store_id: continue
            try: price = float(price_str)
            except: continue
            if price <= 0: continue
            cur.execute("SELECT id FROM product WHERE barcode=%s", (barcode,))
            prod = cur.fetchone()
            if not prod:
                cur.execute("INSERT INTO product (barcode, name) VALUES (%s,%s) RETURNING id", (barcode, name))
                prod = cur.fetchone()
            cur.execute("""INSERT INTO store_price (product_id, store_id, price) VALUES (%s,%s,%s)
                ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()""",
                (prod[0], store_id, price))
            updated += 1
    return updated

def process_stores_file(cur, filepath, chain_name):
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    row = cur.fetchone()
    if not row: return 0
    chain_id = row[0]
    cur.execute("SELECT store_code FROM store WHERE chain_id=%s", (chain_id,))
    existing = {r[0] for r in cur.fetchall()}
    added = 0
    with open(filepath, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            sid = row.get('storeid','').strip()
            name = row.get('storename','').strip()
            if not sid or not name or sid in existing: continue
            cur.execute("INSERT INTO store (chain_id, store_code, name, city, address) VALUES (%s,%s,%s,%s,%s)",
                (chain_id, sid, name, row.get('city','').strip(), row.get('address','').strip()))
            existing.add(sid); added += 1
    return added

def main():
    print("Downloading dataset...")
    os.system(f"kaggle datasets download -d {KAGGLE_DATASET} -p kaggle_data --unzip")
    print("Connecting to DB...")
    conn = psycopg2.connect(DB_URL, connect_timeout=30)
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE store_price ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()")
        conn.commit()
    except: conn.rollback()
    data_dir = EXTRACT_DIR
    if not data_dir.exists():
        print(f"ERROR: {data_dir} not found"); sys.exit(1)
    print("\n=== Stores ===")
    for f in sorted(data_dir.glob("store_file_*.csv")):
        chain_key = f.stem.replace('store_file_','')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name: continue
        added = process_stores_file(cur, f, chain_name)
        if added > 0: print(f"  {chain_name}: +{added} stores"); conn.commit()
    print("\n=== Prices ===")
    total = 0
    for f in sorted(data_dir.glob("price_file_*.csv")):
        chain_key = f.stem.replace('price_file_','')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name: continue
        print(f"  {chain_name}...", end=' ', flush=True)
        u = process_price_file(cur, f, chain_name); conn.commit()
        print(f"{u} updated"); total += u
    if total == 0:
        print("  No price_file found, using price_full_file...")
        for f in sorted(data_dir.glob("price_full_file_*.csv")):
            chain_key = f.stem.replace('price_full_file_','')
            chain_name = CHAIN_MAP.get(chain_key)
            if not chain_name: continue
            print(f"  {chain_name} (full)...", end=' ', flush=True)
            u = process_price_file(cur, f, chain_name); conn.commit()
            print(f"{u} updated"); total += u
    print("\n=== Updating stats ===")
    cur.execute("""UPDATE product p SET min_price=sub.min_price, store_count=sub.store_count
        FROM (SELECT product_id, MIN(price) as min_price, COUNT(DISTINCT store_id) as store_count
        FROM store_price GROUP BY product_id) sub
        WHERE p.id=sub.product_id AND (p.min_price IS DISTINCT FROM sub.min_price OR p.store_count IS DISTINCT FROM sub.store_count)""")
    print(f"  {cur.rowcount} products updated"); conn.commit()
    print(f"\n=== DONE: {total} total ===")
    conn.close()

if __name__ == '__main__': main()
