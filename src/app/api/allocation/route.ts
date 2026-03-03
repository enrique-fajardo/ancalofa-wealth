import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// Target allocations (from MasterConfig / hardcoded targets)
const TARGETS: Record<string, { description: string; target_pct: number }> = {
  cop_equity:   { description: 'Colombian Stocks',    target_pct: 25 },
  usd_equity:   { description: 'US Stocks & ETFs',    target_pct: 35 },
  fixed_income: { description: 'Bonds / CDTs / CATs', target_pct: 25 },
  crypto:       { description: 'Bitcoin / Ethereum',  target_pct: 5  },
  cash:         { description: 'Cash Reserves',       target_pct: 10 },
};

export async function GET() {
  try {
    const db = getDb();
    const TRM = 4200; // fallback TRM

    // Get active positions
    const positions = db.prepare(
      `SELECT p.*, a.currency as acct_currency FROM positions p
       JOIN accounts a ON p.account_id = a.account_id
       WHERE p.is_active = 1`
    ).all() as Array<{
      sleeve?: string; position_type?: string; current_value?: number;
      cost_basis: number; cost_currency: string;
    }>;

    // Compute total portfolio value in COP
    let totalCOP = 0;
    const sleeveTotals: Record<string, number> = {};

    for (const pos of positions) {
      const val = pos.current_value ?? pos.cost_basis;
      const valCOP = pos.cost_currency === 'USD' ? val * TRM : val;
      totalCOP += valCOP;

      const sleeve = pos.sleeve || pos.position_type || 'cash';
      sleeveTotals[sleeve] = (sleeveTotals[sleeve] ?? 0) + valCOP;
    }

    const result = Object.entries(TARGETS).map(([sleeve_id, cfg]) => {
      const actual_val = sleeveTotals[sleeve_id] ?? 0;
      const actual_pct = totalCOP > 0 ? (actual_val / totalCOP) * 100 : 0;
      const drift = actual_pct - cfg.target_pct;
      let status: 'ok' | 'over' | 'under' = 'ok';
      if (drift > 5) status = 'over';
      else if (drift < -5) status = 'under';
      return {
        sleeve_id,
        description: cfg.description,
        target_pct: cfg.target_pct,
        actual_pct: Math.round(actual_pct * 10) / 10,
        drift: Math.round(drift * 10) / 10,
        status,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
