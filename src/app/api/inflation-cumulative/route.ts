import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

function periodToDateRange(period: string): { fromDate: string | null } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (period === 'ytd') return { fromDate: `${y}-01` };
  if (period === 'mtd') return { fromDate: `${y}-${String(m).padStart(2, '0')}` };
  if (period === '12m') {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
    return { fromDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
  }
  if (period === '3y') {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 3);
    return { fromDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
  }
  if (period === '5y') {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 5);
    return { fromDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
  }
  return { fromDate: null }; // 'total' = all history
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'total';

    const { fromDate } = periodToDateRange(period);

    let rows: Array<{ value: number; period: string }>;

    try {
      if (fromDate) {
        rows = db.prepare(
          `SELECT value, period FROM macro_history WHERE indicator_id='ipc_co' AND period >= ? ORDER BY period ASC`
        ).all(fromDate) as Array<{ value: number; period: string }>;
      } else {
        rows = db.prepare(
          `SELECT value, period FROM macro_history WHERE indicator_id='ipc_co' ORDER BY period ASC`
        ).all() as Array<{ value: number; period: string }>;
      }
    } catch {
      return NextResponse.json({ ipc_co: null, ipc_co_annualized: null, months: 0, from: null, to: null });
    }

    if (rows.length === 0) {
      return NextResponse.json({ ipc_co: null, ipc_co_annualized: null, months: 0, from: null, to: null });
    }

    // Compound: ((1+r1/100)*(1+r2/100)*...-1)*100
    const compound = rows.reduce((prod, r) => prod * (1 + r.value / 100), 1);
    const ipcCO = (compound - 1) * 100;

    const months = rows.length;
    const ipcCOAnnualized = months >= 12
      ? (Math.pow(compound, 12 / months) - 1) * 100
      : null;

    return NextResponse.json({
      ipc_co: Math.round(ipcCO * 100) / 100,
      ipc_co_annualized: ipcCOAnnualized !== null ? Math.round(ipcCOAnnualized * 100) / 100 : null,
      months,
      from: rows[0].period,
      to: rows[rows.length - 1].period,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
