#!/usr/bin/env python3
"""
apply_produce_images.py — point weighed fresh-produce products at our own
AI-generated produce photos (https://savy.co.il/produce-img/{id}.jpg).

Scope is deliberately narrow and safe: only products in category
'ירקות ופירות' whose barcode starts with '2' (store-internal / weighed EAN),
whose barcode-keyed CDN images were wrong by construction. Only ids present
in scripts/produce_images.json are applied, so partial generation batches
roll out incrementally. image_checked_at is set so the vision verifier
skips them; products whose image was hand-picked in the admin (a non-savy
URL with image_checked_at set) are never overwritten.
"""
import os, json, psycopg2

BASE = "https://savy.co.il/produce-img"

# id -> (include ILIKE patterns, exclude ILIKE patterns). Each entry's
# excludes prevent the known cross-matches (apple vs potato, carrot vs
# juice, cabbage vs cauliflower...), so entries are independent.
MAPPING: list[tuple[str, list[str], list[str]]] = [
    ("sweet_potato", ["%בטטה%"], []),
    ("potato",      ["%תפוח אדמה%", "%תפו\"א%"], ["%בטטה%"]),
    ("tomato",      ["%עגבני%"], ["%רסק%", "%מרוסק%", "%מיובש%"]),
    ("cucumber",    ["%מלפפון%"], ["%מלח%", "%חמוץ%", "%חומץ%", "%כבוש%"]),
    ("pepper_red",  ["%פלפל אדום%", "%פלפל קליפורני%"], []),
    ("pepper_grn",  ["%פלפל ירוק%"], []),
    ("onion",       ["%בצל%"], ["%ירוק%", "%מטוגן%"]),
    ("carrot",      ["%גזר%"], ["%תפוגזר%", "%מיץ%"]),
    ("zucchini",    ["%קישוא%"], []),
    ("eggplant",    ["%חציל%"], ["%טחינה%", "%כבד%", "%סלט%"]),
    ("lettuce",     ["%חסה%"], []),
    ("broccoli",    ["%ברוקולי%"], []),
    ("cauliflower", ["%כרובית%"], []),
    ("cabbage",     ["%כרוב%"], ["%כרובית%"]),
    ("corn",        ["%תירס%"], []),
    ("garlic",      ["%שום%"], ["%שומשום%", "%כתוש%", "%קוביות%", "%תיבולית%"]),
    ("spinach",     ["%תרד%"], []),
    ("pumpkin",     ["%דלעת%"], ["%גרעינ%"]),
    ("celery",      ["%סלרי%"], []),
    ("radish",      ["%צנונית%", "%צנון%"], []),
    ("apple",       ["%תפוח%"], ["%אדמה%", "%מיץ%", "%רסק%"]),
    ("banana",      ["%בננה%"], []),
    ("orange",      ["%תפוז%"], ["%מיץ%"]),
    ("lemon",       ["%לימון%"], ["%מיץ%", "%מלח%"]),
    ("watermelon",  ["%אבטיח%"], ["%גרעינ%"]),
    ("melon",       ["%מלון%"], []),
    ("grapes",      ["%ענבים%", "%ענב %"], ["%מיץ%"]),
    ("mango",       ["%מנגו%"], []),
    ("strawberry",  ["%תות%"], ["%ריבה%", "%יוגורט%"]),
    ("peach",       ["%אפרסק%"], []),
    ("plum",        ["%שזיף%"], ["%מיובש%"]),
    ("pear",        ["%אגס%"], []),
    ("pomegranate", ["%רימון%"], []),
    ("kiwi",        ["%קיווי%"], []),
    ("avocado",     ["%אבוקדו%"], []),
    ("clementine",  ["%קלמנטינ%"], []),
    ("grapefruit",  ["%אשכולית%"], []),
    ("cherry",      ["%דובדבן%"], ["%שימור%", "%מסוכר%"]),
    ("fig",         ["%תאנ%"], ["%מיובש%"]),
    ("date",        ["%תמר%"], ["%ממרח%", "%סילאן%"]),
    ("parsley",     ["%פטרוזיליה%"], []),
    ("coriander",   ["%כוסברה%"], []),
    ("mint",        ["%נענע%"], ["%תה %", "%סוכרי%"]),
    ("dill",        ["%שמיר%"], []),
    ("basil",       ["%בזיליקום%"], []),
]

def main():
    with open(os.path.join(os.path.dirname(__file__), "produce_images.json")) as f:
        manifest = {k: v for k, v in json.load(f).items() if not k.startswith("_")}
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    total = 0
    for pid, includes, excludes in MAPPING:
        if pid not in manifest:
            continue
        inc_sql = " OR ".join(["name ILIKE %s"] * len(includes))
        exc_sql = "".join([" AND name NOT ILIKE %s"] * len(excludes))
        url = f"{BASE}/{pid}.jpg"
        cur.execute(f"""
            UPDATE product SET image_url=%s, image_checked_at=NOW(), image_rejected_url=NULL
            WHERE category='ירקות ופירות' AND barcode LIKE '2%%'
              AND ({inc_sql}){exc_sql}
              AND (image_url IS NULL OR image_url ILIKE '%%savy.co.il%%')
        """, [url, *includes, *excludes])
        print(f"{pid}: {cur.rowcount} products")
        total += cur.rowcount
    conn.commit()
    print(f"\ntotal updated: {total}")
    conn.close()

if __name__ == "__main__":
    main()
