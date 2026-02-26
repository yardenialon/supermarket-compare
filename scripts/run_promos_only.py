#!/usr/bin/env python3
"""Run only the promos part - no Kaggle download needed."""
import os, sys, csv, psycopg2, time, glob
from pathlib import Path

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    print("ERROR: DATABASE_URL not set"); sys.exit(1)

CHAIN_MAP = {
    'shufersal': 'Shufersal', 'rami_levy': 'Rami Levy', 'yochananof': 'Yochananof',
    'victory': 'Victory', 'osher_ad': 'Osher Ad', 'mega': 'Mega', 'tiv_taam': 'Tiv Taam',
    'hazi_hinam': 'Hazi Hinam', 'keshet_taamim': 'Keshet Taamim', 'keshet': 'Keshet Taamim',
    'freshmarket': 'Freshmarket', 'fresh_market_and_super_dosh': 'Freshmarket',
    'bareket': 'Bareket', 'city_market': 'City Market', 'city_market_shops': 'City Market',
    'dor_alon': 'Dor Alon', 'good_pharm': 'Good Pharm', 'het_cohen': 'Het Cohen',
    'king_store': 'King Store', 'maayan_2000': 'Maayan 2000', 'mahsani_ashuk': 'Mahsani Ashuk',
    'meshmat_yosef': 'Meshmat Yosef', 'meshmat_yosef_2': 'Meshmat Yosef',
    'netiv_hased': 'Netiv Hased', 'polizer': 'Polizer', 'salach_dabach': 'Salach Dabach',
    'shefa_barcart_ashem': 'Shefa Barcart Ashem', 'shuk_ahir': 'Shuk Ahir',
    'stop_market': 'Stop Market', 'super_sapir': 'Super Sapir', 'super_yuda': 'Super Yuda',
    'super_dosh': 'Super Dosh', 'zol_vebegadol': 'Zol Vebegadol',
    'yayno_bitan_and_carrefour': 'Carrefour', 'mahsani_shuk': 'Mahsani Ashuk',
}

def process_promos_batch(cur, conn, filepath, chain_name):
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
    csv.field_size_limit(10 * 1024 * 1024)
    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        print(f"    headers: {headers[:10]}", flush=True)
        for row in reader:
            sid = row.get('storeid', '').strip()
            if sid: last_store = sid
            else: sid = last_store
            barcode = row.get('itemcode', '').strip()
            if not sid or not barcode or len(barcode) < 5: continue
            store_id = store_map.get(sid)
            if not store_id and sid.isdigit():
                store_id = store_map.get(str(int(sid)))
            if not store_id: continue
            # Try multiple column names for promo price
            promo_price_str = (
                row.get('promoprice', '') or
                row.get('discountedprice', '') or
                row.get('itemprice', '')
            ).strip()
            try: promo_price = float(promo_price_str)
            except: continue
            if promo_price <= 0: continue
            rows.append((barcode, store_id, promo_price))

    if not rows:
        print(f"    No rows found", flush=True); return 0

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
    data_path = Path("kaggle_data")
    if not data_path.exists():
        print("ERROR: kaggle_data/ not found. Run from repo root."); sys.exit(1)

    # Find promo files - prefer full snapshot
    promo_files = sorted(data_path.glob("promo_full_file_*.csv"))
    if not promo_files:
        promo_files = sorted(data_path.glob("promo_file_*.csv"))
    print(f"Found {len(promo_files)} promo files", flush=True)
    if not promo_files:
        print("No promo files found!"); sys.exit(1)

    print("Connecting to DB...", flush=True)
    conn = psycopg2.connect(DB_URL, connect_timeout=30)
    cur = conn.cursor()

    # Reset all promos first
    print("Resetting existing promos...", flush=True)
    cur.execute("UPDATE store_price SET is_promo = false, promo_price = NULL WHERE is_promo = true")
    print(f"  Reset {cur.rowcount} rows", flush=True)
    conn.commit()

    total = 0
    for f in promo_files:
        chain_key = f.stem.replace('promo_full_file_', '').replace('promo_file_', '')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name:
            print(f"  SKIP {f.stem} (no chain mapping for '{chain_key}')", flush=True)
            continue
        fsize = f.stat().st_size / (1024*1024)
        if fsize < 0.001: continue
        print(f"  {chain_name} ({fsize:.1f}MB)...", flush=True)
        t0 = time.time()
        u = process_promos_batch(cur, conn, f, chain_name)
        print(f"    -> {u} updated in {time.time()-t0:.1f}s", flush=True)
        total += u

    print(f"\n=== DONE: {total} promo prices updated ===", flush=True)

    # Summary
    cur.execute("SELECT COUNT(*) FROM store_price WHERE is_promo = true")
    print(f"Total is_promo=true in DB: {cur.fetchone()[0]}", flush=True)
    conn.close()

if __name__ == '__main__': main()
