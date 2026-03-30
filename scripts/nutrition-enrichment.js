const { Client } = require('pg');
const https = require('https');

const DB_URL = 'postgresql://neondb_owner:npg_dE7pyTN8HtWb@ep-nameless-dew-ago5j3zt-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const DELAY_MS = 2000;
const BATCH_SIZE = 500;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', 'Accept': 'text/html' }
    }, (res) => {
      if (res.statusCode === 404) { resolve(null); return; }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function stripTags(s) { return s.replace(/<[^>]+>/g, '').replace(/<!-- -->/g, '').trim(); }

function parseNutritionPage(html) {
  if (!html) return null;
  const result = {
    energy_kcal: null, protein_g: null, carbs_g: null, sugars_g: null,
    fat_g: null, saturated_fat_g: null, trans_fat_g: null, sodium_mg: null,
    fiber_g: null, cholesterol_mg: null, ingredients: null, allergens: null,
    high_saturated_fat: false, high_sugars: false, high_sodium: false,
  };

  const rowRegex = /<tr[^>]*>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/gs;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const label = stripTags(match[1]);
    const val = stripTags(match[2]);
    if (!label || label.includes('רכיב תזונתי') || val === '-' || val === '') continue;
    const num = parseFloat(val.replace(/[^\d.]/g, ''));
    if (isNaN(num)) continue;
    if      (label === 'קלוריות')        result.energy_kcal     = num;
    else if (label === 'חלבון')           result.protein_g       = num;
    else if (label === 'פחמימות')         result.carbs_g         = num;
    else if (label === 'סוכרים')          result.sugars_g        = num;
    else if (label === 'שומן')            result.fat_g           = num;
    else if (label === 'שומן רווי')       result.saturated_fat_g = num;
    else if (label === 'שומן טראנס')      result.trans_fat_g     = num;
    else if (label === 'נתרן')            result.sodium_mg       = num;
    else if (label === 'סיבים תזונתיים') result.fiber_g         = num;
    else if (label === 'כולסטרול')        result.cholesterol_mg  = num;
  }

  const markMatch = html.match(/סימוני מזון<\/h2>([\s\S]*?)(?=<h2|<footer)/);
  if (markMatch) {
    const m = stripTags(markMatch[1]);
    result.high_saturated_fat = m.includes('שומן רווי');
    result.high_sugars        = m.includes('סוכר');
    result.high_sodium        = m.includes('נתרן');
  } else {
    if (result.saturated_fat_g !== null) result.high_saturated_fat = result.saturated_fat_g > 4.0;
    if (result.sugars_g !== null)        result.high_sugars        = result.sugars_g > 13.5;
    if (result.sodium_mg !== null)       result.high_sodium        = result.sodium_mg > 600;
  }

  const ingMatch = html.match(/whitespace-pre-wrap">([\s\S]*?)<\/p>/);
  if (ingMatch) result.ingredients = ingMatch[1].trim().substring(0, 1000);

  const algMatch = html.match(/אלרגנים<\/h2>([\s\S]*?)(?=שאלות נפוצות|<h2|<footer)/);
  if (algMatch) {
    const spans = algMatch[1].match(/<span[^>]*>([\s\S]*?)<\/span>/g) || [];
    result.allergens = spans.map(s => stripTags(s)).filter(Boolean).join(' | ').substring(0, 500);
  }

  return result.energy_kcal !== null ? result : null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const client = new Client(DB_URL);
  await client.connect();
  console.log('✅ מחובר ל-Neon');

  await client.query(`
    ALTER TABLE product
      ADD COLUMN IF NOT EXISTS energy_kcal NUMERIC,
      ADD COLUMN IF NOT EXISTS protein_g NUMERIC,
      ADD COLUMN IF NOT EXISTS carbs_g NUMERIC,
      ADD COLUMN IF NOT EXISTS sugars_g NUMERIC,
      ADD COLUMN IF NOT EXISTS fat_g NUMERIC,
      ADD COLUMN IF NOT EXISTS saturated_fat_g NUMERIC,
      ADD COLUMN IF NOT EXISTS trans_fat_g NUMERIC,
      ADD COLUMN IF NOT EXISTS sodium_mg NUMERIC,
      ADD COLUMN IF NOT EXISTS fiber_g NUMERIC,
      ADD COLUMN IF NOT EXISTS cholesterol_mg NUMERIC,
      ADD COLUMN IF NOT EXISTS ingredients TEXT,
      ADD COLUMN IF NOT EXISTS allergens TEXT,
      ADD COLUMN IF NOT EXISTS high_saturated_fat BOOLEAN,
      ADD COLUMN IF NOT EXISTS high_sugars BOOLEAN,
      ADD COLUMN IF NOT EXISTS high_sodium BOOLEAN,
      ADD COLUMN IF NOT EXISTS nutrition_source TEXT,
      ADD COLUMN IF NOT EXISTS nutrition_updated_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS nutrition_checked BOOLEAN DEFAULT FALSE
  `);
  console.log('✅ עמודות מוכנות');

  const { rows: products } = await client.query(`
    SELECT id, barcode, name, store_count FROM product
    WHERE barcode IS NOT NULL
      AND LENGTH(barcode) >= 8
      AND energy_kcal IS NULL
      AND (nutrition_checked IS NULL OR nutrition_checked = FALSE)
    ORDER BY store_count DESC NULLS LAST
    LIMIT $1
  `, [BATCH_SIZE]);

  console.log(`\n🔍 ${products.length} מוצרים לעיבוד\n`);
  let success = 0, notFound = 0, errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const url = `https://cheapersal.co.il/product/${p.barcode}/nutrition`;
    const label = (p.name || '').substring(0, 28).padEnd(28);
    process.stdout.write(`[${String(i+1).padStart(3)}/${products.length}] ${label} | `);

    try {
      const html = await fetchUrl(url);
      if (!html) {
        process.stdout.write('❌ לא נמצא\n');
        await client.query('UPDATE product SET nutrition_checked=TRUE WHERE id=$1', [p.id]);
        notFound++;
      } else {
        const n = parseNutritionPage(html);
        if (!n) {
          process.stdout.write('⚠️  אין נתונים\n');
          await client.query('UPDATE product SET nutrition_checked=TRUE WHERE id=$1', [p.id]);
          notFound++;
        } else {
          await client.query(`
            UPDATE product SET
              energy_kcal=$1, protein_g=$2, carbs_g=$3, sugars_g=$4, fat_g=$5,
              saturated_fat_g=$6, trans_fat_g=$7, sodium_mg=$8, fiber_g=$9,
              cholesterol_mg=$10, ingredients=$11, allergens=$12,
              high_saturated_fat=$13, high_sugars=$14, high_sodium=$15,
              nutrition_source='cheapersal', nutrition_updated_at=NOW(),
              nutrition_checked=TRUE
            WHERE id=$16
          `, [n.energy_kcal, n.protein_g, n.carbs_g, n.sugars_g, n.fat_g,
              n.saturated_fat_g, n.trans_fat_g, n.sodium_mg, n.fiber_g,
              n.cholesterol_mg, n.ingredients, n.allergens,
              n.high_saturated_fat, n.high_sugars, n.high_sodium, p.id]);
          const flags = [n.high_saturated_fat?'🔴שומן':'', n.high_sugars?'🔴סוכר':'', n.high_sodium?'🔴נתרן':''].filter(Boolean).join(' ') || '✅';
          process.stdout.write(`${n.energy_kcal} kcal | חלבון:${n.protein_g} שומן:${n.fat_g} ${flags}\n`);
          success++;
        }
      }
    } catch(err) {
      process.stdout.write(`💥 ${err.message}\n`);
      errors++;
    }

    if (i < products.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n=============================`);
  console.log(`✅ הצליח:   ${success}`);
  console.log(`❌ לא נמצא: ${notFound}`);
  console.log(`💥 שגיאות:  ${errors}`);
  console.log(`=============================`);
  await client.end();
}

main().catch(err => { console.error('שגיאה:', err); process.exit(1); });
