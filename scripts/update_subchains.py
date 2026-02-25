#!/usr/bin/env python3
"""
Parse Shufersal Stores XML and update subchain_name + subchain_id in the store table.
Run from repo root: python scripts/update_subchains.py
"""
import os, sys, xml.etree.ElementTree as ET, glob
import psycopg2
from collections import Counter

DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    for line in open('.env'):
        if line.startswith('DATABASE_URL='):
            DB_URL = line.strip().split('=', 1)[1]
            break

if not DB_URL:
    print("ERROR: DATABASE_URL not found"); sys.exit(1)

xml_files = glob.glob("Stores*.xml")
if not xml_files:
    print("ERROR: No Stores*.xml found"); sys.exit(1)
xml_file = xml_files[0]
print(f"Parsing {xml_file}...")

tree = ET.parse(xml_file)
root = tree.getroot()

stores = {}
for store in root.findall('.//STORE'):
    store_id = store.findtext('STOREID', '').strip()
    subchain_id = store.findtext('SUBCHAINID', '').strip()
    subchain_name = store.findtext('SUBCHAINNAME', '').strip()
    if store_id and subchain_name:
        stores[store_id] = (int(subchain_id) if subchain_id.isdigit() else None, subchain_name)

print(f"Found {len(stores)} stores in XML")
subchain_counts = Counter(v[1] for v in stores.values())
print("\nSubchains found:")
for name, count in sorted(subchain_counts.items(), key=lambda x: -x[1]):
    print(f"  {name}: {count} stores")

print("\nConnecting to DB...")
conn = psycopg2.connect(DB_URL, connect_timeout=30)
cur = conn.cursor()

cur.execute("ALTER TABLE store ADD COLUMN IF NOT EXISTS subchain_name text")
cur.execute("ALTER TABLE store ADD COLUMN IF NOT EXISTS subchain_id integer")
conn.commit()
print("Columns ready.")

cur.execute("SELECT id FROM retailer_chain WHERE name = 'Shufersal'")
shufersal_chain_id = cur.fetchone()[0]
print(f"Shufersal chain_id = {shufersal_chain_id}")

cur.execute("SELECT id, store_code FROM store WHERE chain_id = %s", (shufersal_chain_id,))
db_stores = {code: sid for sid, code in cur.fetchall()}
print(f"DB has {len(db_stores)} Shufersal stores")

updated = 0
not_found = 0
for store_code, (subchain_id, subchain_name) in stores.items():
    db_id = db_stores.get(store_code)
    if not db_id and store_code.isdigit():
        db_id = db_stores.get(str(int(store_code)))
    if not db_id:
        not_found += 1
        continue
    cur.execute("UPDATE store SET subchain_id = %s, subchain_name = %s WHERE id = %s",
        (subchain_id, subchain_name, db_id))
    updated += 1

conn.commit()
print(f"\nDone! Updated: {updated}, Not found in DB: {not_found}")

cur.execute("""
    SELECT subchain_name, subchain_id, COUNT(*) as count
    FROM store WHERE chain_id = %s AND subchain_name IS NOT NULL
    GROUP BY subchain_name, subchain_id ORDER BY count DESC
""", (shufersal_chain_id,))
print("\nResult in DB:")
for r in cur.fetchall():
    print(f"  [{r[1]}] {r[0]}: {r[2]} stores")

conn.close()
