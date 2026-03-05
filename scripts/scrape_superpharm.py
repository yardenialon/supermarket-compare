#!/usr/bin/env python3
"""
scrape_superpharm.py - סופרפארם מחירים יומיים
"""
import os, gzip, xml.etree.ElementTree as ET
import psycopg2, requests, time, re
from datetime import datetime, timedelta
from psycopg2.extras import execute_values

DB_URL = os.environ['DATABASE_URL']
BASE_URL = "https://prices.super-pharm.co.il"
CHAIN_NAME = "Super Pharm"
RETAILER_ID = "7290172900007"

def make_session():
    s = requests.Session()
    s.headers.update({
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    })
    return s

def get_file_list(session):
    """מביא רשימת קבצים — מנסה כמה שיטות"""
    # שיטה 1: דף ראשי
    try:
        res = session.get(f"{BASE_URL}/", timeout=30)
        print(f"  status: {res.status_code}, len: {len(res.text)}")
        print(f"  preview: {res.text[:200]}")
        
        files = re.findall(r'((?:PriceFull|StoresFull|Price|Stores)[^\s"\'<>]+\.gz)', res.text)
        if files:
            print(f"  נמצאו {len(files)} קבצים בדף הראשי")
            return files
    except Exception as e:
        print(f"  שגיאה בדף ראשי: {e}")

    # שיטה 2: ניסיון ישיר עם תאריך היום
    today = datetime.now()
    files = []
    for hour in range(7, 10):
        for minute in [0, 7, 8, 30]:
            fname = f"PriceFull{RETAILER_ID}-001-{today.strftime('%Y%m%d')}{hour:02d}{minute:02d}.gz"
            files.append(fname)
    
    print(f"  משתמש בשמות קבצים לפי תאריך: {len(files)} אפשרויות")
    return files

def get_or_create_chain(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM retailer_chain WHERE name=%s", (CHAIN_NAME,))
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO retailer_chain (name) VALUES (%s) RETURNING id", (CHAIN_NAME,))
        row = cur.fetchone()
        conn.commit()
    return row[0]

def parse_stores_xml(xml_content, chain_id, conn):
    cur = conn.cursor()
    root = ET.fromstring(xml_content)
    count = 0
    for store in root.iter('Branch'):
        store_code = store.findtext('StoreId') or ''
        name = store.findtext('StoreName') or ''
        city = store.findtext('City') or ''
        address = store.findtext('Address') or ''
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
    return count

def parse_prices_xml(xml_content, chain_id, conn):
    cur = conn.cursor()
    root = ET.fromstring(xml_content)
    
    store_code = (root.findtext('.//StoreId') or root.findtext('.//storeid') or '').strip()
    if not store_code:
        return 0
    
    cur.execute("SELECT id FROM store WHERE chain_id=%s AND store_code=%s", (chain_id, store_code))
    store_row = cur.fetchone()
    if not store_row:
        # צור סניף חדש
        cur.execute("""
            INSERT INTO store (chain_id, store_code, name) VALUES (%s, %s, %s)
            ON CONFLICT (chain_id, store_code) DO NOTHING RETURNING id
        """, (chain_id, store_code, f"סופרפארם {store_code}"))
        store_row = cur.fetchone()
        if not store_row:
            cur.execute("SELECT id FROM store WHERE chain_id=%s AND store_code=%s", (chain_id, store_code))
            store_row = cur.fetchone()
        conn.commit()
    
    if not store_row:
        return 0
    store_id = store_row[0]
    
    updates = []
    for item in root.iter('Item'):
        barcode = (item.findtext('ItemCode') or '').strip()
        name = (item.findtext('ItemName') or '').strip()
        price_str = (item.findtext('ItemPrice') or '0').strip()
        if not barcode:
            continue
        try:
            price = float(price_str)
        except:
            continue
        if price <= 0 or price > 10000:
            continue
        
        cur.execute("SELECT id FROM product WHERE barcode=%s", (barcode,))
        prod = cur.fetchone()
        if not prod:
            cur.execute("""
                INSERT INTO product (barcode, name) VALUES (%s, %s)
                ON CONFLICT (barcode) DO UPDATE SET name=COALESCE(NULLIF(EXCLUDED.name,''), product.name)
                RETURNING id
            """, (barcode, name))
            prod = cur.fetchone()
        if not prod:
            continue
        updates.append((store_id, prod[0], price, False))
    
    if updates:
        execute_values(cur, """
            INSERT INTO store_price (store_id, product_id, price, is_promo)
            VALUES %s
            ON CONFLICT (store_id, product_id) DO UPDATE SET price=EXCLUDED.price
        """, updates)
        conn.commit()
    return len(updates)

def try_download(session, fname):
    """מנסה להוריד קובץ"""
    url = f"{BASE_URL}/{fname}"
    try:
        res = session.get(url, timeout=60)
        if res.status_code == 200 and len(res.content) > 100:
            return gzip.decompress(res.content).decode('utf-8', errors='replace')
    except:
        pass
    return None

def main():
    session = make_session()
    conn = psycopg2.connect(DB_URL)
    chain_id = get_or_create_chain(conn)
    
    print("מביא רשימת קבצים...")
    files = get_file_list(session)
    
    # StoresFull קודם
    stores_files = [f for f in files if 'StoresFull' in f or 'Stores' in f]
    for fname in stores_files[:1]:
        print(f"מוריד סניפים: {fname}")
        xml = try_download(session, fname)
        if xml:
            count = parse_stores_xml(xml, chain_id, conn)
            print(f"✓ {count} סניפים")
    
    # מחירים
    price_files = [f for f in files if 'PriceFull' in f or 'Price' in f]
    print(f"מעבד {len(price_files)} קבצי מחירים...")
    total = 0
    success = 0
    
    for i, fname in enumerate(price_files):
        xml = try_download(session, fname)
        if xml:
            count = parse_prices_xml(xml, chain_id, conn)
            total += count
            success += 1
            print(f"  [{i+1}] {fname}: {count} מחירים ✓")
        else:
            print(f"  [{i+1}] {fname}: לא זמין")
        time.sleep(0.3)
    
    print(f"\n✅ {success} קבצים, {total} מחירים עודכנו")
    conn.close()

if __name__ == "__main__":
    main()
