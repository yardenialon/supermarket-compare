// Shared chain registry for SEO pages (/compare/*, /deals/*, sitemap, footer).
// `name` must match retailer_chain.name in the API; `slug` is the URL-safe identifier.
export interface ChainInfo {
  slug: string;
  name: string;
  he: string;
}

export const MAJOR_CHAINS: ChainInfo[] = [
  { slug: "shufersal",     name: "Shufersal",     he: "שופרסל" },
  { slug: "rami-levy",     name: "Rami Levy",     he: "רמי לוי" },
  { slug: "osher-ad",      name: "Osher Ad",      he: "אושר עד" },
  { slug: "victory",       name: "Victory",       he: "ויקטורי" },
  { slug: "carrefour",     name: "Carrefour",     he: "קרפור" },
  { slug: "yochananof",    name: "Yochananof",    he: "יוחננוף" },
  { slug: "tiv-taam",      name: "Tiv Taam",      he: "טיב טעם" },
  { slug: "hazi-hinam",    name: "Hazi Hinam",    he: "חצי חינם" },
  { slug: "yayno-bitan",   name: "Yayno Bitan",   he: "יינות ביתן" },
  { slug: "keshet-taamim", name: "Keshet Taamim", he: "קשת טעמים" },
  { slug: "freshmarket",   name: "Freshmarket",   he: "פרשמרקט" },
  { slug: "mahsani-ashuk", name: "Mahsani Ashuk", he: "מחסני השוק" },
  { slug: "king-store",    name: "King Store",    he: "קינג סטור" },
  { slug: "zol-vebegadol", name: "Zol Vebegadol", he: "זול ובגדול" },
  { slug: "netiv-hased",   name: "Netiv Hased",   he: "נתיב החסד" },
  { slug: "super-yuda",    name: "Super Yuda",    he: "סופר יודה" },
];

export const chainBySlug = (slug: string): ChainInfo | undefined =>
  MAJOR_CHAINS.find((c) => c.slug === slug);

export const chainByName = (name: string): ChainInfo | undefined =>
  MAJOR_CHAINS.find((c) => c.name === name);

// Canonical pair slug: the two chains in MAJOR_CHAINS order, e.g. "shufersal-vs-rami-levy".
// Only pairs in this order exist; the reverse order 404s (one canonical URL per pair).
export function comparePairs(): { slug: string; a: ChainInfo; b: ChainInfo }[] {
  const pairs: { slug: string; a: ChainInfo; b: ChainInfo }[] = [];
  for (let i = 0; i < MAJOR_CHAINS.length; i++) {
    for (let j = i + 1; j < MAJOR_CHAINS.length; j++) {
      pairs.push({ slug: `${MAJOR_CHAINS[i].slug}-vs-${MAJOR_CHAINS[j].slug}`, a: MAJOR_CHAINS[i], b: MAJOR_CHAINS[j] });
    }
  }
  return pairs;
}

// Parse "a-vs-b" back into the two chains. Returns null for unknown slugs,
// and marks reversed order so the page can redirect to the canonical URL.
export function parseCompareSlug(slug: string): { a: ChainInfo; b: ChainInfo; reversed: boolean } | null {
  const idx = slug.indexOf("-vs-");
  if (idx === -1) return null;
  const left = chainBySlug(slug.slice(0, idx));
  const right = chainBySlug(slug.slice(idx + 4));
  if (!left || !right || left.slug === right.slug) return null;
  const iL = MAJOR_CHAINS.indexOf(left);
  const iR = MAJOR_CHAINS.indexOf(right);
  return iL < iR ? { a: left, b: right, reversed: false } : { a: right, b: left, reversed: true };
}
