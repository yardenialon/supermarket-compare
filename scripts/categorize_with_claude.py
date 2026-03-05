#!/usr/bin/env python3
"""
categorize_with_claude.py
מסווג מוצרים ללא קטגוריה באמצעות Claude API — batch של 50 מוצרים בכל קריאה.
"""
import os, logging, sys, json, time
import psycopg2
from psycopg2.extras import execute_values
import anthropic

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

BATCH_SIZE = 50
DB_COMMIT_EVERY = 200
SLEEP_BETWEEN = 0.5
LIMIT = int(os.environ.get("LIMIT", "5000"))

CATEGORIES = [
    "מוצרי חלב","בשר ועוף","דגים ופירות ים","לחם ומאפה","ירקות ופירות",
    "משקאות","חטיפים וממתקים","דגנים וקטניות","שימורים ומזון יבש",
    "מוצרים קפואים","ניקיון ובית","היגיינה ויופי","מוצרי תינוקות",
    "בריאות ותוספים","מזון לחיות מחמד","ביגוד והנעלה","אלקטרוניקה וחשמל",
    "כלי בית וגינה","אחר",
]

SYSTEM_PROMPT = f"""אתה מסווג מוצרי סופרמרקט ישראלי.
לכל מוצר, בחר בדיוק קטגוריה אחת מהרשימה:
{', '.join(CATEGORIES)}

החזר JSON בלבד, ללא markdown, בפורמט:
{{"results": [{{"i": 0, "c": "קטגוריה"}}, ...]}}

כללים:
- i הוא האינדקס של המוצר (0-based)
- c הוא שם הקטגוריה בדיוק כפי שמופיע ברשימה
- אם מוצר לא ברור — בחר "אחר"
- החזר תוצאה לכל מוצר ברשימה"""


def classify_batch(client, products):
    lines = "\n".join(f"{i}. {name}" for i, (_, name) in enumerate(products))
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"סווג:\n{lines}"}],
    )
    text = msg.content[0].text.strip().replace("```json","").replace("```","").strip()
    parsed = json.loads(text)
    return {item["i"]: item["c"] for item in parsed["results"]}


def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url: raise ValueError("DATABASE_URL not set")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key: raise ValueError("ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=api_key)
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute("""
        SELECT p.id, p.name FROM product p
        WHERE (p.category IS NULL OR p.category = '')
          AND p.name IS NOT NULL AND LENGTH(p.name) > 2
        ORDER BY
          CASE WHEN EXISTS (SELECT 1 FROM promotion_item pi WHERE pi.product_id = p.id) THEN 0 ELSE 1 END,
          p.store_count DESC NULLS LAST
        LIMIT %s
    """, (LIMIT,))

    products = cur.fetchall()
    total = len(products)
    log.info("סה\"כ מוצרים לסיווג: %d", total)

    updates = []
    done = 0
    errors = 0

    for i in range(0, total, BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
        try:
            classifications = classify_batch(client, batch)
            for local_idx, (product_id, name) in enumerate(batch):
                category = classifications.get(local_idx, "אחר")
                if category not in CATEGORIES:
                    category = "אחר"
                updates.append((category, product_id))
                done += 1
            log.info("batch %d/%d | %d/%d ✓", batch_num, total_batches, done, total)
        except Exception as e:
            log.error("שגיאה ב-batch %d: %s", batch_num, e)
            errors += len(batch)

        if len(updates) >= DB_COMMIT_EVERY:
            execute_values(cur,
                "UPDATE product SET category=data.cat FROM (VALUES %s) AS data(cat, id) WHERE product.id=data.id::integer",
                updates)
            conn.commit()
            log.info("💾 commit — %d מוצרים נשמרו", len(updates))
            updates = []

        time.sleep(SLEEP_BETWEEN)

    if updates:
        execute_values(cur,
            "UPDATE product SET category=data.cat FROM (VALUES %s) AS data(cat, id) WHERE product.id=data.id::integer",
            updates)
        conn.commit()
        log.info("💾 commit סופי — %d מוצרים נשמרו", len(updates))

    log.info("✅ הסתיים! %d סווגו, %d שגיאות", done, errors)
    conn.close()

if __name__ == "__main__":
    main()
