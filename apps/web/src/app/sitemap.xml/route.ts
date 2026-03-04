import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

export async function GET() {
  try {
    const res = await fetch(`${API}/products/sitemap`, { next: { revalidate: 86400 } });
    const products = await res.json();

    const urls = products.map((id: number) => `
  <url>
    <loc>https://savy.co.il/product/${id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://savy.co.il</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
