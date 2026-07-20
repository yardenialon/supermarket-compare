#!/usr/bin/env python3
"""Diagnose store address/coordinate data quality (AM-PM issue + general sanity)."""
import os, sys
import psycopg2

# Israel bounding box (generous)
LAT_MIN, LAT_MAX = 29.3, 33.4
LNG_MIN, LNG_MAX = 34.2, 35.95


def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not set")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("=" * 70)
    print("AM-PM STORES (chain or subchain)")
    print("=" * 70)
    cur.execute("""
        SELECT s.id, rc.name, s.subchain_name, s.name, s.city, s.address, s.lat, s.lng
        FROM store s JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE rc.name ILIKE '%am%pm%' OR s.subchain_name ILIKE '%am%pm%'
        ORDER BY s.city, s.name
    """)
    rows = cur.fetchall()
    print(f"total: {len(rows)}")
    for r in rows:
        sid, chain, sub, name, city, addr, lat, lng = r
        flags = []
        if lat is None or lng is None:
            flags.append("NO-COORDS")
        else:
            if not (LAT_MIN <= float(lat) <= LAT_MAX and LNG_MIN <= float(lng) <= LNG_MAX):
                flags.append("OUT-OF-ISRAEL")
        if not (addr or "").strip():
            flags.append("NO-ADDRESS")
        if not (city or "").strip():
            flags.append("NO-CITY")
        flag_s = (" <<< " + ",".join(flags)) if flags else ""
        print(f"[{sid}] {chain}/{sub or '-'} | {name} | city={city!r} | addr={addr!r} | {lat},{lng}{flag_s}")

    print()
    print("=" * 70)
    print("COORD SANITY BY CHAIN (all chains)")
    print("=" * 70)
    cur.execute("""
        SELECT rc.name,
               COUNT(*) AS total,
               COUNT(*) FILTER (WHERE s.lat IS NULL) AS no_coords,
               COUNT(*) FILTER (WHERE s.lat IS NOT NULL AND
                 NOT (s.lat BETWEEN %s AND %s AND s.lng BETWEEN %s AND %s)) AS out_of_bbox
        FROM store s JOIN retailer_chain rc ON rc.id = s.chain_id
        GROUP BY rc.name ORDER BY out_of_bbox DESC, no_coords DESC
    """, (LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX))
    for name, total, no_coords, oob in cur.fetchall():
        print(f"{name:25s} total={total:4d}  no_coords={no_coords:4d}  out_of_israel={oob:4d}")

    print()
    print("=" * 70)
    print("DUPLICATE COORDS (same point shared by 3+ stores of a chain)")
    print("=" * 70)
    cur.execute("""
        SELECT rc.name, s.lat, s.lng, COUNT(*) AS n,
               ARRAY_AGG(s.city ORDER BY s.city) AS cities
        FROM store s JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE s.lat IS NOT NULL
        GROUP BY rc.name, s.lat, s.lng HAVING COUNT(*) >= 3
        ORDER BY COUNT(*) DESC LIMIT 25
    """)
    for name, lat, lng, n, cities in cur.fetchall():
        uniq = sorted(set(c for c in cities if c))
        print(f"{name:20s} {lat},{lng}  x{n}  cities={uniq[:6]}")

    print()
    print("=" * 70)
    print("WORST OUT-OF-ISRAEL OFFENDERS (any chain, top 25)")
    print("=" * 70)
    cur.execute("""
        SELECT s.id, rc.name, s.name, s.city, s.address, s.lat, s.lng
        FROM store s JOIN retailer_chain rc ON rc.id = s.chain_id
        WHERE s.lat IS NOT NULL AND
          NOT (s.lat BETWEEN %s AND %s AND s.lng BETWEEN %s AND %s)
        ORDER BY rc.name LIMIT 25
    """, (LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX))
    for sid, chain, name, city, addr, lat, lng in cur.fetchall():
        print(f"[{sid}] {chain} | {name} | city={city!r} | addr={addr!r} | {lat},{lng}")

    conn.close()


if __name__ == "__main__":
    main()
