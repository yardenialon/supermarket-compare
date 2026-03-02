#!/usr/bin/env python3
"""
update_categories.py - Fetch product categories from Open Food Facts.
"""
import os, time, json, logging, sys
import urllib.request
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

BATCH_SIZE = int(os.environ.get("CATEGORY_BATCH_SIZE", "1000"))
DELAY = 0.2

CATEGORY_MAP = {
    "dairies": "מוצרי חלב", "dairy": "מוצרי חלב", "milks": "חלב",
    "yogurts": "יוגורט", "cheeses": "גבינות", "butter": "חמאה",
    "breads": "לחם ומאפה", "bread": "לחם ומאפה", "pastries": "מאפים",
    "meats": "בשר ועוף", "meat": "בשר ועוף", "chicken": "עוף", "beef": "בקר",
    "fish": "דגים ופירות ים", "seafood": "דגים ופירות ים",
    "fruits": "פירות וירקות", "vegetables": "פירות וירקות",
    "beverages": "משקאות", "waters": "מים", "juices": "מיצים",
    "sodas": "שתייה קלה", "soft-drinks": "שתייה קלה",
    "snacks": "חטיפים", "chips": "חטיפים", "crackers": "קרקרים",
    "chocolates": "שוקולד וממתקים", "candies": "שוקולד וממתקים", "sweets": "שוקולד וממתקים",
    "cereals": "דגני בוקר", "breakfast-cereals": "דגני בוקר",
    "pastas": "פסטה ואורז", "rice": "פסטה ואורז", "noodles": "פסטה ואורז",
    "oils": "שמנים ורטבים", "sauces": "שמנים ורטבים", "condiments": "תבלינים",
    "spices": "תבלינים", "seasonings": "תבלינים",
    "frozen": "קפוא", "frozen-foods": "קפוא",
    "canned": "שימורים", "canned-foods": "שימורים",
    "coffee": "קפה ותה", "teas": "קפה ותה",
    "baby-foods": "מוצרי תינוקות", "infant": "מוצרי תינוקות",
    "cleaning": "ניקיון", "hygiene": "היגיינה ויופי",
    "cosmetics": "היגיינה ויופי", "beauty": "היגיינה ויופי",
    "pet-foods": "מזון לחיות", "pet": "מזון לחיות",
}

def parse_categories(cats_str):
    if not cats_str: return ("", "")
    parts = [c.strip().lower() for c in cats_str.split(",")]
    category = ""
    subcategory = ""
    for part in parts:
        clean = part.replace("en:", "").replace("he:", "").strip()
        for key, value in CATEGORY_MAP.items():
            if key in clean:
                if not category:
                    category = value
                elif not subcategory and value != category:
                    subcategory = value
                break
    return (category, subcategory)

def fetch_categories(barcode):
    try:
        req = urllib.request.Request(
            "https://world.openfoodfacts.org/api/v0/product/" + barcode + ".json?fields=categories",
            headers={"User-Agent": "Savy-App/1.0"}
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read())
        if data.get("status") != 1: return ("", "")
        cats = data["product"].get("categories", "")
        return parse_categories(cats)
    except:
        return ("", "")

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url: raise ValueError("DATABASE_URL not set")

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute("""
        SELECT p.id, p.barcode
        FROM product p
        WHERE (p.category IS NULL OR p.category = \'\')
          AND p.barcode IS NOT NULL
          AND length(p.barcode) >= 8
          AND EXISTS (SELECT 1 FROM store_price sp WHERE sp.product_id = p.id)
        ORDER BY p.store_count DESC NULLS LAST
        LIMIT %s
    """, (BATCH_SIZE,))

    products = cur.fetchall()
    log.info("Found %d products missing categories", len(products))

    updated = not_found = 0

    for i, (pid, barcode) in enumerate(products):
        category, subcategory = fetch_categories(barcode)
        if category:
            cur.execute("UPDATE product SET category=%s, subcategory=%s WHERE id=%s", (category, subcategory, pid))
            updated += 1
        else:
            not_found += 1

        if (i + 1) % 100 == 0:
            conn.commit()
            log.info("  %d/%d - %d updated, %d not found", i+1, len(products), updated, not_found)
        time.sleep(DELAY)

    conn.commit()
    log.info("Done - %d/%d categories updated", updated, len(products))
    conn.close()

if __name__ == "__main__":
    main()
