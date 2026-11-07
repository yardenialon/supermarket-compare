#!/usr/bin/env python3
"""
apply_produce_images.py — point weighed fresh-produce products at our own
AI-generated produce photos (https://savy.co.il/produce-img/{id}.jpg).

Scope: products in category 'ירקות ופירות' whose name matches a produce
type. Retailers assign in-house codes to weighed produce both as EAN-prefix-2
AND as full 729-prefixed EANs ('דלעת ארוזה' = 7290000961804), so barcode
shape cannot gate this; the name patterns with their excludes do.

The source category data is polluted: drinks, ice cream, snacks, canned
goods and even cosmetics are filed under 'ירקות ופירות' by the chains
(audit 2026-11: 'מילקשייק קצפת ותותים', 'קרם גוף מלפפון', 'סיגריה TESLA
אבטיח'). A product is stamped only if it passes the JUNK gate below, and
the same gate strips any stamp it already carries.
"""
import os, json, psycopg2

BASE = "https://savy.co.il/produce-img"

# id -> (include ILIKE patterns, exclude ILIKE patterns). Each entry's
# excludes prevent the known cross-matches (apple vs potato, carrot vs
# juice, cabbage vs cauliflower...), so entries are independent.
MAPPING: list[tuple[str, list[str], list[str]]] = [
    ("sweet_potato", ["%בטטה%"], []),
    ("potato",      ["%תפוח אדמה%", "%תפו\"א%"], ["%בטטה%"]),
    ("tomato",      ["%עגבני%"], []),
    ("cucumber",    ["%מלפפון%"], ["%מלח%"]),
    ("pepper_red",  ["%פלפל אדום%", "%פלפל קליפורני%"], []),
    ("pepper_grn",  ["%פלפל ירוק%"], []),
    ("onion",       ["%בצל%"], ["%ירוק%"]),
    ("carrot",      ["%גזר%"], ["%תפוגזר%"]),
    ("zucchini",    ["%קישוא%"], []),
    ("eggplant",    ["%חציל%"], []),
    ("lettuce",     ["%חסה%"], []),
    ("broccoli",    ["%ברוקולי%"], []),
    ("cauliflower", ["%כרובית%"], []),
    ("cabbage",     ["%כרוב%"], ["%כרובית%"]),
    ("corn",        ["%תירס%"], []),
    ("garlic",      ["%שום%"], ["%שומשום%", "%כתוש%"]),
    ("spinach",     ["%תרד%"], []),
    ("pumpkin",     ["%דלעת%"], ["%גרעינ%"]),
    ("celery",      ["%סלרי%"], []),
    ("radish",      ["%צנונית%", "%צנון%"], []),
    ("apple",       ["%תפוח%"], ["%אדמה%"]),
    ("banana",      ["%בננה%"], []),
    ("orange",      ["%תפוז%"], []),
    ("lemon",       ["%לימון%"], ["%מלח%"]),
    ("watermelon",  ["%אבטיח%"], ["%גרעינ%"]),
    ("melon",       ["%מלון%"], []),
    ("grapes",      ["%ענבים%", "%ענב %"], ["%גפת%"]),
    ("mango",       ["%מנגו%"], ["%מנגולד%"]),
    ("strawberry",  ["%תות%"], []),
    ("peach",       ["%אפרסק%"], []),
    ("plum",        ["%שזיף%"], []),
    ("pear",        ["%אגס%"], []),
    ("pomegranate", ["%רימון%"], []),
    ("kiwi",        ["%קיווי%"], []),
    ("avocado",     ["%אבוקדו%"], []),
    ("clementine",  ["%קלמנטינ%"], []),
    ("grapefruit",  ["%אשכולית%"], []),
    ("cherry",      ["%דובדבן%"], ["%מסוכר%"]),
    ("fig",         ["%תאנ%"], []),
    ("date",        ["%תמר%"], ["%סילאן%", "%תמרי %"]),
    ("parsley",     ["%פטרוזיליה%"], []),
    ("coriander",   ["%כוסברה%"], []),
    ("mint",        ["%נענע%"], []),
    ("dill",        ["%שמיר%"], []),
    ("basil",       ["%בזיליקום%"], []),
    # batch 2 (field-test gaps). Specific types AFTER their generic parent so
    # the specific photo overwrites the generic stamp (red onion after onion).
    ("beet",         ["%סלק%"], []),
    ("mushrooms",    ["%פטריות%", "%פטריה%"], ["%מולבן%"]),
    ("green_onion",  ["%בצל ירוק%"], []),
    ("red_onion",    ["%בצל אדום%", "%בצל סגול%"], []),
    ("red_cabbage",  ["%כרוב אדום%", "%כרוב סגול%"], []),
    ("cherry_tomato",["%שרי%"], ["%שזיף%", "%דובדבן%"]),
    # batch 3 (category-page gaps)
    ("pineapple",   ["%אננס%"], []),
    ("blueberry",   ["%אוכמניות%", "%אוכמנית%"], []),
    ("ginger",      ["%ג'ינג'ר%", "%ג'ינגר%", "%זנגביל%"], ["%שוט%"]),
    ("lychee",      ["%ליצי%", "%ליצ'י%"], []),
    ("sprouts",     ["%נבטים%", "%נבטי %"], ["%סיניים%"]),
    ("chives",      ["%עירית%"], []),
    ("thyme",       ["%טימין%", "%טיים%"], ["%פליי%", "%אובר%"]),
    ("rosemary",    ["%רוזמרין%"], []),
    ("green_beans", ["%שעועית ירוקה%"], []),
    ("fennel",      ["שומר%", "% שומר%"], []),
    ("leek",        ["%כרישה%", "%כרשה%"], []),
    ("kohlrabi",    ["%קולורבי%"], []),
]

# ── JUNK gate ────────────────────────────────────────────────────────────
# The chains file plenty of processed food and even non-food under
# 'ירקות ופירות'. A product whose name/subcategory trips ANY rule below is
# never stamped, and loses the stamp if it has one. Built from the
# 2026-11 stamp audit (bench-results/diagnose.txt).

JUNK_NAME_ILIKE = [
    # preserved / processed forms
    "%כבוש%", "%חמוץ%", "%חמוצים%", "%חומץ%", "%מרוס%", "%רסק%", "%שימור%",
    "%משומר%", "%בסירופ%", "%מיובש%", "%מיוב", "%קלוי%", "%על האש%", "%מטוגן%",
    "%חתוך%", "%חתוכ%", "%קצוצ%", "%קצוץ%", "%פרוס%", "%שלמות%", "%מקולף%", "%קוביות%",
    "%קובי", "%שלישיי%", "%מדליונ%", "%מחית%", "%קונפיטורה%", "%ריבה%", "%ריבת%",
    "%קפוא%", "%מוקפא%", "%מוקפ", "%סנפרוסט%", "%תיבולית%", "%תבלין%",
    "%גרעיני %", "%וואקום%", "%מאגדת%", "%סיניים%", "%מנגולד%",
    "%ממרח%", "%רוטב%", "%מיונז%", "%טחינה%",
    "%חומוס%", "סלט %", "% סלט%", "%אבקת%", "%סלקטד%",
    # sweets / snacks / baked
    "%בטעמ%", "%סוכרי%", "%מסטיק%", "%שוקולד%", "%מצופה%", "%ממולא%",
    "%מרשמלו%", "%מרציפן%", "%חטיף%", "%חטיפ%", "%במבה%", "%ציטוס%", "%קראנ%",
    "%ביסלי%", "%טבעות%", "%ערגליות%", "%בפלות%", "%וופל%", "%קרקר%",
    "%ביסקוויט%", "%עוגי%", "%עוגת%", "%עוגה%", "%מוזלי%", "%גרנולה%",
    "%דגני%", "%קורנפלקס%", "%לואקר%", "%מאסט%", "%ויטמינ%", "%מסוכר%",
    "%פיתות%", "%פיתה%", "% לחם%", "לחם %", "%לחמני%", "%מאפה%", "%שניצל%",
    "%קרפלך%", "%רביולי%", "%כיפלי%", "%פשטידה%", "%פסטה%", "%אטריות%",
    # dairy / desserts / frozen treats
    "%יוגורט%", "%מעדן%", "%גבינה%", "%גביע%", "%חלב%", "%דניאלה%", "%יופלה%",
    "%פילדלפיה%", "%גלידה%", "%גלידת%", "%שלגון%", "%ארטיק%", "%פופסיקל%",
    "%קרחון%", "%סורבה%", "%שרבט%", "%וניל%", "%מילקשייק%", "%שייק%",
    "%סמוזי%", "%קצפת%", "%פלומביר%", "%לה פרוטה%", "%מנבו%", "%טוויסטר%",
    # drinks
    "%מיץ%", "%משקה%", "%סחוט%", "%נקטר%", "%סירופ%", "%תרכיז%", "%מוגז%",
    "%סודה%", "%פחית%", "%זירו%", "%קולה%", "%ספרייט%", "%אייס טי%", "%תה %",
    "%חליטת%", "%קפה%", "%נביעות%", "%פריגת%", "%ספרינג%", "%תפוזינה%",
    "%נורדיק%", "%סומרסבי%", "באזז%", "%שיכר%", "%ליקר%", "%וודקה%",
    "%תוססות%", "%קרטוני%", "%פרוט &%", "%פילגד%", "%סויה%", "%בקבוק%",
    # household / cosmetics / nonfood
    "%מגבונ%", "%בישום%", "%ניחוח%", "%בושם%", "%סבון%", "%שמפו%", "%מרכך%",
    "%קרם%", "%תרחיץ%", "%שפתון%", "%מסיר%", "%ספריי%", "%תרסיס%", "%נוזל%",
    "%רצפות%", "%כלים%", "%מדיח%", "%כביסה%", "%מייבש%", "%טיטולים%",
    "%רטיות%", "%סיגריה%", "%מקרר%", "%מחבת%", "%תנור%", "%שיער%", "%שמן%",
    "%תמצית%", "%מפיץ%", "%מיסלרי%",
]

# fresh produce in the chains' price files is Hebrew-only; latin letters mark
# branded processed goods ('תות שדה Muller Simpl', 'סיגריה TESLA אבטיח').
JUNK_NAME_REGEX_LATIN = "[A-Za-z]"
# liquid volumes: fresh produce is never sold by the liter/ml
# ('פריגת ... 1.5 ליטר', '300מ"ל', '0.5 ל', truncated '1.5 לי')
JUNK_NAME_REGEX_VOLUME = "[0-9][0-9.]*[[:space:]]*(ליטר|ליט|לי|מ[\"״]?ל|ל)([^א-ת]|$)"

JUNK_SUBCATS = ("פירות יבשים ואגוזים", "פיצוחים")

JUNK_SQL = """(
       name ILIKE ANY(%s)
    OR name ~ %s
    OR name ~ %s
    OR COALESCE(subcategory,'') IN %s
)"""
JUNK_PARAMS = [JUNK_NAME_ILIKE, JUNK_NAME_REGEX_LATIN, JUNK_NAME_REGEX_VOLUME, JUNK_SUBCATS]


def main():
    with open(os.path.join(os.path.dirname(__file__), "produce_images.json")) as f:
        manifest = {k: v for k, v in json.load(f).items() if not k.startswith("_")}
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # strip every stamp the junk gate disallows (wrong stamps from earlier
    # runs included). image_checked_at stays touched so the vision doctor
    # does not treat these as fresh candidates; /product/:id/image may still
    # lazily fetch a real product photo for them, which is correct.
    cur.execute(f"""UPDATE product SET image_url=NULL, image_checked_at=NOW()
                    WHERE image_url ILIKE '%%/produce-img/%%' AND {JUNK_SQL}""",
                JUNK_PARAMS)
    print(f"unstamped {cur.rowcount} junk products wrongly carrying a produce photo")

    total = 0
    for pid, includes, excludes in MAPPING:
        if pid not in manifest:
            continue
        inc_sql = " OR ".join(["name ILIKE %s"] * len(includes))
        exc_sql = "".join([" AND name NOT ILIKE %s"] * len(excludes))
        url = f"{BASE}/{pid}.jpg"
        # unconditional overwrite: our produce photo always beats whatever a
        # barcode lookup once attached ('עגבניה מגי' carried a detergent photo
        # protected by image_checked_at). Name match + junk gate decide.
        cur.execute(f"""
            UPDATE product SET image_url=%s, image_checked_at=NOW(), image_rejected_url=NULL
            WHERE category='ירקות ופירות'
              AND ({inc_sql}){exc_sql}
              AND NOT {JUNK_SQL}
              AND (image_url IS DISTINCT FROM %s)
        """, [url, *includes, *excludes, *JUNK_PARAMS, url])
        print(f"{pid}: {cur.rowcount} products")
        total += cur.rowcount
    conn.commit()
    print(f"\ntotal updated: {total}")
    conn.close()

if __name__ == "__main__":
    main()
