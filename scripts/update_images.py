#!/usr/bin/env python3
"""
update_images.py — Fetch product images.
Strategy:
1. Open Food Facts API (free, barcode-based, very accurate)
2. SerpAPI — barcode-only query, trusted domains only
Never saves irrelevant images.
"""
import os, time, json, logging, sys
import urllib.request, urllib.parse
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

SERP_KEY = os.environ.get("SERPAPI_KEY", "2e3660ec2b969459b9841800dc63c8e9aa6cf88aad1e3d707c3e799acfa2a778")
BATCH_SIZE = int(os.environ.get("IMAGE_BATCH_SIZE", "500"))
DELAY = 0.3

TRUSTED_DOMAINS = [
    'shufersal.co.il', 'rfranco.com', 'tnuva.co.il', 'mybundles.co.il',
    'mega.co.il', 'victoria.co.il', 'osheread.co.il', 'ramielevy.co.il',
    'pricez.co.il', 'ha-pricelist.co.il', 'super-pharm.co.il',
    'schnellers.co.il', 'yochananof.co.il', 'barcode-list.co.il',
    'openfoodfacts.org', 'barcodelookup.com', 'world.openfoodfacts.org',
]

def is_trusted(url: str, barcode: str) -> bool:
    if not url: return False
    lower = url.lower()
    if barcode and len(barcode) >= 8 and barcode in lower: return True
    return any(d in lower for d in TRUSTED_DOMAINS)

def fetch_from_off(barcode: str) -> str | None:
    """Open Food Facts — חינמי ומדויק לפי ברקוד"""
    if not barcode or len(barcode) < 8: return None
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        req = urllib.request.Request(url, headers={"User-Agent": "Savy-App/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read())
        if data.get("status") != 1: return None
        product = data.get("product", {})
        # מחפש תמונה בסדר עדיפות
        img = (
            product.get("image_front_url") or
            product.get("image_url") or
            product.get("image_front_small_url")
        )
        return img if img else None
    except:
        return None

def fetch_from_serp(barcode: str) -> str | None:
    """SerpAPI — רק ברקוד, רק דומיינים מהימנים"""
    if not barcode or len(barcode) < 8: return None
    try:
        q = urllib.parse.quote(barcode)
        url = f"https://serpapi.com/search.json?engine=google_images&q={q}&api_key={SERP_KEY}&num=10&hl=he&gl=il"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
        results = data.get("images_results", [])
        for r in results:
            orig = r.get("original", "")
            link = r.get("link", "")
            if is_trusted(orig, barcode) or is_trusted(link, barcode):
                return orig
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

    cur.execute("""
        SELECT p.id, p.barcode, p.name
        FROM product p
        WHERE (p.image_url IS NULL OR p.image_url = '')
          AND p.barcode IS NOT NULL
          AND length(p.barcode) >= 8
          AND EXISTS (SELECT 1 FROM store_price sp WHERE sp.product_id = p.id)
        ORDER BY p.store_count DESC NULLS LAST
        LIMIT %s
    """, (BATCH_SIZE,))

    products = cur.fetchall()
    log.info(f"Found {len(products)} products missing images")

    updated = off_count = serp_count = not_found = 0

    for i, (pid, barcode, name) in enumerate(products):
        img = None

        # שלב 1 — Open Food Facts
        img = fetch_from_off(barcode)
        if img:
            off_count += 1
        else:
            # שלב 2 — SerpAPI ברקוד בלבד
            time.sleep(DELAY)
            img = fetch_from_serp(barcode)
            if img:
                serp_count += 1
            else:
                not_found += 1

        if img:
            cur.execute("UPDATE product SET image_url=%s WHERE id=%s", (img, pid))
            updated += 1

        if (i + 1) % 50 == 0:
            conn.commit()
            log.info(f"  {i+1}/{len(products)} — OFF:{off_count} SERP:{serp_count} missing:{not_found}")

    conn.commit()
    log.info(f"\n🎉 Done — {updated}/{len(products)} updated (OFF:{off_count} SERP:{serp_count} not_found:{not_found})")
    conn.close()

if __name__ == "__main__":
    main()
