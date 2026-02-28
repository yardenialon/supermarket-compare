#!/usr/bin/env python3
"""Daily price update from Kaggle - v5 fixed column names."""
import os, sys, csv, psycopg2, time, glob
def process_promos_batch(cur, conn, filepath, chain_name):
    """Insert promotions from promo CSV into promotion + promotion_item tables."""
    import ast
    csv.field_size_limit(100 * 1024 * 1024)
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    r = cur.fetchone()
    if not r: return 0
    chain_id = r[0]
    cur.execute("SELECT id, store_code FROM store WHERE chain_id=%s", (chain_id,))
    store_map = {code: sid for sid, code in cur.fetchall()}
    if not store_map: return 0
    cur.execute("SELECT id, barcode FROM product WHERE barcode IS NOT NULL AND barcode != ''")
    barcode_map = {b: pid for pid, b in cur.fetchall()}
    count = 0
    last_store = None
    try:
        with open(filepath, encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    promo_id = row.get('promotionid', '').strip()
                    if not promo_id: continue
                    sid = row.get('storeid', '').strip()
                    if sid: last_store = sid
                    else: sid = last_store
                    if not sid: continue
                    store_id = store_map.get(sid)
                    if not store_id and sid.isdigit():
                        store_id = store_map.get(str(int(sid)).zfill(3)) or store_map.get(str(int(sid)))
                    if not store_id: continue
                    desc = (row.get('promotiondescription','') or row.get('promotionname','')).strip()
                    if not desc: continue
                    end_date = row.get('promotionenddate','').strip() or None
                    start_date = row.get('promotionstartdate','').strip() or None
                    disc_price = row.get('discountedprice','').strip() or None
                    min_qty = row.get('minqty','').strip() or row.get('minimumpurchasequantity','').strip() or None
                    cur.execute("""
                        INSERT INTO promotion (store_id,chain_promotion_id,description,start_date,end_date,
                            discounted_price,min_qty,is_club_only,created_at,updated_at)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
                        ON CONFLICT (store_id,chain_promotion_id) DO UPDATE SET
                            description=EXCLUDED.description,
                            discounted_price=EXCLUDED.discounted_price,
                            end_date=EXCLUDED.end_date,
                            updated_at=NOW()
                        RETURNING id
                    """, (store_id, promo_id, desc, start_date, end_date, disc_price, min_qty, False))
                    promo_db_id = cur.fetchone()[0]
                    items_raw = row.get('promotionitems','').strip()
                    if items_raw:
                        try:
                            items_data = ast.literal_eval(items_raw)
                            items_list = items_data.get('item',[]) if isinstance(items_data,dict) else []
                            if isinstance(items_list,dict): items_list = [items_list]
                            for item in items_list:
                                bc = str(item.get('itemcode','')).strip()
                                pid = barcode_map.get(bc)
                                if pid:
                                    cur.execute("INSERT INTO promotion_item (promotion_id,product_id) VALUES (%s,%s) ON CONFLICT DO NOTHING", (promo_db_id, pid))
                        except: pass
                    count += 1
                    if count % 10000 == 0:
                        conn.commit()
                        print(f"    {count}...", flush=True)
                except Exception: continue
    except Exception as e:
        print(f"    Error: {e}", flush=True)
    conn.commit()
    return count
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
    promo_files = sorted(data_path.glob("promo_full_file_*.csv"))
    if not promo_files:
        promo_files = sorted(data_path.glob("promo_file_*.csv"))
    print(f"  Found {len(promo_files)} promo files", flush=True)
    for f in promo_files:
        chain_key = f.stem.replace('promo_full_file_', '').replace('promo_file_', '')
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
