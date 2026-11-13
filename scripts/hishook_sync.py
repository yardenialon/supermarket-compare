#!/usr/bin/env python3
"""
hishook_sync.py — nightly price sync for החישוק (hahishook.com), the first
chain on Savy that is NOT covered by the price-transparency law.

The owner publishes a daily TSV (shared with CHP and "anyone who wants to
pull prices"): hahishook.com/wp-content/uploads/chp/YYYYMMDD.tsv
Columns: 0 itemcode, 1 price, 2 discounted_price, 3 capacity, 4 deeplink,
5 short_name, 6 units, 7 long_name, 8 image, 9 leading_barcodes,
10 similar_barcodes.

Matching: ONLY leading_barcodes set prices (similar_barcodes may be other
brands/sizes — never price off them). Feasibility probe 2026-11-13:
286/288 barcode items matched our catalog (99%).

החישוק is an online warehouse operation: one virtual store with
is_online=true and no coordinates. The engine includes online stores in
results regardless of the user's location radius.
"""
import os, re, sys, datetime, urllib.request, psycopg2

CHAIN_NAME = "החישוק"
STORE_NAME = "החישוק אונליין"
WEBSITE = "https://hahishook.com/"
UA = {'User-Agent': 'SavyBot/1.0 (+https://savy.co.il; price partnership)'}

COL_PRICE, COL_DISC, COL_CAPACITY, COL_DEEPLINK, COL_SHORT, COL_UNITS, COL_IMAGE, COL_LEADING = 1, 2, 3, 4, 5, 6, 8, 9


def to_base_units(qty, measure):
    """normalize a package size to grams/ml; None when unparseable"""
    try:
        q = float(str(qty).strip())
    except (TypeError, ValueError):
        return None
    if not (q > 0):
        return None
    m = str(measure or '')
    if re.search(r'ליטר|ק"ג|קילו|kg|ק״ג', m) and q < 20:
        return q * 1000
    return q


def fetch_latest():
    for d in range(0, 8):
        day = (datetime.date.today() - datetime.timedelta(days=d)).strftime("%Y%m%d")
        url = f"https://hahishook.com/wp-content/uploads/chp/{day}.tsv"
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read().decode('utf-8', 'ignore')
            print(f"fetched {url} ({len(data)} bytes)")
            return data
        except Exception as e:
            print(f"{url}: {type(e).__name__}")
    raise SystemExit("no daily hishook file found in the last 8 days")


def main():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # ── schema: online-store support (idempotent) ──
    cur.execute("ALTER TABLE store ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false")
    cur.execute("ALTER TABLE store ADD COLUMN IF NOT EXISTS website text")
    cur.execute("ALTER TABLE store_price ADD COLUMN IF NOT EXISTS deeplink text")
    # flag the chains' own online branches that already exist in the data,
    # so they can appear (labeled) in the same results per product direction
    cur.execute("""UPDATE store SET is_online = true
                   WHERE is_online IS DISTINCT FROM true
                     AND (name ~* 'אונליין|online|אינטרנט' OR city ~* 'אינטרנט')""")
    if cur.rowcount:
        print(f"flagged {cur.rowcount} existing chain online branches as is_online")

    # ── ensure chain + virtual store ──
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (CHAIN_NAME,))
    row = cur.fetchone()
    if row:
        chain_id = row[0]
    else:
        cur.execute("INSERT INTO retailer_chain (name) VALUES (%s) RETURNING id", (CHAIN_NAME,))
        chain_id = cur.fetchone()[0]
        print(f"created chain {CHAIN_NAME} (id={chain_id})")
    cur.execute("SELECT id FROM store WHERE chain_id=%s AND name=%s", (chain_id, STORE_NAME))
    row = cur.fetchone()
    if row:
        store_id = row[0]
        cur.execute("UPDATE store SET is_online=true, website=%s WHERE id=%s", (WEBSITE, store_id))
    else:
        cur.execute("""INSERT INTO store (chain_id, store_code, name, city, is_online, website)
                       VALUES (%s, 'online', %s, 'משלוחים ארציים', true, %s) RETURNING id""",
                    (chain_id, STORE_NAME, WEBSITE))
        store_id = cur.fetchone()[0]
        print(f"created store {STORE_NAME} (id={store_id})")

    # ── parse the daily file ──
    data = fetch_latest()
    items = []          # (barcodes, price, promo_price, deeplink, short_name)
    all_barcodes = set()
    for line in data.split('\n'):
        c = line.rstrip('\r').split('\t')
        if len(c) < 11:
            continue
        try:
            price = float(c[COL_PRICE])
        except ValueError:
            continue
        if not (price > 0):
            continue
        try:
            disc = float(c[COL_DISC])
        except ValueError:
            disc = price
        # the itemcode is usually the product's OWN barcode (an EAN) —
        # an exact identity match, stronger than leading_barcodes, which
        # map to "equivalent" retail products and need the size guard
        own = c[0].strip()
        own = own if own.isdigit() and 8 <= len(own) <= 14 else None
        barcodes = [b for b in re.split(r'[,;| ]+', c[COL_LEADING].strip())
                    if b.isdigit() and 6 <= len(b) <= 14]
        if not own and not barcodes:
            continue
        promo = disc if 0 < disc < price else None
        cap = to_base_units(c[COL_CAPACITY], c[COL_UNITS])
        # their product photo — usable only on an exact-identity match; the
        # generic placeholder (shopping.webp) is not a product photo
        img = c[COL_IMAGE].strip()[:500]
        if not img.startswith('https://hahishook.com/') or 'shopping.webp' in img:
            img = None
        items.append((own, barcodes, price, promo, cap, c[COL_DEEPLINK].strip()[:500], img, c[COL_SHORT][:80]))
        all_barcodes.update(barcodes)
        if own:
            all_barcodes.add(own)
    print(f"file items with a barcode (own or leading): {len(items)}")

    # ── match to catalog, guarded against package-size mismatches ──
    # hishook's leading_barcodes map THEIR product to "equivalent" retail
    # barcodes, which are not always the same package size (their 1L maple
    # syrup pointed at 250ml bottles — 65₪ shown against a 26₪ product).
    # A price must only attach when the sizes agree, or failing size data,
    # when the price is in a sane band around the product's current minimum.
    cur.execute("""SELECT barcode, id, min_price, unit_qty, unit_measure
                   FROM product WHERE barcode = ANY(%s)""", (list(all_barcodes),))
    by_barcode = {r[0]: r for r in cur.fetchall()}
    upserts = {}        # product_id -> (price, promo, deeplink)  (cheapest wins)
    images = {}         # product_id -> image url (exact-identity matches only)
    rejected = []
    own_hits = 0
    for own, barcodes, price, promo, cap, deeplink, img, name in items:
        # exact identity: their itemcode IS this product's barcode
        if own and own in by_barcode:
            pid = by_barcode[own][1]
            prev = upserts.get(pid)
            if prev is None or price < prev[0]:
                upserts[pid] = (price, promo, deeplink)
            if img:
                images[pid] = img
            own_hits += 1
        for b in barcodes:
            row = by_barcode.get(b)
            if row is None:
                continue
            _, pid, min_price, unit_qty, unit_measure = row
            ours = to_base_units(unit_qty, unit_measure)
            if cap and ours:
                if not (0.75 <= cap / ours <= 1.3):
                    rejected.append((name, price, f"size {cap:g} vs {ours:g}"))
                    continue
            elif min_price and float(min_price) > 0:
                ratio = price / float(min_price)
                if not (0.35 <= ratio <= 2.2):
                    rejected.append((name, price, f"price x{ratio:.1f} of min {min_price}"))
                    continue
            prev = upserts.get(pid)
            if prev is None or price < prev[0]:
                upserts[pid] = (price, promo, deeplink)
    print(f"matched products: {len(upserts)} (exact itemcode hits: {own_hits}), rejected mappings: {len(rejected)}")
    for name, price, why in rejected[:20]:
        print(f"  rejected: {name} @ {price} ({why})")

    # ── upsert prices, purge stale rows, refresh aggregates ──
    cur.execute("SELECT product_id FROM store_price WHERE store_id=%s", (store_id,))
    existing = {r[0] for r in cur.fetchall()}
    stale = existing - set(upserts)
    if stale:
        cur.execute("DELETE FROM store_price WHERE store_id=%s AND product_id = ANY(%s)",
                    (store_id, list(stale)))
        print(f"purged {len(stale)} stale rows")
    for pid, (price, promo, deeplink) in upserts.items():
        cur.execute("""INSERT INTO store_price (product_id, store_id, price, is_promo, promo_price, deeplink)
                       VALUES (%s,%s,%s,%s,%s,%s)
                       ON CONFLICT (product_id, store_id) DO UPDATE
                         SET price=EXCLUDED.price, is_promo=EXCLUDED.is_promo,
                             promo_price=EXCLUDED.promo_price, deeplink=EXCLUDED.deeplink,
                             updated_at=NOW()""",
                    (pid, store_id, price, promo is not None, promo, deeplink))

    # fill image gaps only: never overwrite an existing image (our produce
    # photos included) — hishook's photo covers products no chain CDN has
    filled = 0
    for pid, img in images.items():
        cur.execute("""UPDATE product SET image_url=%s, image_checked_at=NOW()
                       WHERE id=%s AND image_url IS NULL""", (img, pid))
        filled += cur.rowcount
    print(f"image gaps filled from hishook photos: {filled}")

    affected = list(set(upserts) | stale)
    if affected:
        cur.execute("""UPDATE product p SET min_price=sub.min_price, store_count=sub.store_count
                       FROM (SELECT product_id, MIN(price) as min_price,
                                    COUNT(DISTINCT store_id) as store_count
                             FROM store_price WHERE product_id = ANY(%s)
                             GROUP BY product_id) sub
                       WHERE p.id = sub.product_id""", (affected,))
        print(f"refreshed aggregates for {cur.rowcount} products")

    conn.commit()
    print(f"\nhishook sync done: {len(upserts)} products priced at store {store_id}")
    conn.close()


if __name__ == "__main__":
    main()
