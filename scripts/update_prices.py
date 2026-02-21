#!/usr/bin/env python3
"""Daily price update from Kaggle - optimized with batch processing."""
import os, sys, csv, psycopg2, time
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


def process_prices_batch(cur, conn, filepath, chain_name):
    """Process prices using temp table + batch upsert."""
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    row = cur.fetchone()
    if not row: return 0
    chain_id = row[0]

    cur.execute("SELECT id, store_code FROM store WHERE chain_id=%s", (chain_id,))
    store_map = {code: sid for sid, code in cur.fetchall()}
    if not store_map: return 0

    # Create temp table
    cur.execute("""
        CREATE TEMP TABLE IF NOT EXISTS tmp_prices (
            barcode TEXT, name TEXT, store_id INTEGER, price NUMERIC
        ) ON COMMIT DELETE ROWS
    """)
    conn.commit()

    # Read CSV and collect rows
    rows = []
    last_store = None
    with open(filepath, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row.get('storeid', '').strip()
            if sid: last_store = sid
            else: sid = last_store
            barcode = row.get('itemcode', '').strip()
            price_str = row.get('itemprice', '').strip()
            name = row.get('itemname', '').strip()
            if not sid or not barcode or not price_str or not name: continue
            store_id = store_map.get(sid)
            if not store_id and sid.isdigit():
                store_id = store_map.get(str(int(sid)))
            if not store_id: continue
            try:
                price = float(price_str)
            except: continue
            if price <= 0: continue
            rows.append((barcode, name, store_id, price))

    if not rows:
        return 0

    # Batch insert into temp table using executemany
    BATCH = 10000
    total = len(rows)
    processed = 0

    for i in range(0, total, BATCH):
        batch = rows[i:i+BATCH]

        # Insert batch into temp table
        args = ','.join(cur.mogrify("(%s,%s,%s,%s)", r).decode() for r in batch)
        cur.execute(f"INSERT INTO tmp_prices (barcode, name, store_id, price) VALUES {args}")

        # Upsert new products
        cur.execute("""
            INSERT INTO product (barcode, name)
            SELECT DISTINCT t.barcode, t.name FROM tmp_prices t
            WHERE NOT EXISTS (SELECT 1 FROM product p WHERE p.barcode = t.barcode)
        """)

        # Upsert prices
        cur.execute("""
            INSERT INTO store_price (product_id, store_id, price)
            SELECT p.id, t.store_id, t.price
            FROM tmp_prices t
            JOIN product p ON p.barcode = t.barcode
            ON CONFLICT (product_id, store_id)
            DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()
        """)

        # Clear temp
        cur.execute("DELETE FROM tmp_prices")
        conn.commit()

        processed += len(batch)
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
    with open(filepath, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            sid = row.get('storeid', '').strip()
            name = row.get('storename', '').strip()
            if not sid or not name or sid in existing: continue
            cur.execute("INSERT INTO store (chain_id, store_code, name, city, address) VALUES (%s,%s,%s,%s,%s)",
                (chain_id, sid, name, row.get('city', '').strip(), row.get('address', '').strip()))
            existing.add(sid); added += 1
    return added


def main():
    start = time.time()
    print("Downloading dataset...")
    os.system(f"kaggle datasets download -d {KAGGLE_DATASET} -p kaggle_data --unzip")

    print("Connecting to DB...")
    conn = psycopg2.connect(DB_URL, connect_timeout=30)
    cur = conn.cursor()

    # Ensure columns exist
    try:
        cur.execute("ALTER TABLE store_price ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()")
        conn.commit()
    except: conn.rollback()

    data_dir = EXTRACT_DIR
    if not data_dir.exists():
        print(f"ERROR: {data_dir} not found"); sys.exit(1)

    # Process stores
    print("\n=== Stores ===")
    for f in sorted(data_dir.glob("store_file_*.csv")):
        chain_key = f.stem.replace('store_file_', '')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name: continue
        added = process_stores_file(cur, f, chain_name)
        if added > 0: print(f"  {chain_name}: +{added} stores"); conn.commit()

    # Process prices - prefer price_file (incremental)
    print("\n=== Prices ===")
    total = 0
    price_files = sorted(data_dir.glob("price_file_*.csv"))

    # Check if price_files have actual data
    use_full = True
    for f in price_files:
        size = f.stat().st_size
        if size > 1000:  # More than just headers
            use_full = False
            break

    if use_full:
        print("  Using price_full_file (no incremental updates found)")
        price_files = sorted(data_dir.glob("price_full_file_*.csv"))
        prefix = 'price_full_file_'
    else:
        prefix = 'price_file_'

    for f in price_files:
        chain_key = f.stem.replace(prefix, '')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name: continue

        fsize = f.stat().st_size / (1024*1024)
        print(f"  {chain_name} ({fsize:.1f}MB)...", flush=True)
        t0 = time.time()
        u = process_prices_batch(cur, conn, f, chain_name)
        elapsed = time.time() - t0
        print(f"    -> {u} prices in {elapsed:.1f}s")
        total += u

        # Check if we're running too long (45 min safety)
        if time.time() - start > 2700:
            print("  WARNING: Approaching time limit, stopping")
            break

    # Update product stats
    print("\n=== Updating stats ===")
    cur.execute("""
        UPDATE product p SET min_price=sub.min_price, store_count=sub.store_count
        FROM (SELECT product_id, MIN(price) as min_price, COUNT(DISTINCT store_id) as store_count
              FROM store_price GROUP BY product_id) sub
        WHERE p.id=sub.product_id
        AND (p.min_price IS DISTINCT FROM sub.min_price OR p.store_count IS DISTINCT FROM sub.store_count)
    """)
    print(f"  {cur.rowcount} products updated")
    conn.commit()

    elapsed = time.time() - start
    print(f"\n=== DONE: {total} prices in {elapsed:.0f}s ===")
    conn.close()


if __name__ == '__main__':
    main()
