#!/usr/bin/env python3
"""
update_images.py — Fetch product images from SerpAPI for products missing images.
Prioritizes products that appear in store_price (i.e. actually shown to users).
"""
import os, time, json, logging, sys
import urllib.request, urllib.parse
import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

SERP_KEY = os.environ.get("SERPAPI_KEY", "2e3660ec2b969459b9841800dc63c8e9aa6cf88aad1e3d707c3e799acfa2a778")
BATCH_SIZE = int(os.environ.get("IMAGE_BATCH_SIZE", "500"))
DELAY = 0.5  # seconds between requests

TRUSTED_DOMAINS = [
    'shufersal.co.il', 'rfranco.com', 'tnuva.co.il', 'mybundles.co.il',
    'mega.co.il', 'victoria.co.il', 'osheread.co.il', 'ramielevy.co.il',
    'pricez.co.il', 'ha-pricelist.co.il', 'super-pharm.co.il',
    'schnellers.co.il', 'yochananof.co.il', 'barcode-list.co.il',
    'openfoodfacts.org', 'barcodelookup.com',
]

def is_trusted(url: str, barcode: str) -> bool:
    if not url: return False
    lower = url.lower()
    if barcode and barcode in lower: return True
    return any(d in lower for d in TRUSTED_DOMAINS)

def fetch_image(barcode: str, name: str) -> str | None:
    try:
        q = urllib.parse.quote(f"{barcode} {name} מוצר")
        url = f"https://serpapi.com/search.json?engine=google_images&q={q}&api_key={SERP_KEY}&num=10&hl=he&gl=il"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
        results = data.get("images_results", [])
        if not results: return None
        # 1. תמונה עם ברקוד ב-URL
        for r in results:
            if is_trusted(r.get("original"), barcode): return r["original"]
        # 2. תמונה מדומיין מהימן
        for r in results:
            if is_trusted(r.get("link"), barcode): return r.get("original") or r.get("thumbnail")
        # 3. כל תמונה עם ברקוד
        for r in results:
            if barcode and barcode in (r.get("link","") + r.get("original","")):
                return r.get("original") or r.get("thumbnail")
        return None
    except Exception as e:
        log.warning(f"  SerpAPI error for {barcode}: {e}")
        return None

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url: raise ValueError("DATABASE_URL not set")

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    # מוצרים בלי תמונה שמופיעים בחנויות — ממוינים לפי מספר חנויות
    cur.execute("""
        SELECT p.id, p.barcode, p.name
        FROM product p
        WHERE (p.image_url IS NULL OR p.image_url = '')
          AND p.barcode IS NOT NULL
          AND EXISTS (SELECT 1 FROM store_price sp WHERE sp.product_id = p.id)
        ORDER BY p.store_count DESC NULLS LAST
        LIMIT %s
    """, (BATCH_SIZE,))

    products = cur.fetchall()
    log.info(f"Found {len(products)} products missing images (of products in stores)")

    updated = 0
    for i, (pid, barcode, name) in enumerate(products):
        img = fetch_image(barcode or "", name or "")
        if img:
            cur.execute("UPDATE product SET image_url=%s WHERE id=%s", (img, pid))
            if (i + 1) % 50 == 0:
                conn.commit()
                log.info(f"  {i+1}/{len(products)} — {updated} images found so far")
            updated += 1
        time.sleep(DELAY)

    conn.commit()
    log.info(f"\n🎉 Done — {updated}/{len(products)} images updated")
    conn.close()

if __name__ == "__main__":
    main()
