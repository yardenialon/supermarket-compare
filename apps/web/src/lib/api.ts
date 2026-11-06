const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function f(p: string, o?: RequestInit): Promise<any> {
  const r = await fetch(B + p, {
    ...o,
    headers: { 'Content-Type': 'application/json', ...(o || {}).headers }
  });
  if (r.ok === false) throw new Error(String(r.status));
  return r.json();
}

// AbortController for search — cancels previous request when a new one starts
let searchController: AbortController | null = null;

export const api = {
  search: (q: string, mode: string = 'name') => {
    // Cancel previous search request if still in flight
    if (searchController) {
      searchController.abort();
    }
    searchController = new AbortController();

    return fetch(B + '/search?q=' + encodeURIComponent(q) + '&mode=' + mode, {
      signal: searchController.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
  },

  prices: (id: number, lat?: number, lng?: number, radiusKm?: number) =>
    f('/product/' + id + '/prices?limit=50' + (lat && lng ? `&lat=${lat}&lng=${lng}` : '') + (lat && lng && radiusKm ? `&radius=${radiusKm}` : '')),

  image: (id: number) =>
    f('/product/' + id + '/image'),

  list: (items: { productId: number; qty: number }[], lat?: number, lng?: number, radiusKm?: number) =>
    // topN 12 (not 5): stores with a smaller assortment (e.g. סופר ברקת,
    // ~6K items) often miss one basket item, sort below the complete stores
    // and used to vanish from the results entirely — the UI already shows
    // "חסרים X" per store, so let the user see them and decide
    f('/list', { method: 'POST', body: JSON.stringify({ items, topN: 12, lat, lng, radiusKm }) }),
};

export const dealsApi = {
  chains: () => f('/deals/chains'),
  categories: () => f('/deals/categories'),
  list: (chain?: string, limit = 25, offset = 0, lat?: number, lng?: number, category?: string, radius = 3) =>
    f('/deals?' + new URLSearchParams({ ...(chain ? { chain } : {}), ...(category ? { category } : {}), limit: String(limit), offset: String(offset), ...(lat && lng ? { lat: String(lat), lng: String(lng), radius: String(radius) } : {}) }).toString()),
  items: (promotionId: number) =>
    f('/deals/' + promotionId + '/items'),
  top: (limit = 20, lat?: number, lng?: number) =>
    f('/deals/top?limit=' + limit + (lat && lng ? `&lat=${lat}&lng=${lng}` : '')),
};
