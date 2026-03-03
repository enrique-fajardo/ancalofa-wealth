import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    try {
      // Try portfolio_snapshots table first (created by transaction-engine)
      const rows = db.prepare(`
        SELECT date, month_label, capital, returns, return_pct
        FROM portfolio_snapshots
        ORDER BY date ASC
      `).all();
      return NextResponse.json(rows);
    } catch {
      // Fallback: compute from transactions
      return NextResponse.json([]);
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
