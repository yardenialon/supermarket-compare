#!/usr/bin/env python3
"""
reclassify_categories.py
מסווג מחדש את כל המוצרים באמצעות Claude API עם קטגוריות קבועות.
"""
import os, sys, json, time
import psycopg2
from psycopg2.extras import execute_values
import urllib.request

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
DB_URL = os.environ.get("DATABASE_URL")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "100"))
RECLASSIFY_ALL = os.environ.get("RECLASSIFY_ALL", "false").lower() == "true"

CATEGORIES = {
    "מוצרי חלב וביצים": ["חלב ושמנת", "יוגורט ומעדנים", "גבינות", "חמאה", "ביצים", "לבן ואשל"],
    "לחם ומאפים": ["לחם ולחמניות", "פיתות ולאפות", "מאפים מלוחים", "עוגות ומאפים מתוקים", "עוגיות וביסקוויטים"],
    "בשר ועוף": ["עוף והודו", "בקר וכבש", "נקניקיות ומעדני בשר", "כבד ופנים"],
    "דגים ופירות ים": ["דגים טריים", "דגים מעובדים ושימורים", "פירות ים"],
    "ירקות ופירות": ["ירקות טריים", "פירות טריים", "עשבי תיבול", "ירקות מוכנים וסלטים"],
    "משקאות": ["מים", "שתייה קלה ואנרגיה", "מיצים", "קפה", "תה", "אלכוהול"],
    "חטיפים וממתקים": ["חטיפים מלוחים", "שוקולד", "ממתקים וסוכריות", "גלידה וקפואים מתוקים", "אגוזים וגרעינים"],
    "דגנים וקטניות": ["דגני בוקר", "פסטה ואטריות", "אורז", "קטניות", "קמח ואפייה"],
    "שימורים ובישול": ["שימורים", "רטבים וממרחים", "תבלינים ועשבי תיבול", "שמנים וחומצים", "מרקים ואבקות"],
    "קפואים": ["ירקות קפואים", "בשר ועוף קפוא", "מזון מוכן קפוא", "מאפים קפואים"],
    "מעדנייה וסלטים": ["גבינות מעדנייה", "מעדני בשר", "סלטים מוכנים", "מזון מוכן טרי"],
    "ניקיון": ["חומרי ניקוי", "כביסה", "נייר ומגבות", "שקיות וכלי חד פעמי"],
    "טיפוח ויופי": ["שיניים", "שיער", "גוף ופנים", "גילוח", "מוצרי אישה", "קוסמטיקה"],
    "תינוקות וילדים": ["פורמולה ומזון תינוקות", "חיתולים ומגבונים", "טיפוח תינוקות"],
    "בריאות ותזונה": ["ויטמינים ותוספים", "מזון בריאות", "תרופות ללא מרשם"],
    "מזון לחיות מחמד": ["מזון לכלבים", "מזון לחתולים", "אביזרים לחיות"],
}

CATEGORIES_JSON = json.dumps(CATEGORIES, ensure_ascii=False)


def call_claude(products_batch):
    products_text = "\n".join([f"{p[0]}. {p[1]}" for p in products_batch])
    prompt = f"""סווג כל מוצר סופרמרקט ישראלי לקטגוריה ותת-קטגוריה מהרשימה הבאה בלבד.

קטגוריות ותת-קטגוריות מותרות:
{CATEGORIES_JSON}

מוצרים לסיווג:
{products_text}

החזר JSON בלבד, ללא טקסט נוסף, בפורמט:
{{"1": {{"category": "שם קטגוריה", "subcategory": "שם תת-קטגוריה"}}, "2": {{...}}, ...}}

חוקים:
- השתמש אך ורק בקטגוריות ותת-קטגוריות מהרשימה
- אם מוצר לא מתאים לשום קטגוריה, השתמש category="אחר" subcategory="אחר"
- החזר את ה-index של כל מוצר כמפתח"""

    payload = json.dumps({
        "model": "claude-sonnet-4-5",
        "max_tokens": 4096,
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
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}")
        raise

    text = data["content"][0]["text"].strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()
    # נסה לפרס, אם נכשל נסה לתקן
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # חתוך עד ל-} האחרון התקין
        last_brace = text.rfind('}')
        if last_brace > 0:
            # מצא את ה-} הסוגר של ה-object הראשי
            fixed = text[:last_brace+1]
            # הסר entry אחרון שעלול להיות חצי
            last_comma = fixed.rfind(',')
            if last_comma > 0:
                fixed = fixed[:last_comma] + '}'
            try:
                return json.loads(fixed)
            except:
                pass
        return {}


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
            WHERE name IS NOT NULL
            ORDER BY store_count DESC NULLS LAST
        """)
    else:
        print("מסווג מוצרים ללא קטגוריה...")
        cur.execute("""
            SELECT id, name FROM product
            WHERE (category IS NULL OR category = '' OR category = 'אחר')
            AND name IS NOT NULL
            ORDER BY store_count DESC NULLS LAST
        """)

    products = cur.fetchall()
    total = len(products)
    print(f"נמצאו {total} מוצרים לסיווג")

    classified = 0
    errors = 0

    for i in range(0, total, BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]
        batch_indexed = [(idx + 1, p[1]) for idx, p in enumerate(batch)]
        print(f"  batch {i//BATCH_SIZE + 1}/{(total+BATCH_SIZE-1)//BATCH_SIZE} ({i}-{min(i+BATCH_SIZE,total)})...", flush=True)

        try:
            result = call_claude(batch_indexed)
            updates = []
            for idx, (pid, name) in enumerate(batch):
                key = str(idx + 1)
                if key in result:
                    cat = result[key].get("category", "")
                    sub = result[key].get("subcategory", "")
                    if cat and cat != "אחר":
                        updates.append((cat, sub, pid))

            if updates:
                execute_values(cur,
                    "UPDATE product SET category=data.cat, subcategory=data.sub FROM (VALUES %s) AS data(cat,sub,id) WHERE product.id=data.id",
                    updates)
                conn.commit()
                classified += len(updates)
                print(f"    ✓ {len(updates)} מוצרים", flush=True)

        except Exception as e:
            print(f"    ✗ שגיאה: {e}", flush=True)
            errors += 1
            conn.rollback()
            time.sleep(5)
            continue

        time.sleep(0.5)

    print(f"\n=== סיום: {classified}/{total} סווגו, {errors} שגיאות ===")
    conn.close()

if __name__ == "__main__":
    main()
