import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    try {
      const rows = db.prepare(`
        SELECT period,
          MAX(CASE WHEN indicator_id='ipc_co' THEN value END) as ipc_co,
          MAX(CASE WHEN indicator_id='cpi_us' THEN value END) as cpi_us
        FROM macro_history
        GROUP BY period
        ORDER BY period ASC
      `).all();
      return NextResponse.json(rows);
    } catch {
      return NextResponse.json([]);
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
