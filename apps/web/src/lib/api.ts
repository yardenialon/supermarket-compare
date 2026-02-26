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

  prices: (id: number, lat?: number, lng?: number) =>
    f('/product/' + id + '/prices?limit=50' + (lat && lng ? `&lat=${lat}&lng=${lng}` : '')),

  image: (id: number) =>
    f('/product/' + id + '/image'),

  list: (items: { productId: number; qty: number }[], lat?: number, lng?: number, radiusKm?: number) =>
    f('/list', { method: 'POST', body: JSON.stringify({ items, topN: 5, lat, lng, radiusKm }) }),
};

export const dealsApi = {
  chains: () => f('/deals/chains'),
  list: (chain?: string, limit = 50, offset = 0) =>
    f('/deals?' + new URLSearchParams({ ...(chain ? { chain } : {}), limit: String(limit), offset: String(offset) }).toString()),
  items: (promotionId: number) =>
    f('/deals/' + promotionId + '/items'),
};
