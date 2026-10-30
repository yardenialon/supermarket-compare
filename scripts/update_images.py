#!/usr/bin/env python3
"""
update_images.py — Fetch product images.
Strategy (images ONLY from retail chains, manufacturers/brands, and the
open-license Open Food Facts database — NEVER from competitor comparison
sites, which is a legal requirement):
1. Chain CDNs by barcode (deterministic URL patterns, HEAD-verified)
2. Open Food Facts API (open license, barcode-based)
3. SerpAPI — barcode-only query, chain/brand domains only
Every saved image is later vision-verified by scripts/verify_images.py.
"""
import os, time, json, logging, sys
import urllib.request, urllib.parse
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

SERP_KEY = os.environ.get("SERPAPI_KEY", "")  # no hardcoded fallback — rotate + store as secret
BATCH_SIZE = int(os.environ.get("IMAGE_BATCH_SIZE", "500"))
DELAY = 0.3

TRUSTED_DOMAINS = [
    # רשתות סופרמרקט
    'shufersal.co.il', 'mega.co.il', 'rami-levy.co.il', 'ramielevy.co.il',
    'osheread.co.il', 'osherad.co.il', 'yochananof.co.il', 'tivtaam.co.il',
    'victory.co.il', 'victoryonline.co.il', 'half-price.co.il',
    'keshet-teamim.co.il', 'freshmarket.co.il', 'mahsaniashuk.co.il',
    'carrefour.co.il', 'quik.co.il', 'cloudinary.com/shufersal',
    # יצרנים ומותגים
    'tnuva.co.il', 'strauss.co.il', 'osem.co.il', 'rfranco.com',
    'mybundles.co.il', 'schnellers.co.il', 'super-pharm.co.il',
    'telma.co.il', 'elite.co.il', 'nestle.co.il', 'unilever.com',
    'wissotzky.co.il', 'soglowek.co.il', 'zoglobek.co.il', 'sano.co.il',
    # מאגר פתוח ברישיון חופשי בלבד (לא אתר מתחרה)
    'openfoodfacts.org', 'world.openfoodfacts.org',
]

# אתרי השוואת מחירים ומתחרים — לעולם לא לוקחים מהם תמונות (חשיפה משפטית)
BLOCKED_DOMAINS = [
    'chp.co.il', 'pricez.co.il', 'zap.co.il', 'wisebuy.co.il',
    'mysupermarket', 'pricecompare', 'zolpo', 'bonuscard', 'supersmart',
    'machsaneihashuk',  # זהירות מכפילויות לא רשמיות
]

def is_trusted(url: str, barcode: str) -> bool:
    """Accept only chain/manufacturer/open-db domains; competitor domains are
    always rejected, even when the barcode appears in the URL."""
    if not url: return False
    lower = url.lower()
    if any(b in lower for b in BLOCKED_DOMAINS): return False
    return any(d in lower for d in TRUSTED_DOMAINS)

# ─── Chain CDNs: deterministic image URLs keyed by barcode ───────────
CHAIN_CDN_PATTERNS = [
    "https://img.rami-levy.co.il/product/{barcode}/small.jpg",
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1/prod/product_images/products_small/P_{barcode}_1.png",
    "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1/prod/product_images/products_zoom/P_{barcode}ZO.png",
]

def fetch_from_chain_cdn(barcode: str) -> str | None:
    """Try chain image CDNs where the URL is derived from the barcode —
    the key IS the barcode, so a 200 response is the right product."""
    if not barcode or len(barcode) < 8: return None
    for pattern in CHAIN_CDN_PATTERNS:
        url = pattern.format(barcode=barcode)
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0 Savy-App/1.0"})
            with urllib.request.urlopen(req, timeout=6) as r:
                ctype = r.headers.get("Content-Type", "")
                clen = int(r.headers.get("Content-Length") or 0)
                if r.status == 200 and ctype.startswith("image/") and (clen == 0 or clen > 3000):
                    return url
        except Exception:
            continue
    return None

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

_serp_disabled = False  # נכבה אוטומטית אם 429

def fetch_from_serp(barcode: str) -> str | None:
    """SerpAPI — רק ברקוד, רק דומייני רשתות/יצרנים"""
    global _serp_disabled
    if _serp_disabled or not SERP_KEY: return None
    if not barcode or len(barcode) < 8: return None
    try:
        q = urllib.parse.quote(barcode)
        url = f"https://serpapi.com/search.json?engine=google_images&q={q}&api_key={SERP_KEY}&num=5&hl=he&gl=il"
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read())
        results = data.get("images_results", [])
        for r in results:
            orig = r.get("original", "")
            link = r.get("link", "")
            if is_trusted(orig, barcode) or is_trusted(link, barcode):
                return orig
        return None
    except Exception as e:
        msg = str(e)
        if '429' in msg:
            log.warning(f"  SerpAPI 429 — מכבה SerpAPI לשאר הריצה")
            _serp_disabled = True
        elif 'timed out' not in msg:
            log.warning(f"  SerpAPI error for {barcode}: {e}")
        return None

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url: raise ValueError("DATABASE_URL not set")

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()
    cur.execute("ALTER TABLE product ADD COLUMN IF NOT EXISTS image_checked_at timestamptz")
    cur.execute("ALTER TABLE product ADD COLUMN IF NOT EXISTS image_rejected_url text")
    conn.commit()

    # purge legacy images from competitor comparison sites (legal requirement):
    # the blocklist gates new fetches, this clears what older runs saved
    purged_total = 0
    for d in BLOCKED_DOMAINS:
        cur.execute("""UPDATE product SET image_rejected_url=image_url, image_url=NULL, image_checked_at=NOW()
                       WHERE image_url ILIKE %s""", (f"%{d}%",))
        purged_total += cur.rowcount
    conn.commit()
    if purged_total:
        log.info(f"Purged {purged_total} legacy images from blocked domains")

    cur.execute("""
        SELECT p.id, p.barcode, p.name, p.image_rejected_url
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

    updated = cdn_count = off_count = serp_count = not_found = 0

    for i, (pid, barcode, name, rejected) in enumerate(products):
        img = fetch_from_chain_cdn(barcode)
        if img:
            cdn_count += 1
        else:
            img = fetch_from_off(barcode)
            if img:
                off_count += 1
            else:
                # שלב 3 — SerpAPI ברקוד בלבד
                time.sleep(DELAY)
                img = fetch_from_serp(barcode)
                if img:
                    serp_count += 1
                else:
                    not_found += 1

        if img and img != rejected:
            cur.execute("UPDATE product SET image_url=%s, image_checked_at=NULL WHERE id=%s", (img, pid))
            updated += 1

        if (i + 1) % 50 == 0:
            conn.commit()
            log.info(f"  {i+1}/{len(products)} — CDN:{cdn_count} OFF:{off_count} SERP:{serp_count} missing:{not_found}")

    conn.commit()
    log.info(f"\n🎉 Done — {updated}/{len(products)} updated (CDN:{cdn_count} OFF:{off_count} SERP:{serp_count} not_found:{not_found})")
    conn.close()

if __name__ == "__main__":
    main()
