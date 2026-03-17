import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
  revalidatePath('/price-index');
  revalidatePath('/supermarkets');
  return NextResponse.json({ revalidated: true });
}
