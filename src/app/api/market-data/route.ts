import { NextResponse } from 'next/server';

// Simple in-memory cache
let cache: { data: unknown[]; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

async function fetchTRM(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde DESC&$limit=1',
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data[0]?.valor) return parseFloat(data[0].valor);
    }
  } catch { /* fallback */ }
  return null;
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      return NextResponse.json(cache.data);
    }

    const trm = await fetchTRM();

    const items = [
      {
        symbol: 'TRM',
        name: 'TRM USD/COP',
        price: trm ?? 4200,
        change_pct: 0,
        currency: 'COP',
        source: trm ? 'Banco de la República' : 'Fallback',
      },
    ];

    cache = { data: items, ts: Date.now() };
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
