#!/usr/bin/env python3
"""Load promotions from Kaggle promo CSV files into promotion + promotion_item tables."""
import os, sys, csv, psycopg2, time, ast, json
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
    'yayno_bitan_and_carrefour': 'Carrefour',
}

def parse_items(promotionitems_str):
    """Extract list of itemcodes from the promotionitems field (Python dict-like string)."""
    if not promotionitems_str or promotionitems_str.strip() in ('', '{}'):
        return []
    try:
        # Replace Python-style booleans/None just in case
        s = promotionitems_str.strip()
        # Use ast.literal_eval - the data is Python dict format
        data = ast.literal_eval(s)
        items = data.get('item', [])
        # Sometimes it's a single dict, not a list
        if isinstance(items, dict):
            items = [items]
        return [str(item.get('itemcode', '')).strip() for item in items if item.get('itemcode')]
    except Exception:
        return []

def parse_date(val):
    """Parse date string to something psycopg2 can handle."""
    if not val or not val.strip():
        return None
    val = val.strip()
    # Try various formats
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d', '%d/%m/%Y'):
        try:
            from datetime import datetime
            return datetime.strptime(val, fmt)
        except ValueError:
            continue
    return None

def parse_float(val):
    if not val or not val.strip():
        return None
    try:
        return float(val.strip())
    except:
        return None

def is_club_only(clubs_str):
    """Check if promotion is club-only."""
    if not clubs_str:
        return False
    try:
        data = ast.literal_eval(clubs_str.strip())
        club_id = data.get('clubid', '0')
        return str(club_id) != '0'
    except:
        return False

def process_promo_file(cur, conn, filepath, chain_name):
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (chain_name,))
    row = cur.fetchone()
    if not row:
        print(f"    Chain '{chain_name}' not in DB", flush=True); return 0, 0
    chain_id = row[0]

    cur.execute("SELECT id, store_code FROM store WHERE chain_id=%s", (chain_id,))
    store_map = {code: sid for sid, code in cur.fetchall()}
    if not store_map:
        print(f"    No stores for '{chain_name}'", flush=True); return 0, 0

    csv.field_size_limit(50 * 1024 * 1024)  # 50MB per field

    promotions_added = 0
    items_added = 0
    last_store = None
    last_promo_db_id = None

    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Store carry-forward (empty rows continue last store)
            sid = row.get('storeid', '').strip()
            if sid:
                last_store = sid
            else:
                sid = last_store
            if not sid:
                continue

            store_id = store_map.get(sid)
            if not store_id and sid.isdigit():
                store_id = store_map.get(str(int(sid)))
            if not store_id:
                continue

            promo_id = row.get('promotionid', '').strip()
            description = row.get('promotiondescription', '').strip()
            items_str = row.get('promotionitems', '').strip()

            # Skip rows with no promotion data at all
            if not promo_id and not items_str:
                continue

            # If this row has a new promotion ID, insert it
            if promo_id:
                start_date = parse_date(row.get('promotionstartdate', ''))
                end_date = parse_date(row.get('promotionenddate', ''))
                min_qty = parse_float(row.get('minqty', ''))
                max_qty = parse_float(row.get('maxqty', ''))
                discounted_price = parse_float(row.get('discountedprice', ''))
                discount_rate = parse_float(row.get('discountrate', ''))
                discount_type = row.get('discounttype', '').strip() or None
                min_purchase = parse_float(row.get('minpurchaseamnt', ''))
                reward_type = row.get('rewardtype', '').strip() or None
                club_only = is_club_only(row.get('clubs', ''))

                try:
                    cur.execute("""
                        INSERT INTO promotion (
                            store_id, chain_promotion_id, description,
                            start_date, end_date, min_qty, max_qty,
                            discounted_price, discount_rate, discount_type,
                            min_purchase_amount, is_club_only, reward_type,
                            updated_at
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                        ON CONFLICT (store_id, chain_promotion_id)
                        DO UPDATE SET
                            description = EXCLUDED.description,
                            start_date = EXCLUDED.start_date,
                            end_date = EXCLUDED.end_date,
                            discounted_price = EXCLUDED.discounted_price,
                            discount_rate = EXCLUDED.discount_rate,
                            is_club_only = EXCLUDED.is_club_only,
                            updated_at = NOW()
                        RETURNING id
                    """, (store_id, promo_id, description, start_date, end_date,
                          min_qty, max_qty, discounted_price, discount_rate,
                          discount_type, min_purchase, club_only, reward_type))
                    result = cur.fetchone()
                    if result:
                        last_promo_db_id = result[0]
                        promotions_added += 1
                except Exception as e:
                    conn.rollback()
                    continue

            # Parse and insert promotion items
            if items_str and last_promo_db_id:
                barcodes = parse_items(items_str)
                for barcode in barcodes:
                    if not barcode or len(barcode) < 5:
                        continue
                    try:
                        cur.execute("""
                            INSERT INTO promotion_item (promotion_id, product_id)
                            SELECT %s, p.id FROM product p WHERE p.barcode = %s
                            ON CONFLICT DO NOTHING
                        """, (last_promo_db_id, barcode))
                        items_added += cur.rowcount
                    except Exception:
                        conn.rollback()
                        continue

            # Commit every 1000 promotions
            if promotions_added % 1000 == 0 and promotions_added > 0:
                conn.commit()

    conn.commit()
    return promotions_added, items_added


def main():
    data_path = Path("kaggle_data")
    if not data_path.exists():
        print("ERROR: kaggle_data/ not found. Run from repo root."); sys.exit(1)

    promo_files = sorted(data_path.glob("promo_full_file_*.csv"))
    if not promo_files:
        promo_files = sorted(data_path.glob("promo_file_*.csv"))
    # Exclude _temp files
    promo_files = [f for f in promo_files if '_temp' not in f.stem]
    print(f"Found {len(promo_files)} promo files", flush=True)

    print("Connecting to DB...", flush=True)
    conn = psycopg2.connect(DB_URL, connect_timeout=30)
    cur = conn.cursor()

    total_promos = 0
    total_items = 0

    for f in promo_files:
        chain_key = f.stem.replace('promo_full_file_', '').replace('promo_file_', '')
        chain_name = CHAIN_MAP.get(chain_key)
        if not chain_name:
            print(f"  SKIP {f.stem}", flush=True)
            continue
        fsize = f.stat().st_size / (1024 * 1024)
        if fsize < 0.001:
            continue
        print(f"  {chain_name} ({fsize:.1f}MB)...", flush=True)
        t0 = time.time()
        promos, items = process_promo_file(cur, conn, f, chain_name)
        elapsed = time.time() - t0
        print(f"    -> {promos} promotions, {items} items in {elapsed:.1f}s", flush=True)
        total_promos += promos
        total_items += items

    print(f"\n=== DONE: {total_promos} promotions, {total_items} promotion_items ===", flush=True)

    cur.execute("SELECT COUNT(*) FROM promotion")
    print(f"Total promotions in DB: {cur.fetchone()[0]}", flush=True)
    cur.execute("SELECT COUNT(*) FROM promotion_item")
    print(f"Total promotion_items in DB: {cur.fetchone()[0]}", flush=True)

    # Sample
    print("\nSample active promotions:", flush=True)
    cur.execute("""
        SELECT p.description, p.discounted_price, p.discount_rate, 
               p.start_date, p.end_date, p.is_club_only,
               COUNT(pi.id) as item_count
        FROM promotion p
        LEFT JOIN promotion_item pi ON pi.promotion_id = p.id
        WHERE p.end_date > NOW() OR p.end_date IS NULL
        GROUP BY p.id
        ORDER BY item_count DESC
        LIMIT 5
    """)
    for r in cur.fetchall():
        print(f"  {r[0][:50]} | price:{r[1]} rate:{r[2]} | items:{r[6]} | club:{r[5]}", flush=True)

    conn.close()

if __name__ == '__main__':
    main()
