const B = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
async function f(p, o) {
  const r = await fetch(B+p, {...o, headers:{'Content-Type':'application/json',...(o||{}).headers}});
  if (r.ok === false) throw new Error(String(r.status));
  return r.json();
}
export const api = {
  search: (q, mode) => f('/search?q='+encodeURIComponent(q)+'&mode='+(mode||'name')),
  prices: (id) => f('/product/'+id+'/prices?limit=50'),
};
