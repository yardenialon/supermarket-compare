import { FastifyInstance } from 'fastify';
import { pool } from '../../db.js';

const DOCUPIPE_KEY = 'IPDIfJqUrBMFIhkGD610onGyL5l1';

export async function receiptRoutes(app: FastifyInstance) {
  app.post('/receipt', async (req, reply) => {
    const { base64, filename } = req.body as any;

    // 1. שלח ל-Docupipe
    const uploadRes = await fetch('https://app.docupipe.ai/document', {
      method: 'POST',
      headers: { 'X-API-Key': DOCUPIPE_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ document: { base64, filename: filename || 'receipt.jpg' } }),
    });
    const uploadText = await uploadRes.text();
    console.log('Docupipe upload:', uploadRes.status, uploadText.substring(0, 200));
    if (!uploadRes.ok) return reply.code(500).send({ error: 'שגיאה: ' + uploadText });
    const uploadData = JSON.parse(uploadText) as any;

    const { jobId, documentId } = uploadData;

    // 2. poll עד שהעבודה מסתיימת
    let status = 'processing';
    let attempts = 0;
    let wait = 2000;
    while (status === 'processing' && attempts < 10) {
      await new Promise(r => setTimeout(r, wait));
      const jobRes = await fetch(`https://app.docupipe.ai/job/${jobId}`, {
        headers: { 'X-API-Key': DOCUPIPE_KEY, 'accept': 'application/json' },
      });
      const jobData = await jobRes.json() as any;
      status = jobData.status;
      wait = Math.min(wait * 2, 10000);
      attempts++;
    }
    if (status !== 'completed') return reply.code(500).send({ error: 'עיבוד הקבלה נכשל' });

    // 3. שלוף תוצאות
    const docRes = await fetch(`https://app.docupipe.ai/document/${documentId}/content`, {
      headers: { 'X-API-Key': DOCUPIPE_KEY, 'accept': 'application/json' },
    });
    const docData = await docRes.json() as any;
    const text = docData?.pages?.[0]?.text || docData?.text || '';

    // 4. חלץ מוצרים ומחירים מהטקסט
    const lines = text.split('\n').filter((l: string) => l.trim());
    const items: { name: string; price: number }[] = [];
    for (const line of lines) {
      const match = line.match(/(.+?)\s+(\d+\.?\d*)\s*$/);
      if (match) {
        const price = parseFloat(match[2]);
        if (price > 0 && price < 1000) {
          items.push({ name: match[1].trim(), price });
        }
      }
    }

    // 5. חפש כל מוצר ב-DB
    let totalPaid = items.reduce((s, i) => s + i.price, 0);
    let totalCheapest = 0;
    let cheapestStore = '';

    for (const item of items) {
      const { rows } = await pool.query(
        `SELECT sp.price, c.name as chain_name 
         FROM store_price sp JOIN store s ON sp.store_id = s.id JOIN chain c ON s.chain_id = c.id
         JOIN product p ON sp.barcode = p.barcode
         WHERE p.name ILIKE $1 ORDER BY sp.price ASC LIMIT 1`,
        [`%${item.name.substring(0, 15)}%`]
      );
      if (rows.length > 0) {
        totalCheapest += rows[0].price;
        cheapestStore = rows[0].chain_name;
      } else {
        totalCheapest += item.price;
      }
    }

    return { items, totalPaid, savings: totalPaid - totalCheapest, cheapestStore };
  });
}
