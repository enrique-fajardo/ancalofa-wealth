import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

let cache: { data: unknown[]; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

async function fetchBanRepRate(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://www.datos.gov.co/resource/7ej4-rvps.json?$limit=1&$order=fecha DESC',
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data[0]?.valor) return parseFloat(data[0].valor);
    }
  } catch { /* fallback */ }
  return null;
}

async function fetchFredRate(series: string, apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      const val = data.observations?.[0]?.value;
      if (val && val !== '.') return parseFloat(val);
    }
  } catch { /* fallback */ }
  return null;
}

async function fetchYahooFinance(symbol: string): Promise<{ price: number; change_pct: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`,
      { next: { revalidate: 3600 }, headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      if (closes && closes.length >= 2) {
        const prev = closes[closes.length - 2];
        const curr = closes[closes.length - 1];
        return { price: curr, change_pct: ((curr - prev) / prev) * 100 };
      }
    }
  } catch { /* fallback */ }
  return null;
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      return NextResponse.json(cache.data);
    }

    const db = getDb();
    const FRED_KEY = process.env.FRED_API_KEY || '';

    // Fetch in parallel
    const [banRepRate, fedRate, sp500, colcap] = await Promise.all([
      fetchBanRepRate(),
      FRED_KEY ? fetchFredRate('FEDFUNDS', FRED_KEY) : Promise.resolve(null),
      fetchYahooFinance('%5EGSPC'),
      fetchYahooFinance('%5EIGBC'),
    ]);

    // Latest IPC from macro_history
    let ipcCO: number | null = null;
    let cpiUS: number | null = null;
    try {
      const ipcRow = db.prepare(`SELECT value FROM macro_history WHERE indicator_id='ipc_co' ORDER BY period DESC LIMIT 1`).get() as { value: number } | undefined;
      ipcCO = ipcRow?.value ?? null;
      const cpiRow = db.prepare(`SELECT value FROM macro_history WHERE indicator_id='cpi_us' ORDER BY period DESC LIMIT 1`).get() as { value: number } | undefined;
      cpiUS = cpiRow?.value ?? null;
    } catch { /* ok */ }

    const indicators = [
      { id: 'banrep_rate', name: 'Tasa BanRep', value: banRepRate, unit: '%', country: 'CO', source: 'Banco de la República' },
      { id: 'fed_rate', name: 'Fed Funds Rate', value: fedRate, unit: '%', country: 'US', source: 'Federal Reserve' },
      { id: 'ipc_co', name: 'IPC Colombia', value: ipcCO, unit: '% MoM', country: 'CO', source: 'DANE' },
      { id: 'cpi_us', name: 'CPI United States', value: cpiUS, unit: '% MoM', country: 'US', source: 'BLS / FRED' },
      { id: 'sp500', name: 'S&P 500', value: sp500?.price ?? null, unit: 'USD', country: 'US', change: sp500?.change_pct ?? null, source: 'Yahoo Finance' },
      { id: 'colcap', name: 'COLCAP', value: colcap?.price ?? null, unit: 'COP', country: 'CO', change: colcap?.change_pct ?? null, source: 'Yahoo Finance' },
    ];

    cache = { data: indicators, ts: Date.now() };
    return NextResponse.json(indicators);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
