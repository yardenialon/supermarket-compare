#!/usr/bin/env python3
"""
scrape_superpharm.py
מוריד קבצי מחירים של סופרפארם ומעדכן את ה-DB
"""
import os, sys, gzip, xml.etree.ElementTree as ET
import psycopg2, requests, time, re
from datetime import datetime, timedelta

DB_URL = os.environ['DATABASE_URL']
BASE_URL = "https://prices.super-pharm.co.il"
CHAIN_NAME = "Super Pharm"

def get_file_list(session):
    """מביא רשימת קבצים מהאתר"""
    res = session.get(f"{BASE_URL}/", timeout=30)
    res.raise_for_status()
    # מחפש קישורי gz
    files = re.findall(r'((?:PriceFull|StoresFull)\d+-\d+-\d+\.gz)', res.text)
    return list(set(files))

def parse_stores_xml(xml_content, conn):
    """מעדכן סניפים ב-DB"""
    cur = conn.cursor()
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (CHAIN_NAME,))
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO retailer_chain (name) VALUES (%s) RETURNING id", (CHAIN_NAME,))
        row = cur.fetchone()
    chain_id = row[0]

    root = ET.fromstring(xml_content)
    ns = {'ns': root.tag.split('}')[0].lstrip('{')} if '}' in root.tag else {}
    
    count = 0
    for store in root.iter('Branch' if not ns else f"{{{ns.get('ns', '')}}}Branch"):
        store_code = store.findtext('StoreId') or store.findtext('storeid', '')
        name = store.findtext('StoreName') or store.findtext('storename', '')
        city = store.findtext('City') or store.findtext('city', '')
        address = store.findtext('Address') or store.findtext('address', '')
        
        if not store_code:
            continue
            
        cur.execute("""
            INSERT INTO store (chain_id, store_code, name, city, address)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (chain_id, store_code) DO UPDATE 
            SET name=EXCLUDED.name, city=EXCLUDED.city, address=EXCLUDED.address
        """, (chain_id, store_code, name, city, address))
        count += 1
    
    conn.commit()
    print(f"✓ {count} סניפים עודכנו")
    return chain_id

def parse_prices_xml(xml_content, chain_id, conn):
    """מעדכן מחירים ב-DB"""
    cur = conn.cursor()
    root = ET.fromstring(xml_content)
    
    store_code = root.findtext('.//StoreId') or root.findtext('.//storeid', '')
    if not store_code:
        return 0
    
    cur.execute("SELECT id FROM store WHERE chain_id=%s AND store_code=%s", (chain_id, store_code))
    store_row = cur.fetchone()
    if not store_row:
        return 0
    store_id = store_row[0]
    
    updates = []
    for item in root.iter('Item'):
        barcode = item.findtext('ItemCode') or item.findtext('itemcode', '')
        name = item.findtext('ItemName') or item.findtext('itemname', '')
        price_str = item.findtext('ItemPrice') or item.findtext('itemprice', '0')
        
        if not barcode or not price_str:
            continue
        try:
            price = float(price_str)
        except:
            continue
        if price <= 0 or price > 10000:
            continue
            
        # מצא או צור מוצר
        cur.execute("SELECT id FROM product WHERE barcode=%s", (barcode,))
        prod = cur.fetchone()
        if not prod:
            cur.execute("""
                INSERT INTO product (barcode, name) VALUES (%s, %s)
                ON CONFLICT (barcode) DO UPDATE SET name=EXCLUDED.name
                RETURNING id
            """, (barcode, name))
            prod = cur.fetchone()
        if not prod:
            continue
        product_id = prod[0]
        
        updates.append((store_id, product_id, price, False))
    
    if updates:
        from psycopg2.extras import execute_values
        execute_values(cur, """
            INSERT INTO store_price (store_id, product_id, price, is_promo)
            VALUES %s
            ON CONFLICT (store_id, product_id) DO UPDATE SET price=EXCLUDED.price
        """, updates)
        conn.commit()
    
    return len(updates)

def main():
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8',
        'Referer': BASE_URL,
    })
    
    conn = psycopg2.connect(DB_URL)
    
    print("מביא רשימת קבצים...")
    files = get_file_list(session)
    print(f"נמצאו {len(files)} קבצים")
    
    chain_id = None
    total_prices = 0
    
    # קודם StoresFull
    stores_files = [f for f in files if f.startswith('StoresFull')]
    for fname in stores_files[:1]:
        print(f"מוריד {fname}...")
        res = session.get(f"{BASE_URL}/{fname}", timeout=60)
        xml = gzip.decompress(res.content).decode('utf-8', errors='replace')
        chain_id = parse_stores_xml(xml, conn)
        time.sleep(1)
    
    if not chain_id:
        # אם אין StoresFull, קח chain_id ישירות
        cur = conn.cursor()
        cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (CHAIN_NAME,))
        row = cur.fetchone()
        if row:
            chain_id = row[0]
    
    # אחר כך PriceFull
    price_files = [f for f in files if f.startswith('PriceFull')]
    print(f"מעבד {len(price_files)} קבצי מחירים...")
    
    for i, fname in enumerate(price_files):
        try:
            res = session.get(f"{BASE_URL}/{fname}", timeout=60)
            xml = gzip.decompress(res.content).decode('utf-8', errors='replace')
            count = parse_prices_xml(xml, chain_id, conn)
            total_prices += count
            print(f"  [{i+1}/{len(price_files)}] {fname}: {count} מחירים")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ✗ {fname}: {e}")
    
    print(f"\n✅ סה\"כ: {total_prices} מחירים עודכנו")
    conn.close()

if __name__ == "__main__":
    main()
