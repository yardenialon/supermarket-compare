#!/usr/bin/env python3
"""
reclassify_categories.py - סיווג מחדש של כל המוצרים עם Claude Haiku
עלות משוערת: ~$0.50 לכל 256K מוצרים
"""
import os, sys, json, time
import psycopg2
from psycopg2.extras import execute_values
import urllib.request

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
DB_URL = os.environ.get("DATABASE_URL")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "200"))
RECLASSIFY_ALL = os.environ.get("RECLASSIFY_ALL", "false").lower() == "true"

CATEGORIES = {
    "מוצרי חלב": ["חלב ומשקאות חלב", "יוגורט ומעדנים", "גבינות", "חמאה ושמנת", "ביצים", "לבן ואשל"],
    "לחם ומאפה": ["לחם ולחמניות", "עוגות ועוגיות", "פריכיות וקרקרים", "פיתות וטורטיות", "מאפים מלוחים"],
    "בשר ועוף": ["עוף והודו", "בשר בקר וכבש", "נקניקים ופסטרמות"],
    "דגים ופירות ים": ["דגים טריים וקפואים", "דגים מעושנים"],
    "ירקות ופירות": ["ירקות", "פירות", "עשבי תיבול", "פירות יבשים ואגוזים", "פיצוחים"],
    "משקאות": ["משקאות קלים", "מיצים ותרכיזים", "קפה ותה", "יין ואלכוהול", "מים וסודה", "בירה ואנרגיה"],
    "חטיפים וממתקים": ["חטיפים מלוחים", "שוקולד", "ממתקים וסוכריות", "גלידה", "אגוזים וגרעינים"],
    "דגנים וקטניות": ["דגני בוקר", "פסטה ואטריות", "אורז", "קטניות", "קמח ואפייה"],
    "שימורים ובישול": ["שימורים", "רטבים וממרחים", "תבלינים", "שמנים וחומצים", "מרקים ואבקות"],
    "מוצרים קפואים": ["ירקות קפואים", "בשר ועוף קפוא", "מזון מוכן קפוא", "מאפים קפואים"],
    "מעדנייה וסלטים": ["גבינות מעדנייה", "מעדני בשר", "סלטים מוכנים"],
    "ניקיון ובית": ["חומרי ניקוי", "כביסה", "נייר ומגבות", "שקיות וכלי חד פעמי"],
    "היגיינה ויופי": ["שיניים", "שיער", "גוף ופנים", "גילוח", "מוצרי אישה", "קוסמטיקה"],
    "מוצרי תינוקות": ["פורמולה ומזון תינוקות", "חיתולים ומגבונים", "טיפוח תינוקות"],
    "בריאות ותזונה": ["ויטמינים ותוספים", "מזון בריאות", "תרופות ללא מרשם"],
    "מזון לחיות מחמד": ["מזון לכלבים", "מזון לחתולים", "אביזרים לחיות"],
}

CATEGORIES_STR = "\n".join([f"- {cat}: {', '.join(subs)}" for cat, subs in CATEGORIES.items()])

PROMPT_TEMPLATE = """סווג כל מוצר סופרמרקט ישראלי לקטגוריה ותת-קטגוריה מהרשימה בלבד:
{categories}

חוקים קפדניים:
1. השתמש אך ורק בקטגוריות מהרשימה
2. מיץ/נקטר/משקה/וודקה/בירה/יין = משקאות (לא ירקות ופירות!)
3. ירקות ופירות = תוצרת טרייה בלבד (עגבניה, תפוח, בננה וכו')
4. מוצר קפוא = מוצרים קפואים (לא בשר ועוף!)
5. ממרח/רוטב/תבלין = שימורים ובישול
6. אם לא בטוח לחלוטין → category=null subcategory=null

מוצרים:
{products}

החזר JSON בלבד ללא backticks:
{{"1":{{"category":"...","subcategory":"..."}},...}}"""


def call_claude(batch):
    products_text = "\n".join([f"{i+1}. {name}" for i, (pid, name) in enumerate(batch)])
    prompt = PROMPT_TEMPLATE.format(
        categories=CATEGORIES_STR,
        products=products_text
    )

    payload = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": prompt}]
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        }
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())

    text = data["content"][0]["text"].strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def main():
    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set"); sys.exit(1)
    if not DB_URL:
        print("ERROR: DATABASE_URL not set"); sys.exit(1)

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    if RECLASSIFY_ALL:
        print("מסווג מחדש את כל המוצרים...")
        cur.execute("""
            SELECT id, name FROM product
            WHERE name IS NOT NULL AND LENGTH(name) > 2
            ORDER BY store_count DESC NULLS LAST
        """)
    else:
        print("מסווג מוצרים ללא קטגוריה...")
        cur.execute("""
            SELECT id, name FROM product
            WHERE (category IS NULL OR category = '' OR category = 'אחר')
            AND name IS NOT NULL AND LENGTH(name) > 2
            ORDER BY store_count DESC NULLS LAST
        """)

    products = cur.fetchall()
    total = len(products)
    print(f"נמצאו {total} מוצרים לסיווג")
    print(f"עלות משוערת: ${total/200*0.0004:.2f}")

    classified = 0
    errors = 0
    total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE

    for i in range(0, total, BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1

        if batch_num % 50 == 0 or batch_num == 1:
            print(f"  batch {batch_num}/{total_batches} ({i}-{min(i+BATCH_SIZE,total)})...", flush=True)

        try:
            result = call_claude(batch)

            updates = []
            for idx, (pid, name) in enumerate(batch):
                key = str(idx + 1)
                if key in result:
                    cat = result[key].get("category") or ""
                    sub = result[key].get("subcategory") or ""
                    if cat and cat in CATEGORIES:
                        updates.append((cat, sub, pid))

            if updates:
                execute_values(cur,
                    "UPDATE product SET category=data.cat, subcategory=data.sub FROM (VALUES %s) AS data(cat,sub,id) WHERE product.id=data.id",
                    updates)
                conn.commit()
                classified += len(updates)

        except Exception as e:
            errors += 1
            conn.rollback()
            if errors <= 5:
                print(f"    ✗ שגיאה batch {batch_num}: {e}", flush=True)
            time.sleep(2)
            continue

        time.sleep(0.3)

    print(f"\n=== סיום: {classified}/{total} סווגו, {errors} שגיאות ===")
    conn.close()


if __name__ == "__main__":
    main()
