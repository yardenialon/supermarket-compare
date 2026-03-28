'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const DEFAULT_PRODUCTS: Record<number, Product[]> = {
  "0": [
    {
      "id": 422,
      "name": "חלב",
      "barcode": "7290000181103",
      "storeCount": 1553,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000181103.jpg",
      "minPrice": 11.9,
      "brand": ""
    },
    {
      "id": 449,
      "name": "פרה קראנצ שוקולד חלב",
      "barcode": "7290105363572",
      "storeCount": 1545,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/UWR50_Z_P_7290105363572_1.png",
      "minPrice": 4.9,
      "brand": ""
    },
    {
      "id": 245,
      "name": "חלב תנובה טרי 1 ליטר",
      "barcode": "7290004131074",
      "storeCount": 1447,
      "imageUrl": "https://img.rami-levy.co.il/product/7290004131074/small.jpg",
      "minPrice": 5.9,
      "brand": ""
    },
    {
      "id": 456,
      "name": "פריכיות שוקולד חלב",
      "barcode": "7290106526822",
      "storeCount": 1470,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2020/09/7290106526822-600.jpg",
      "minPrice": 6.9,
      "brand": ""
    },
    {
      "id": 427,
      "name": "שוקולד קרם חלב מגדים",
      "barcode": "7290003903955",
      "storeCount": 1402,
      "imageUrl": "https://img.rami-levy.co.il/product/7290003903955/small.jpg",
      "minPrice": 4.9,
      "brand": ""
    }
  ],
  "1": [
    {
      "id": 366,
      "name": "לחם אחיד פרוס אנגל",
      "barcode": "7290018500361",
      "storeCount": 1200,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290018500361-878035/7290018500361/2024-12-26T09-44-33-106Z.jpg",
      "minPrice": 5.2,
      "brand": ""
    }
  ],
  "2": [
    {
      "id": 181921,
      "name": "עוף שלם טרי",
      "barcode": "7290000922591",
      "storeCount": 127,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290104343292.jpg",
      "minPrice": 18.9,
      "brand": ""
    }
  ],
  "3": [
    {
      "id": 434,
      "name": "שמן זית קלאסי 750 מל",
      "barcode": "7290010429554",
      "storeCount": 1082,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290010429554-922224/7290010429554/2025-02-18T11-24-54-507Z.jpg",
      "minPrice": 28.9,
      "brand": ""
    }
  ],
  "4": [
    {
      "id": 629,
      "name": "אורז פרסי סוגת 1 קג",
      "barcode": "7290000211442",
      "storeCount": 1412,
      "imageUrl": "https://www.carmella.co.il/wp-content/uploads/2019/05/7290000211442.jpg",
      "minPrice": 9.9,
      "brand": ""
    },
    {
      "id": 486,
      "name": "פריכיות חומוס אורז",
      "barcode": "7290112335500",
      "storeCount": 1126,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/011/233/5500/front_en.3.400.jpg",
      "minPrice": 9.3,
      "brand": ""
    },
    {
      "id": 822,
      "name": "אורז פרסי דוו",
      "barcode": "7290108509700",
      "storeCount": 962,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/UXP48_Z_P_7290108509700_1.png",
      "minPrice": 8.4,
      "brand": ""
    },
    {
      "id": 5904,
      "name": "אורז סושי 1 קג",
      "barcode": "7290100701157",
      "storeCount": 825,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/NVA40_Z_P_7290100701157_1.png",
      "minPrice": 9.9,
      "brand": ""
    },
    {
      "id": 628,
      "name": "אורז מלא 1 קג",
      "barcode": "7290000211312",
      "storeCount": 796,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1540/large/7290000211312-200668/7290000211312/2024-02-16T22-17-08-362Z.jpg",
      "minPrice": 7.6,
      "brand": ""
    }
  ],
  "5": [
    {
      "id": 128,
      "name": "קוקה קולה פחית 330 מל",
      "barcode": "7290011017866",
      "storeCount": 1413,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2021/02/7290011017866.jpg",
      "minPrice": 3.4,
      "brand": ""
    },
    {
      "id": 126,
      "name": "קולה ZERO בקבוק 0.5",
      "barcode": "7290008909853",
      "storeCount": 1390,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2021/02/7290008909853.jpg",
      "minPrice": 2.9,
      "brand": ""
    },
    {
      "id": 123,
      "name": "קולה 0.5 ליטר",
      "barcode": "7290001594155",
      "storeCount": 1331,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2021/02/7290001594155.jpg",
      "minPrice": 2.9,
      "brand": ""
    },
    {
      "id": 130,
      "name": "קוקה קולה מארז שישיה",
      "barcode": "7290011018832",
      "storeCount": 1310,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/ZQV42_Z_P_7290011018832_1.png",
      "minPrice": 17.8,
      "brand": ""
    },
    {
      "id": 4885,
      "name": "פפסי קולה 1.5 ליטר",
      "barcode": "7290000136141",
      "storeCount": 944,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290000136141-947805/7290000136141/2025-10-05T11-05-44-843Z.jpg",
      "minPrice": 5.3,
      "brand": ""
    }
  ],
  "6": [
    {
      "id": 5607,
      "name": "במבה במילוי נוגט 60 גרם",
      "barcode": "7290100687109",
      "storeCount": 1599,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/30/large/7290100687109-1004820/7290100687109/2025-08-15T11-13-41-414Z.jpg",
      "minPrice": 3.5,
      "brand": ""
    },
    {
      "id": 5462,
      "name": "במבה מתוקה",
      "barcode": "7290000066295",
      "storeCount": 1364,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290000066295-1003643/7290000066295/2025-08-14T07-25-29-545Z.jpg",
      "minPrice": 2.1,
      "brand": ""
    },
    {
      "id": 1843,
      "name": "במבה מאנצ ברביקיו 60 גרם",
      "barcode": "7290118427223",
      "storeCount": 1277,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290118427223.jpg",
      "minPrice": 3.5,
      "brand": ""
    },
    {
      "id": 7571,
      "name": "במבה מארז 10x25 גרם",
      "barcode": "7290105693341",
      "storeCount": 1246,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290105693341-1003805/7290105693341/2025-08-14T22-12-24-726Z.jpg",
      "minPrice": 12.1,
      "brand": ""
    },
    {
      "id": 1552,
      "name": "במבה קלאסי 200 גרם",
      "barcode": "7290104508943",
      "storeCount": 1227,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290104508943-998788/7290104508943/2025-08-03T18-21-43-635Z.jpg",
      "minPrice": 7.5,
      "brand": ""
    },
    {
      "id": 5463,
      "name": "במבה 80 גרם",
      "barcode": "7290000066318",
      "storeCount": 1119,
      "imageUrl": "https://guluten.b1.market/wp-content/uploads/sites/2/2022/11/7290000066318.jpg",
      "minPrice": 3.1,
      "brand": ""
    }
  ],
  "7": [
    {
      "id": 237,
      "name": "גבינה לבנה 5% 500 גרם",
      "barcode": "7290004127800",
      "storeCount": 1362,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290004127800.jpg",
      "minPrice": 9.5,
      "brand": ""
    },
    {
      "id": 71,
      "name": "גבינה לבנה 250 גרם 5%",
      "barcode": "7290000474502",
      "storeCount": 1299,
      "imageUrl": "https://schnellers.co.il/wp-content/uploads/2025/03/7290000474502.jpg",
      "minPrice": 4.7,
      "brand": ""
    },
    {
      "id": 194,
      "name": "גבינה לבנה 5% 250 גרם",
      "barcode": "7290000048185",
      "storeCount": 1287,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsscv8a2UVg5IMS_8WE30Kv64fToQ7nPaYyw&s",
      "minPrice": 4.75,
      "brand": ""
    },
    {
      "id": 195,
      "name": "גבינה לבנה 9% 250 גרם",
      "barcode": "7290000048192",
      "storeCount": 1233,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290000048192-828994/7290000048192/2023-08-16T18-03-06-264Z.jpg",
      "minPrice": 4.8,
      "brand": ""
    },
    {
      "id": 99,
      "name": "גבינה מותכת 100 גרם",
      "barcode": "7290102397891",
      "storeCount": 1123,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290102397891-1013766/7290102397891/2026-02-13T02-57-15-444Z.jpg",
      "minPrice": 7.0,
      "brand": ""
    }
  ],
  "8": [
    {
      "id": 1448,
      "name": "ביצים 12 יח גדול",
      "barcode": "7290001201589",
      "storeCount": 813,
      "imageUrl": "https://img.rami-levy.co.il/product/7290001201589/361918/medium.jpg",
      "minPrice": 11.3,
      "brand": ""
    },
    {
      "id": 1449,
      "name": "ביצים 12 יח בינוני",
      "barcode": "7290001201596",
      "storeCount": 800,
      "imageUrl": "https://img.rami-levy.co.il/product/7290001201596/361919/medium.jpg",
      "minPrice": 10.4,
      "brand": ""
    },
    {
      "id": 5975,
      "name": "ביצים 18 יח גדול",
      "barcode": "7290001201602",
      "storeCount": 452,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290001201602.jpg",
      "minPrice": 16.95,
      "brand": ""
    },
    {
      "id": 1783,
      "name": "ביצים אומגה 12 יח",
      "barcode": "7290001201855",
      "storeCount": 418,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290001201855.jpg",
      "minPrice": 16.9,
      "brand": ""
    },
    {
      "id": 6019,
      "name": "ביצים 18 יח בינוני",
      "barcode": "7290001201619",
      "storeCount": 409,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290001201619.jpg",
      "minPrice": 15.6,
      "brand": ""
    }
  ],
  "9": [
    {
      "id": 440,
      "name": "קפסולות קפה עשיר 14",
      "barcode": "7290101551027",
      "storeCount": 1468,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290101551027.jpg",
      "minPrice": 11.0,
      "brand": ""
    },
    {
      "id": 419,
      "name": "קפה נמס עלית 200 גרם",
      "barcode": "7290000176420",
      "storeCount": 1399,
      "imageUrl": "https://price-api.additlist.com/images/catalog/carrefour/7290000176420.jpg",
      "minPrice": 19.9,
      "brand": ""
    },
    {
      "id": 1134,
      "name": "אייס קפה 1 ליטר",
      "barcode": "7290003029907",
      "storeCount": 1372,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1492/large/7290003029907-1017855/7290003029907/2025-12-17T06-38-35-814Z.jpg",
      "minPrice": 10.2,
      "brand": ""
    },
    {
      "id": 14710,
      "name": "קפה טורקי 200 גרם",
      "barcode": "7290005201882",
      "storeCount": 1264,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2020/12/7290005201882.jpg",
      "minPrice": 13.6,
      "brand": ""
    },
    {
      "id": 1535,
      "name": "נס קפה רד מאג 200 גרם",
      "barcode": "7290000061764",
      "storeCount": 1191,
      "imageUrl": "https://shop.nestle-coffee.co.il/cdn/shop/files/12329674_7290000061764_1200x1200_crop_center.png?v=1718712228",
      "minPrice": 16.2,
      "brand": ""
    }
  ]
};

const CATEGORIES = [
  { label: 'חלב וביצים', emoji: '🥛', q: 'חלב' },
  { label: 'לחם ואפייה', emoji: '🍞', q: 'לחם' },
  { label: 'בשר ועוף', emoji: '🥩', q: 'עוף' },
  { label: 'ירקות', emoji: '🥕', q: 'עגבניות' },
  { label: 'שמן ותבלינים', emoji: '🫒', q: 'שמן' },
  { label: 'אורז ופסטה', emoji: '🍚', q: 'אורז' },
  { label: 'שתייה', emoji: '🥤', q: 'קולה' },
  { label: 'חטיפים', emoji: '🍫', q: 'במבה' },
  { label: 'גבינות', emoji: '🧀', q: 'גבינה' },
  { label: 'קפה ותה', emoji: '☕', q: 'קפה' },
];

interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  minPrice: number | null;
  storeCount: number;
  imageUrl?: string | null;
}

function ProductImg({ name, imageUrl, size = 52 }: { name: string; imageUrl?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err) return (
    <div className="rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-2xl" style={{ width: size, height: size }}>📦</div>
  );
  return (
    <img src={imageUrl} alt={name} onError={() => setErr(true)}
      className="rounded-xl object-contain bg-gray-50 flex-shrink-0"
      style={{ width: size, height: size }} />
  );
}

export default function QuickAddProducts({ onAdd }: { onAdd: (p: Product) => void }) {
  const [activeCat, setActiveCat] = useState(0);
  const [cache, setCache] = useState<Record<number, Product[]>>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const fetchCategory = useCallback(async (idx: number) => {
    if (cache[idx] && cache[idx].length > 1) return; // טוען רק אם יש יותר ממוצר ברירת מחדל אחד
    const cat = CATEGORIES[idx];
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(cat.q)}&limit=20`);
      const d = await res.json();
      const sorted = (d.results || []).sort(
        (a: Product, b: Product) => (b.storeCount || 0) - (a.storeCount || 0)
      );
      setCache(prev => ({ ...prev, [idx]: sorted }));
    } catch {}
  }, [cache]);

  // טוען קטגוריה ראשונה מיד + pre-load שניה
  useEffect(() => {
    fetchCategory(0);
    fetchCategory(1);
  }, []);

  useEffect(() => {
    if (!cache[activeCat]) {
      setLoading(true);
      fetchCategory(activeCat).finally(() => setLoading(false));
    }
    // pre-load הבא
    if (activeCat + 1 < CATEGORIES.length) fetchCategory(activeCat + 1);
    // reset slider position
    if (sliderRef.current) sliderRef.current.scrollLeft = 0;
  }, [activeCat]);

  useEffect(() => {
    if (cache[activeCat]) setLoading(false);
  }, [cache, activeCat]);

  const updateScrollState = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    // ב-RTL: שמאל = קדימה (מספרים חיוביים), ימין = אחורה (מספרים שליליים)
    sliderRef.current.scrollBy({ left: dir === 'left' ? 240 : -240, behavior: 'smooth' });
  };

  const handleAdd = (p: Product) => {
    onAdd(p);
    setAdded(prev => new Set([...prev, p.id]));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 2000);
  };

  const products = cache[activeCat] || [];

  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      <p className="text-[11px] font-semibold text-gray-400 mb-2.5 uppercase tracking-wide">הוסיפו מוצרי בסיס לסל</p>

      {/* קטגוריות */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat, i) => (
          <button key={cat.label} onClick={() => setActiveCat(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
              activeCat === i
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100'
                : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-300'
            }`}>
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* סליידר מוצרים */}
      <div className="relative">
        {/* Fade שמאל */}
        {canScrollLeft && (
          <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{background: 'linear-gradient(to left, transparent, white)'}} />
        )}
        {/* Fade ימין */}
        {canScrollRight && (
          <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{background: 'linear-gradient(to right, transparent, white)'}} />
        )}

        {/* חץ שמאל */}
        {canScrollLeft && (
          <button onClick={() => scroll('left')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-all -mr-2">
            ‹
          </button>
        )}
        {/* חץ ימין */}
        {canScrollRight && (
          <button onClick={() => scroll('right')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-all -ml-2">
            ›
          </button>
        )}

        {loading && !products.length ? (
          <div className="flex gap-3 overflow-hidden pb-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex-shrink-0 bg-gray-100 rounded-2xl animate-pulse" style={{width:120,height:170}} />
            ))}
          </div>
        ) : (
          <div ref={sliderRef} onScroll={updateScrollState}
            className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none', scrollBehavior:'smooth'}}>
            {products.map(p => (
              <div key={p.id}
                className="flex-shrink-0 bg-white rounded-2xl border-2 border-gray-100 p-2.5 flex flex-col items-center gap-1.5 hover:border-emerald-200 transition-all"
                style={{width:120}}>
                <ProductImg name={p.name} imageUrl={p.imageUrl} size={52} />
                <p className="text-[11px] font-medium text-gray-800 text-center leading-tight line-clamp-2 w-full flex-1">{p.name}</p>
                {p.minPrice && <p className="text-[10px] text-emerald-600 font-bold">מ-₪{Number(p.minPrice).toFixed(2)}</p>}
                <button onClick={() => handleAdd(p)}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    added.has(p.id)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white'
                  }`}>
                  {added.has(p.id) ? '✓ נוסף' : '+ לסל'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
