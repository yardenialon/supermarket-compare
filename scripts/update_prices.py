#!/usr/bin/env python3
"""Daily price update from Kaggle - v5 fixed column names."""
import os, sys, csv, psycopg2, time, glob
from pathlib import Path

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

KAGGLE_DATASET = "erlichsefi/israeli-supermarkets-2024"

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

def get_row_fields(row):
    """Extract barcode, name, price, storeid handling different column names."""
    barcode = row.get('itemcode', '').strip()
    name = row.get('itemname', '') or row.get('itemnm', '') or row.get('manufactureritemdescription', '') or ''
    name = name.strip()
    price_str = row.get('itemprice', '').strip()
    storeid = row.get('storeid', '').strip()
    return storeid, barcode, name, price_str

def process_prices_batch(cur, conn, filepath, chain_name):
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    row = cur.fetchone()
    if not row:
        print(f"    Chain '{chain_name}' not in DB", flush=True); return 0
    chain_id = row[0]
    cur.execute("SELECT id, store_code FROM store WHERE chain_id=%s", (chain_id,))
    store_map = {code: sid for sid, code in cur.fetchall()}
    if not store_map:
        print(f"    No stores for '{chain_name}'", flush=True); return 0

    rows = []
    last_store = None
    skipped_store = 0
    skipped_barcode = 0

    csv.field_size_limit(10 * 1024 * 1024)  # 10MB
    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid, barcode, name, price_str = get_row_fields(row)
            if sid: last_store = sid
            else: sid = last_store
            if not sid or not barcode or not price_str or not name: continue
            # Skip non-barcode itemcodes (internal numbers < 100)
            if len(barcode) < 5:
                skipped_barcode += 1
                continue
            store_id = store_map.get(sid)
            if not store_id and sid.isdigit():
                store_id = store_map.get(str(int(sid)))
            if not store_id:
                skipped_store += 1
                continue
            try: price = float(price_str)
            except: continue
            if price <= 0: continue
            rows.append((barcode, name, store_id, price))

    if skipped_store > 0:
        print(f"    Skipped {skipped_store} (unknown store), {skipped_barcode} (short barcode)", flush=True)
    if not rows: return 0
    # Global dedup: keep last price per (barcode, store_id)
    seen = {}
    for r in rows:
        seen[(r[0], r[2])] = r
    rows = list(seen.values())

    cur.execute("DELETE FROM tmp_prices")
    BATCH = 10000
    total = len(rows)
    for i in range(0, total, BATCH):
        batch = rows[i:i+BATCH]
        args = ','.join(cur.mogrify("(%s,%s,%s,%s)", r).decode() for r in batch)
        cur.execute(f"INSERT INTO tmp_prices (barcode, name, store_id, price) VALUES {args}")
        cur.execute("""INSERT INTO product (barcode, name)
            SELECT DISTINCT t.barcode, t.name FROM tmp_prices t
            WHERE NOT EXISTS (SELECT 1 FROM product p WHERE p.barcode = t.barcode)
            ON CONFLICT (barcode) DO NOTHING""")
        cur.execute("""INSERT INTO store_price (product_id, store_id, price)
            SELECT p.id, t.store_id, t.price FROM tmp_prices t JOIN product p ON p.barcode = t.barcode
            ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()""")
        cur.execute("DELETE FROM tmp_prices")
        conn.commit()
        processed = min(i + BATCH, total)
        if processed % 50000 == 0 or processed == total:
            print(f"    {processed}/{total}", flush=True)
    return total

def process_stores_file(cur, filepath, chain_name):
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    row = cur.fetchone()
    if not row: return 0
    chain_id = row[0]
    cur.execute("SELECT store_code FROM store WHERE chain_id=%s", (chain_id,))
    existing = {r[0] for r in cur.fetchall()}
    added = 0
    csv.field_size_limit(10 * 1024 * 1024)  # 10MB
    with open(filepath, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sid = row.get('storeid', '').strip()
            name = row.get('storename', '').strip()
            if not sid or not name or sid in existing: continue
            cur.execute("INSERT INTO store (chain_id, store_code, name, city, address) VALUES (%s,%s,%s,%s,%s)",
                (chain_id, sid, name, row.get('city', '').strip(), row.get('address', '').strip()))
            existing.add(sid); added += 1
    return added

def process_promos_batch(cur, conn, filepath, chain_name):
    """Process promo files and update is_promo/promo_price in store_price."""
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    row = cur.fetchone()
    if not row: return 0
    chain_id = row[0]
    cur.execute("SELECT id, store_code FROM store WHERE chain_id=%s", (chain_id,))
    store_map = {code: sid for sid, code in cur.fetchall()}
    if not store_map: return 0

    rows = []
    last_store = None
    csv.field_size_limit(10 * 1024 * 1024)  # 10MB
    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row.get('storeid', '').strip()
            if sid: last_store = sid
            else: sid = last_store
            barcode = row.get('itemcode', '').strip()
            if not sid or not barcode or len(barcode) < 5: continue
            store_id = store_map.get(sid) or (store_map.get(str(int(sid))) if sid.isdigit() else None)
            if not store_id: continue
            promo_price_str = row.get('promoprice', row.get('itemprice', '')).strip()
            try: promo_price = float(promo_price_str)
            except: continue
            if promo_price <= 0: continue
            rows.append((barcode, store_id, promo_price))

    if not rows: return 0
    # Dedup
    seen = {}
    for r in rows: seen[(r[0], r[1])] = r
    rows = list(seen.values())

    print(f"    {len(rows)} promo items...", end=' ', flush=True)
    BATCH = 5000
    updated = 0
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i+BATCH]
        values = ','.join(cur.mogrify("(%s,%s,%s)", r).decode() for r in batch)
        cur.execute(f"""
            UPDATE store_price sp SET is_promo = true, promo_price = t.promo_price
            FROM (VALUES {values}) AS t(barcode, store_id, promo_price)
            JOIN product p ON p.barcode = t.barcode
            WHERE sp.product_id = p.id AND sp.store_id = t.store_id::int
        """)
        updated += cur.rowcount
        conn.commit()
    return updated

def main():
    start = time.time()
    print("Downloading dataset...", flush=True)
    ret = os.system(f"kaggle datasets download -d {KAGGLE_DATASET} -p kaggle_data --unzip")
    if ret != 0:
        print("ERROR: Kaggle download failed"); sys.exit(1)

    # Find CSVs
    all_csvs = glob.glob("kaggle_data/**/*.csv", recursive=True)
    print(f"Found {len(all_csvs)} CSV files", flush=True)
    price_full = sorted([f for f in all_csvs if 'price_full_file' in f])
    store_files = sorted([f for f in all_csvs if 'store_file' in f])
    print(f"  price_full: {len(price_full)}, store: {len(store_files)}", flush=True)

    if not price_full:
        print("ERROR: No price_full files found")
        for f in all_csvs[:10]: print(f"  {f}")
        sys.exit(1)

    data_dir = str(Path(price_full[0]).parent)
    data_path = Path(data_dir)
    print(f"Data dir: {data_dir}", flush=True)

    print("\nConnecting to DB...", flush=True)
    conn = psycopg2.connect(DB_URL, connect_timeout=30)
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE store_price ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()")
        conn.commit()
    except: conn.rollback()
    cur.execute("DROP TABLE IF EXISTS tmp_prices")
    conn.commit()
    cur.execute("CREATE TABLE tmp_prices (barcode TEXT, name TEXT, store_id INTEGER, price NUMERIC)")
    conn.commit()

    # Stores
    print("\n=== Stores ===", flush=True)
    for f in sorted(data_path.glob("store_file_*.csv")):
        chain_key = f.stem.replace('store_file_', '')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name: continue
        added = process_stores_file(cur, f, chain_name)
        if added > 0: print(f"  {chain_name}: +{added}", flush=True); conn.commit()

    # Prices
    print("\n=== Prices ===", flush=True)
    total = 0
    for f in sorted(data_path.glob("price_full_file_*.csv")):
        chain_key = f.stem.replace('price_full_file_', '')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name: continue
        fsize = f.stat().st_size / (1024*1024)
        if fsize < 0.001: continue
        print(f"  {chain_name} ({fsize:.1f}MB)...", flush=True)
        t0 = time.time()
        u = process_prices_batch(cur, conn, f, chain_name)
        elapsed = time.time() - t0
        print(f"    -> {u} prices in {elapsed:.1f}s", flush=True)
        total += u
        if time.time() - start > 5400:
            print("  WARNING: Time limit", flush=True); break

    # Promos
    print("\n=== Promos ===", flush=True)
    promo_total = 0
    for f in sorted(data_path.glob("promo_file_*.csv")):
        chain_key = f.stem.replace('promo_file_', '')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name: continue
        fsize = f.stat().st_size / (1024*1024)
        if fsize < 0.001: continue
        print(f"  {chain_name} ({fsize:.1f}MB)...", flush=True)
        t0 = time.time()
        u = process_promos_batch(cur, conn, f, chain_name)
        print(f"    -> {u} promos in {time.time()-t0:.1f}s", flush=True)
        promo_total += u

    # Stats
    print("\n=== Stats ===", flush=True)
    cur.execute("""UPDATE product p SET min_price=sub.min_price, store_count=sub.store_count
        FROM (SELECT product_id, MIN(price) as min_price, COUNT(DISTINCT store_id) as store_count
              FROM store_price GROUP BY product_id) sub
        WHERE p.id=sub.product_id
        AND (p.min_price IS DISTINCT FROM sub.min_price OR p.store_count IS DISTINCT FROM sub.store_count)""")
    print(f"  {cur.rowcount} products updated", flush=True); conn.commit()
    print(f"\n=== DONE: {total} prices in {time.time()-start:.0f}s ===", flush=True)
    conn.close()

if __name__ == '__main__': main()
