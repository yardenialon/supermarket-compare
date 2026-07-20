import { NextResponse } from "next/server";
import { comparePairs, MAJOR_CHAINS } from "@/lib/chains";
import { CITIES } from "@/lib/cities";
import { STAPLES } from "@/lib/staples";
const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const PAGE_SIZE = 10000;
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  try {
    // Sitemap index
    if (!searchParams.has("page")) {
      const countRes = await fetch(`${API}/products/sitemap/count`, { next: { revalidate: 86400 } });
      const { count } = await countRes.json();
      const pages = Math.ceil(count / PAGE_SIZE);
      const sitemaps = Array.from({ length: pages }, (_, i) => `
  <sitemap>
    <loc>https://savy.co.il/sitemap?page=${i}</loc>
  </sitemap>`).join("");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://savy.co.il/sitemap?page=categories</loc>
  </sitemap>
  <sitemap>
    <loc>https://savy.co.il/sitemap?page=chains</loc>
  </sitemap>${sitemaps}
</sitemapindex>`;
      return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
    }

    // Chains sitemap
    if (pageParam === "chains") {
      const chainsRes = await fetch(`${API}/chains`, { next: { revalidate: 86400 } });
      const chainsData = await chainsRes.json();
      const today = new Date().toISOString().split("T")[0];
      const urls = chainsData.chains
        .filter((c: any) => c.storeCount > 0)
        .map((c: any) => `
  <url>
    <loc>https://savy.co.il/chain/${encodeURIComponent(c.name)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
      return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
    }

    // Categories sitemap
    if (pageParam === "categories") {
      const catRes = await fetch(`${API}/categories`, { next: { revalidate: 86400 } });
      const cats = await catRes.json();
      const today = new Date().toISOString().split("T")[0];
      const urls = cats.map((c: any) => `
  <url>
    <loc>https://savy.co.il/category/${encodeURIComponent(c.category)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`).join("");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
      return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
    }

    // Products sitemap page
    const page = parseInt(pageParam || "0");
    const res = await fetch(`${API}/products/sitemap?page=${page}&limit=${PAGE_SIZE}`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(25000) });
    const ids = await res.json();
    const today = new Date().toISOString().split("T")[0];
    const urls = ids.map((id: number) => `
  <url>
    <loc>https://savy.co.il/product/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://savy.co.il</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://savy.co.il/supermarkets</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://savy.co.il/deals</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://savy.co.il/price-index</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://savy.co.il/online</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://savy.co.il/category</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://savy.co.il/guide</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://savy.co.il/hashvatat-mekhirim-mazon</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://savy.co.il/produce</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://savy.co.il/compare</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://savy.co.il/prices</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>${CITIES.map((c) => `
  <url>
    <loc>https://savy.co.il/supermarkets/${c.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}${STAPLES.map((s) => `
  <url>
    <loc>https://savy.co.il/prices/${s.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}${comparePairs().map((p) => `
  <url>
    <loc>https://savy.co.il/compare/${p.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}${MAJOR_CHAINS.map((c) => `
  <url>
    <loc>https://savy.co.il/deals/${c.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}${urls}
</urlset>`;
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
