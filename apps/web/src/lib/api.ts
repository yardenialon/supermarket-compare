const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
async function f(p: string, o?: RequestInit): Promise<any> {
  const r = await fetch(B + p, {
    ...o,
    headers: { 'Content-Type': 'application/json', ...(o || {}).headers }
  });
  if (r.ok === false) throw new Error(String(r.status));
  return r.json();
}
export const api = {
  search: (q: string, mode: string = 'name') =>
    f('/search?q=' + encodeURIComponent(q) + '&mode=' + mode),
  prices: (id: number, lat?: number, lng?: number) =>
    f('/product/' + id + '/prices?limit=50' + (lat && lng ? `&lat=${lat}&lng=${lng}` : '')),
  image: (id: number) =>
    f('/product/' + id + '/image'),
  list: (items: { productId: number; qty: number }[], lat?: number, lng?: number, radiusKm?: number) =>
    f('/list', { method: 'POST', body: JSON.stringify({ items, topN: 5, lat, lng, radiusKm }) }),
};
