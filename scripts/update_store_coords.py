#!/usr/bin/env python3
import os, time, json, logging, sys
import urllib.request, urllib.parse
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

GOOGLE_KEY = os.environ.get("GOOGLE_MAPS_KEY", "")
DELAY = 0.05

def geocode(address, city):
    query = address + ", " + city + ", Israel" if city else address + ", Israel"
    q = urllib.parse.quote(query)
    url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + q + "&key=" + GOOGLE_KEY + "&language=he&region=il"
    try:
        with urllib.request.urlopen(url, timeout=8) as r:
            data = json.loads(r.read())
        if data["status"] == "OK":
            loc = data["results"][0]["geometry"]["location"]
            return (loc["lat"], loc["lng"])
        return None
    except Exception as e:
        log.warning("Geocode error for %s: %s", query, e)
        return None

def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url: raise ValueError("DATABASE_URL not set")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, address, city FROM store
        WHERE lat IS NULL AND address IS NOT NULL AND address != ''
        ORDER BY id
    """)
    stores = cur.fetchall()
    log.info("Found %d stores missing coordinates", len(stores))
    updated = not_found = 0
    for i, (sid, name, address, city) in enumerate(stores):
        coords = geocode(address, city or "")
        if coords:
            cur.execute("UPDATE store SET lat=%s, lng=%s WHERE id=%s", (coords[0], coords[1], sid))
            updated += 1
        else:
            not_found += 1
        if (i + 1) % 50 == 0:
            conn.commit()
            log.info("  %d/%d - %d updated, %d not found", i+1, len(stores), updated, not_found)
        time.sleep(DELAY)
    conn.commit()
    log.info("Done - %d/%d stores geocoded", updated, len(stores))
    conn.close()

if __name__ == "__main__":
    main()
