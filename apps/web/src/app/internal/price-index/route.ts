import { NextResponse } from 'next/server';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';
export async function GET() {
  const res = await fetch(`${API}/price-index`, { next: { revalidate: 3600 } });
  const data = await res.json();
  return NextResponse.json(data);
}
