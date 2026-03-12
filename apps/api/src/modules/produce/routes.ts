import { query } from '../../db.js';

const PRODUCE_SEARCH_TERMS: Record<string, string[]> = {
  tomatoes:      ['עגבני'],
  cucumber:      ['מלפפון'],
  'red pepper':  ['פלפל אדום', 'פלפל קליפורני'],
  'green pepper':['פלפל ירוק'],
  onion:         ['בצל'],
  potato:        ['תפוח אדמה', 'תפו"א'],
  carrot:        ['גזר'],
  zucchini:      ['קישוא'],
  eggplant:      ['חציל'],
  lettuce:       ['חסה'],
  broccoli:      ['ברוקולי'],
  cauliflower:   ['כרובית'],
  cabbage:       ['כרוב'],
  corn:          ['תירס'],
  garlic:        ['שום'],
  'sweet potato':['בטטה'],
  spinach:       ['תרד'],
  pumpkin:       ['דלעת'],
  celery:        ['סלרי'],
  radish:        ['צנונית'],
  apple:         ['תפוח'],
  banana:        ['בננה'],
  orange:        ['תפוז'],
  lemon:         ['לימון'],
  watermelon:    ['אבטיח'],
  melon:         ['מלון'],
  grapes:        ['ענבים', 'ענב'],
  mango:         ['מנגו'],
  strawberry:    ['תות'],
  peach:         ['אפרסק'],
  plum:          ['שזיף'],
  pear:          ['אגס'],
  pomegranate:   ['רימון'],
  kiwi:          ['קיווי'],
  avocado:       ['אבוקדו'],
  clementine:    ['קלמנטינה', 'קלמנטינות'],
  grapefruit:    ['אשכולית'],
  cherry:        ['דובדבן'],
  fig:           ['תאנה'],
  date:          ['תמר'],
  parsley:       ['פטרוזיליה'],
  coriander:     ['כוסברה'],
  mint:          ['נענע'],
  dill:          ['שמיר'],
  basil:         ['בזיליקום'],
};

interface RequestedItem {
  name: string;
  name_he: string;
  quantity: number;
  unit: 'kg' | 'unit';
}

export async function produceRoutes(app: any) {

  app.post('/produce/compare', async (req: any, reply: any) => {
    const { items } = req.body as { items: RequestedItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ error: 'items array is required' });
    }

    type PriceRow = {
      store_id: number;
      store_name: string;
      chain_name: string;
      city: string;
      item_name: string;
      unit_price: number;
    };

    const itemPrices: Array<{ item: RequestedItem; prices: PriceRow[] }> = [];

    for (const item of items) {
      const searchTerms = PRODUCE_SEARCH_TERMS[item.name] || [item.name_he];
      const likeConditions = searchTerms.map((_, i) => `p.name ILIKE $${i + 1}`).join(' OR ');
      const params = searchTerms.map(t => `%${t}%`);

      try {
        const result = await query(
          `SELECT DISTINCT ON (s.id)
            s.id as store_id,
            s.name as store_name,
            rc.name as chain_name,
            s.city,
            p.name as item_name,
            sp.price as unit_price
          FROM product p
          JOIN store_price sp ON sp.product_id = p.id
          JOIN store s ON s.id = sp.store_id
          JOIN retailer_chain rc ON rc.id = s.chain_id
          WHERE (${likeConditions})
            AND sp.price > 0
            AND sp.price < 200
          ORDER BY s.id, sp.price ASC`,
          params
        );
        itemPrices.push({ item, prices: result.rows as PriceRow[] });
      } catch (e) {
        console.error(`[produce] error fetching ${item.name}:`, e);
        itemPrices.push({ item, prices: [] });
      }
    }

    const storeMap = new Map<number, {
      store_id: number;
      store_name: string;
      chain_name: string;
      city: string;
      total_price: number;
      found_items: number;
      item_details: Array<{ name: string; price: number; unit_price: number }>;
    }>();

    for (const { item, prices } of itemPrices) {
      for (const row of prices) {
        if (!storeMap.has(row.store_id)) {
          storeMap.set(row.store_id, {
            store_id: row.store_id,
            store_name: row.store_name,
            chain_name: row.chain_name,
            city: row.city,
            total_price: 0,
            found_items: 0,
            item_details: [],
          });
        }
        const store = storeMap.get(row.store_id)!;
        const linePrice = row.unit_price * item.quantity;
        store.total_price += linePrice;
        store.found_items += 1;
        store.item_details.push({
          name: item.name_he,
          price: Math.round(linePrice * 100) / 100,
          unit_price: Math.round(row.unit_price * 100) / 100,
        });
      }
    }

    const minFoundItems = Math.ceil(items.length * 0.5);

    const stores = Array.from(storeMap.values())
      .filter(s => s.found_items >= minFoundItems)
      .map(s => ({
        ...s,
        total_price: Math.round(s.total_price * 100) / 100,
        total_items: items.length,
      }))
      .sort((a, b) => a.total_price - b.total_price)
      .slice(0, 20);

    return { stores, total_items: items.length };
  });

  app.get('/produce/basket', async () => {
    return {
      items: [
        { name: 'tomatoes',   name_he: 'עגבניות',   quantity: 1,   unit: 'kg' },
        { name: 'cucumber',   name_he: 'מלפפון',    quantity: 1,   unit: 'kg' },
        { name: 'red pepper', name_he: 'פלפל אדום', quantity: 0.5, unit: 'kg' },
        { name: 'onion',      name_he: 'בצל',       quantity: 1,   unit: 'kg' },
        { name: 'potato',     name_he: 'תפוח אדמה',quantity: 1,   unit: 'kg' },
        { name: 'carrot',     name_he: 'גזר',       quantity: 0.5, unit: 'kg' },
        { name: 'apple',      name_he: 'תפוח',      quantity: 1,   unit: 'kg' },
        { name: 'banana',     name_he: 'בננה',      quantity: 1,   unit: 'kg' },
        { name: 'orange',     name_he: 'תפוז',      quantity: 1,   unit: 'kg' },
      ],
    };
  });
}
