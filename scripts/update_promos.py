#!/usr/bin/env python3
"""
update_promos.py — Daily promotions update from Kaggle dataset.
Supports 3 CSV formats found in Israeli supermarket data.
"""
import os, csv, json, ast, logging, subprocess, sys
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)
csv.field_size_limit(100 * 1024 * 1024)

CHAIN_MAP = {
    "shufersal":"Shufersal","rami_levy":"Rami Levy","rami-levy":"Rami Levy",
    "victory":"Victory","bareket":"Bareket","mahsani_ashuk":"Mahsani Ashuk",
    "city_market":"City Market","het_cohen":"Het Cohen","good_pharm":"Good Pharm",
    "fresh_market":"Freshmarket","freshmarket":"Freshmarket","king_store":"King Store",
    "maayan_2000":"Maayan 2000","netiv_hased":"Netiv Hased","osher_ad":"Osher Ad",
    "hazi_hinam":"Hazi Hinam","tiv_taam":"Tiv Taam","yochananof":"Yochananof",
    "yohananof":"Yochananof","dor_alon":"Dor Alon","keshet":"Keshet Taamim",
    "stop_market":"Stop Market","polizer":"Polizer","salach_dabach":"Salach Dabach",
    "super_sapir":"Super Sapir","meshmat_yosef":"Meshmat Yosef","shefa_barcart_ashem":"Shefa Barcart Ashem","shuk_ahir":"Shuk Ahir","super_yuda":"Super Yuda","yellow":"Yellow","zol_vebegadol":"Zol Vebegadol","wolt":"Wolt","carrefour":"Carrefour","yayno_bitan":"Yayno Bitan",
}
KAGGLE_DATA_DIR = Path("kaggle_data")
KAGGLE_DATASET  = "motib7/israeli-supermarket-prices"

def ensure_dataset():
    if list(KAGGLE_DATA_DIR.glob("promo_full_file_*.csv")):
        log.info("Promo files already present — skipping download"); return
    log.info("Downloading from Kaggle...")
    KAGGLE_DATA_DIR.mkdir(exist_ok=True)
    r = subprocess.run(["kaggle","datasets","download","-d",KAGGLE_DATASET,"-p",str(KAGGLE_DATA_DIR),"--unzip"], capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError(f"Kaggle download failed:\n{r.stderr}")

def get_chain_name(filename):
    stem = Path(filename).stem.lower()
    for k, v in CHAIN_MAP.items():
        if k in stem: return v
    return None

def detect_format(headers):
    """Returns 'items_json', 'itemcode', or 'groups'"""
    if "promotionitems" in headers: return "items_json"
    if "itemcode" in headers: return "itemcode"
    if "groups" in headers: return "groups"
    return None

def parse_promotionitems(raw):
    """Format A — promotionitems column with JSON/dict"""
    if not raw or not raw.strip(): return []
    try: data = json.loads(raw)
    except:
        try: data = ast.literal_eval(raw)
        except: return []
    items = data.get("item", data.get("promotionitem", []))
    if isinstance(items, dict): items = [items]
    return [str(i.get("itemcode") or i.get("ItemCode","")).strip() for i in items if i.get("itemcode") or i.get("ItemCode")]

def parse_groups(raw):
    """Format C — groups column with nested dict"""
    if not raw or not raw.strip(): return []
    try: data = ast.literal_eval(raw)
    except:
        try: data = json.loads(raw)
        except: return []
    groups = data.get("group", [])
    if isinstance(groups, dict): groups = [groups]
    barcodes = []
    for g in groups:
        promo_items = g.get("promotionitems", {})
        if isinstance(promo_items, str):
            try: promo_items = ast.literal_eval(promo_items)
            except:
                try: promo_items = json.loads(promo_items)
                except: continue
        if not isinstance(promo_items, dict): continue
        items = promo_items.get("promotionitem", [])
        if isinstance(items, dict): items = [items]
        for item in items:
            bc = str(item.get("itemcode","")).strip()
            if bc and bc != "NO_BODY": barcodes.append(bc)
    return barcodes

def safe_date(v):
    if not v or not v.strip(): return None
    v = v.strip().split("T")[0]  # handle ISO datetime
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y%m%d"):
        try: return datetime.strptime(v, fmt).date()
        except: pass
    return None

def safe_float(v):
    try: return float(v.strip()) if v and v.strip() and v.strip() != "NO_BODY" else None
    except: return None

def safe_int(v):
    try: return int(float(v.strip())) if v and v.strip() and v.strip() != "NO_BODY" else None
    except: return None

def load_store_map(cur, chain_name):
    cur.execute("SELECT s.store_code, s.id FROM store s JOIN retailer_chain rc ON rc.id=s.chain_id WHERE rc.name=%s", (chain_name,))
    return {r[0]: r[1] for r in cur.fetchall()}

def load_barcode_map(cur):
    cur.execute("SELECT barcode, id FROM product WHERE barcode IS NOT NULL")
    return {r[0]: r[1] for r in cur.fetchall()}

def process_file(cur, filepath, chain_name, barcode_map):
    store_map = load_store_map(cur, chain_name)
    if not store_map:
        log.warning(f"  No stores for '{chain_name}' — skipping"); return 0, 0

    promo_rows, promo_id_key, item_pairs = [], {}, []
    cur_store_id = None
    cur_promo_id = None
    skipped_store = skipped_bc = 0

    with open(filepath, newline="", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [h.strip().lower() for h in (reader.fieldnames or [])]
        fmt = detect_format(reader.fieldnames)

        if fmt is None:
            log.warning(f"  Unknown format in {Path(filepath).name} — skipping")
            return 0, 0

        log.info(f"  Format: {fmt}")

        for row in reader:
            # --- store carry-forward ---
            raw_store = row.get("storeid", "").strip()
            if raw_store:
                cur_store_id = store_map.get(raw_store)
                if cur_store_id is None:
                    skipped_store += 1
            if cur_store_id is None: continue

            chain_promo_id = row.get("promotionid", "").strip()
            if not chain_promo_id:
                # carry-forward for itemcode format
                chain_promo_id = cur_promo_id
            else:
                cur_promo_id = chain_promo_id
            if not chain_promo_id: continue

            key = (cur_store_id, chain_promo_id)
            if key not in promo_id_key:
                # pick date fields depending on format
                start = safe_date(row.get("promotionstartdate") or row.get("promotionstartdatetime",""))
                end   = safe_date(row.get("promotionenddate")   or row.get("promotionenddatetime",""))
                promo_id_key[key] = len(promo_rows)
                promo_rows.append((
                    cur_store_id, chain_promo_id,
                    row.get("promotiondescription","").strip(),
                    start, end,
                    safe_float(row.get("discountedprice","")),
                    safe_int(row.get("minqty") or row.get("minnoofitemoffered") or row.get("minnoofitemsoffered","")),
                    False,
                ))

            idx = promo_id_key[key]

            if fmt == "items_json":
                barcodes = parse_promotionitems(row.get("promotionitems",""))
            elif fmt == "itemcode":
                bc = row.get("itemcode","").strip()
                barcodes = [bc] if bc else []
            else:  # groups
                barcodes = parse_groups(row.get("groups",""))

            for bc in barcodes:
                if len(bc) < 7:
                    skipped_bc += 1; continue
                item_pairs.append((idx, bc))

    if skipped_store or skipped_bc:
        log.info(f"  Skipped {skipped_store} (unknown store), {skipped_bc} (short barcode)")

    if not promo_rows: return 0, 0

    execute_values(cur, """
        INSERT INTO promotion (store_id,chain_promotion_id,description,start_date,end_date,discounted_price,min_qty,is_club_only)
        VALUES %s ON CONFLICT (store_id,chain_promotion_id) DO UPDATE SET
          description=EXCLUDED.description, start_date=EXCLUDED.start_date,
          end_date=EXCLUDED.end_date, discounted_price=EXCLUDED.discounted_price,
          min_qty=EXCLUDED.min_qty, is_club_only=EXCLUDED.is_club_only
        RETURNING id,store_id,chain_promotion_id""", promo_rows, page_size=500)
    db_id_map = {(r[1], r[2]): r[0] for r in cur.fetchall()}
    idx_to_db = {idx: db_id_map.get((sid, cpid)) for (sid, cpid), idx in promo_id_key.items()}

    item_rows = list(set(
        (idx_to_db[i], barcode_map[bc])
        for i, bc in item_pairs
        if idx_to_db.get(i) and barcode_map.get(bc)
    ))
    if item_rows:
        execute_values(cur,
            "INSERT INTO promotion_item (promotion_id,product_id) VALUES %s ON CONFLICT DO NOTHING",
            item_rows, page_size=1000)

    return len(promo_rows), len(item_rows)

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url: raise ValueError("DATABASE_URL not set")
    ensure_dataset()
    files = sorted(KAGGLE_DATA_DIR.glob("promo_full_file_*.csv"))
    if not files: log.warning("No promo files found."); return
    log.info(f"Processing {len(files)} file(s)...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        cur = conn.cursor()
        barcode_map = load_barcode_map(cur)
        log.info(f"Loaded {len(barcode_map):,} barcodes")
        tp, ti = 0, 0
        for f in files:
            chain = get_chain_name(str(f))
            if not chain: log.warning(f"Unknown chain: {f.name}"); continue
            log.info(f"→ {f.name} ({chain})")
            try:
                p, i = process_file(cur, str(f), chain, barcode_map)
                conn.commit()
                log.info(f"  ✅ {p:,} promos, {i:,} items")
                tp += p; ti += i
            except Exception as e:
                try: conn.rollback()
                except: pass
                log.error(f"  ❌ {f.name}: {e}", exc_info=True)
                # reconnect if connection lost
                try:
                    conn.close()
                except: pass
                try:
                    conn = psycopg2.connect(db_url)
                    conn.autocommit = False
                    cur = conn.cursor()
                    log.info("  Reconnected to DB")
                except Exception as re:
                    log.error(f"  Failed to reconnect: {re}")
                    break
        log.info(f"\n🎉 Total: {tp:,} promotions, {ti:,} items")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
