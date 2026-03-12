import { NextRequest, NextResponse } from 'next/server';
const API = 'https://supermarket-compare-production.up.railway.app';
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-session-token') || req.cookies.get('session_token')?.value;
  const res = await fetch(`${API}/api/receipt/history`, {
    headers: { ...(token ? { 'x-session-token': token } : {}) }
  });
  const data = await res.json();
  return NextResponse.json(data);
}
