#!/usr/bin/env python3
"""Fix AM-PM store data: bogus city labels + coords geocoded against those wrong cities.

The Dor Alon feed ships shuffled city values for AM-PM stores, and the original
geocoding used address+city, so many stores landed in the wrong town. Re-geocode
from address + a locality hint taken from the store NAME (which is reliable),
then set city from reverse geocoding. Also clears the "center of Israel"
fallback coords (31.046051,34.851612) that several chains share.
"""
import os, re, time, json, logging, sys
import urllib.request, urllib.parse
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
log = logging.getLogger(__name__)

GOOGLE_KEY = os.environ.get("GOOGLE_MAPS_KEY", "")
DELAY = 0.05
LAT_MIN, LAT_MAX = 29.3, 33.4
LNG_MIN, LNG_MAX = 34.2, 35.95
JUNK_LAT, JUNK_LNG = 31.046051, 34.851612


def gmaps(path, params):
    params["key"] = GOOGLE_KEY
    params["language"] = "he"
    params["region"] = "il"
    url = f"https://maps.googleapis.com/maps/api/{path}/json?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=8) as r:
            return json.loads(r.read())
    except Exception as e:
        log.warning("gmaps error: %s", e)
        return None


def geocode(query):
    data = gmaps("geocode", {"address": query})
    if data and data.get("status") == "OK":
        res = data["results"][0]
        loc = res["geometry"]["location"]
        return loc["lat"], loc["lng"]
    if data:
        log.warning("  geocode %r -> status=%s error=%s", query, data.get("status"), data.get("error_message", ""))
    return None


def reverse_city(lat, lng):
    data = gmaps("geocode", {"latlng": f"{lat},{lng}", "result_type": "locality"})
    if data and data.get("status") == "OK":
        for comp in data["results"][0]["address_components"]:
            if "locality" in comp["types"]:
                return comp["long_name"]
    return None


NOMINATIM_UA = {"User-Agent": "savy-store-fixer/1.0 (info@savy.co.il)"}
NOMINATIM_DELAY = 1.1  # per usage policy: max 1 req/sec


def nominatim(path, params):
    url = f"https://nominatim.openstreetmap.org/{path}?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url, headers=NOMINATIM_UA)
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        log.warning("nominatim error: %s", e)
        return None


def geocode_osm(query):
    time.sleep(NOMINATIM_DELAY)
    data = nominatim("search", {"q": query, "format": "json", "limit": 1, "countrycodes": "il"})
    if data:
        return float(data[0]["lat"]), float(data[0]["lon"])
    return None


def reverse_city_osm(lat, lng):
    time.sleep(NOMINATIM_DELAY)
    data = nominatim("reverse", {"lat": lat, "lon": lng, "format": "json", "zoom": 13, "accept-language": "he"})
    if data and "address" in data:
        a = data["address"]
        return a.get("city") or a.get("town") or a.get("village") or a.get("municipality")
    return None


def name_hint(name):
    # strip AM-PM brand variants; what's left is usually a street/locality hint
    h = re.sub(r"(?i)am[\s-]*pm", " ", name or "")
    return re.sub(r"\s+", " ", h).strip()


# known locality tokens (incl. common abbreviations) that appear inside AM-PM store names
CITY_TOKENS: list[tuple[str, str]] = sorted([
    ("תל אביב", "תל אביב"), ('ת"א', "תל אביב"), ("רמת גן", "רמת גן"), ('ר"ג', "רמת גן"),
    ("בת ים", "בת ים"), ("גבעתיים", "גבעתיים"), ("הרצליה", "הרצליה"), ("חולון", "חולון"),
    ("ראשון לציון", "ראשון לציון"), ('ראשל"צ', "ראשון לציון"), ("באר שבע", "באר שבע"), ('ב"ש', "באר שבע"),
    ("חדרה", "חדרה"), ("קרית אונו", "קרית אונו"), ("קריית אונו", "קרית אונו"),
    ("טירת הכרמל", "טירת כרמל"), ("טירת כרמל", "טירת כרמל"), ("נס ציונה", "נס ציונה"),
    ("הוד השרון", "הוד השרון"), ("חיפה", "חיפה"), ("ירושלים", "ירושלים"),
    ("קרית ביאליק", "קרית ביאליק"), ("קריית ביאליק", "קרית ביאליק"), ("קרית מוצקין", "קרית מוצקין"),
    ("נווה מונסון", "נווה מונוסון"), ("רעננה", "רעננה"), ("כפר סבא", "כפר סבא"),
    ("פתח תקווה", "פתח תקווה"), ('פ"ת', "פתח תקווה"), ("רמת השרון", "רמת השרון"),
], key=lambda t: -len(t[0]))


def city_from_text(text):
    for token, canonical in CITY_TOKENS:
        if token in (text or ""):
            return canonical
    return None


def in_israel(lat, lng):
    return LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX


def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not set")
    if not GOOGLE_KEY:
        raise ValueError("GOOGLE_MAPS_KEY not set")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1) clear the center-of-Israel fallback coords everywhere (they poison nearby search)
    cur.execute("""
        UPDATE store SET lat = NULL, lng = NULL
        WHERE ABS(lat - %s) < 0.0001 AND ABS(lng - %s) < 0.0001
    """, (JUNK_LAT, JUNK_LNG))
    log.info("Cleared center-of-Israel fallback coords on %d stores", cur.rowcount)

    # 2) re-geocode AM-PM stores from address + name hint (city column is untrustworthy)
    cur.execute("""
        SELECT s.id, s.name, s.address, s.city
        FROM store s JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE rc.name ILIKE '%%am%%pm%%' OR s.subchain_name ILIKE '%%am%%pm%%'
        ORDER BY s.id
    """)
    stores = cur.fetchall()
    log.info("Re-geocoding %d AM-PM stores", len(stores))
    fixed = failed = 0
    for sid, name, address, old_city in stores:
        hint = name_hint(name)
        addr = (address or "").strip()
        # a locality named inside the store name/address is the strongest signal we have
        city_guess = city_from_text(f"{name} {addr}")
        queries = []
        if addr and city_guess:
            queries.append(f"{addr}, {city_guess}, ישראל")
        if addr and hint and hint not in addr:
            queries.append(f"{addr}, {hint}, ישראל")
        if addr:
            queries.append(f"{addr}, ישראל")
        if hint:
            queries.append(f"AM PM {hint}, ישראל")
        coords = None
        for q in queries:
            coords = geocode(q)
            if coords and in_israel(*coords):
                break
            coords = None
            time.sleep(DELAY)
        if not coords:
            # Google failed (e.g. expired key) — fall back to OpenStreetMap
            for q in queries:
                coords = geocode_osm(q)
                if coords and in_israel(*coords):
                    break
                coords = None
        if not coords:
            # wrong coords are worse than none: hide the store from nearby search,
            # but still fix the city label when the name tells us the real locality
            if city_guess:
                cur.execute("UPDATE store SET lat=NULL, lng=NULL, city=%s WHERE id=%s", (city_guess, sid))
            else:
                cur.execute("UPDATE store SET lat=NULL, lng=NULL WHERE id=%s", (sid,))
            failed += 1
            log.warning("  FAILED (coords cleared) [%s] %s | addr=%r old_city=%r", sid, name, address, old_city)
            continue
        lat, lng = coords
        city = reverse_city(lat, lng) or reverse_city_osm(lat, lng) or city_guess or old_city
        cur.execute("UPDATE store SET lat=%s, lng=%s, city=%s WHERE id=%s", (lat, lng, city, sid))
        fixed += 1
        marker = "" if city == old_city else f"  (city: {old_city!r} -> {city!r})"
        log.info("  OK [%s] %s -> %.5f,%.5f%s", sid, name, lat, lng, marker)
        time.sleep(DELAY)

    conn.commit()
    log.info("Done: %d fixed, %d failed out of %d AM-PM stores", fixed, failed, len(stores))
    conn.close()


if __name__ == "__main__":
    main()
