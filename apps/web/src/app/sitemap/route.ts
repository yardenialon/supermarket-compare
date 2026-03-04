import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";
const PAGE_SIZE = 10000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");

  try {
    if (!searchParams.has("page")) {
      // Return sitemap index
      const countRes = await fetch(`${API}/products/sitemap/count`, { next: { revalidate: 86400 } });
      const { count } = await countRes.json();
      const pages = Math.ceil(count / PAGE_SIZE);

      const sitemaps = Array.from({ length: pages }, (_, i) => `
  <sitemap>
    <loc>https://savy.co.il/sitemap?page=${i}</loc>
  </sitemap>`).join("");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
      return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
    }

    // Return page of products
    const res = await fetch(`${API}/products/sitemap?page=${page}&limit=${PAGE_SIZE}`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(25000) });
    const ids = await res.json();

    const urls = ids.map((id: number) => `
  <url>
    <loc>https://savy.co.il/product/${id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://savy.co.il</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

    return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
