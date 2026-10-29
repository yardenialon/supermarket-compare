#!/usr/bin/env python3
"""
verify_images.py — Vision verification of product images with Claude.

For products with an unchecked image (image_checked_at IS NULL), ask a small
vision model whether the image actually shows the named product. Mismatches
(e.g. an air freshener saved for a doughnut) get image_url cleared and the bad
URL remembered in image_rejected_url so update_images.py won't re-save it.
Broken/unfetchable image URLs are cleared the same way.

Env: DATABASE_URL, ANTHROPIC_API_KEY, VERIFY_BATCH (default 2000),
     ANTHROPIC_MODEL (default claude-haiku-5-5)
"""
import os, json, time, logging, sys
import urllib.request
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-5-5")
BATCH = int(os.environ.get("VERIFY_BATCH", "2000"))

def ask_claude(name: str, brand: str | None, image_url: str) -> str:
    """Returns 'YES', 'NO', or 'BROKEN' (image could not be fetched by the API)."""
    label = f"{name}" + (f" של {brand}" if brand and brand != "לא ידוע" else "")
    body = {
        "model": MODEL,
        "max_tokens": 10,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "url", "url": image_url}},
                {"type": "text", "text":
                    f"This is a supermarket product image. The product is: \"{label}\" (Hebrew). "
                    "Does the image plausibly show this product or the same kind of product? "
                    "Different package sizes or designs of the same product count as YES. "
                    "A completely different kind of product counts as NO. "
                    "Answer with exactly one word: YES or NO."},
            ],
        }],
    }
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            data = json.loads(r.read())
        text = "".join(b.get("text", "") for b in data.get("content", [])).strip().upper()
        if "YES" in text: return "YES"
        if "NO" in text: return "NO"
        return "YES"  # unclear answer — don't destroy data on ambiguity
    except urllib.error.HTTPError as e:
        try: detail = json.loads(e.read()).get("error", {}).get("message", "")
        except Exception: detail = ""
        if e.code == 400 and ("url" in detail.lower() or "image" in detail.lower()):
            return "BROKEN"  # the API could not fetch/parse the image
        if e.code == 429:
            time.sleep(15)
            return "RETRY"
        log.warning(f"API {e.code}: {detail[:150]}")
        return "SKIP"
    except Exception as e:
        log.warning(f"API error: {e}")
        return "SKIP"

def main():
    if not API_KEY:
        log.error("ANTHROPIC_API_KEY not set"); sys.exit(1)
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("ALTER TABLE product ADD COLUMN IF NOT EXISTS image_checked_at timestamptz")
    cur.execute("ALTER TABLE product ADD COLUMN IF NOT EXISTS image_rejected_url text")
    conn.commit()

    cur.execute("""
        SELECT id, name, brand, image_url
        FROM product
        WHERE image_url IS NOT NULL AND image_url != ''
          AND image_checked_at IS NULL
          AND COALESCE(store_count, 0) >= 3
        ORDER BY store_count DESC NULLS LAST
        LIMIT %s
    """, (BATCH,))
    rows = cur.fetchall()
    log.info(f"Verifying {len(rows)} product images with {MODEL}")

    ok = bad = broken = skipped = 0
    for i, (pid, name, brand, img) in enumerate(rows):
        verdict = ask_claude(name, brand, img)
        if verdict == "RETRY":
            verdict = ask_claude(name, brand, img)
        if verdict == "BROKEN":
            # slow origins time out transiently — only clear after a second strike
            time.sleep(4)
            verdict = ask_claude(name, brand, img)
            if verdict == "RETRY": verdict = "SKIP"
        if verdict == "YES":
            cur.execute("UPDATE product SET image_checked_at=NOW() WHERE id=%s", (pid,))
            ok += 1
        elif verdict in ("NO", "BROKEN"):
            cur.execute("UPDATE product SET image_rejected_url=image_url, image_url=NULL, image_checked_at=NOW() WHERE id=%s", (pid,))
            if verdict == "NO":
                bad += 1
                log.info(f"  ✗ mismatch: [{pid}] {name} — {img[:90]}")
            else:
                broken += 1
        else:
            skipped += 1  # transient API issue — will be retried next run
        if (i + 1) % 50 == 0:
            conn.commit()
            log.info(f"  {i+1}/{len(rows)} — ok:{ok} mismatch:{bad} broken:{broken} skipped:{skipped}")
    conn.commit()
    log.info(f"\nDone — ok:{ok} mismatch:{bad} broken:{broken} skipped:{skipped}")
    conn.close()

if __name__ == "__main__":
    main()
