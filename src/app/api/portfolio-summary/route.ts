import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

const TRM_FALLBACK = 4200;

function getTRM(db: ReturnType<typeof getDb>): number {
  try {
    const r = db.prepare(`SELECT value FROM macro_history WHERE indicator_id='trm' ORDER BY period DESC LIMIT 1`).get() as { value: number } | undefined;
    return r?.value ?? TRM_FALLBACK;
  } catch { return TRM_FALLBACK; }
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'total';

    const TRM = getTRM(db);

    // Active positions with account info
    const positions = db.prepare(`
      SELECT p.*, a.currency as acct_currency
      FROM positions p JOIN accounts a ON p.account_id=a.account_id
      WHERE p.is_active=1
    `).all() as Array<{
      cost_currency: string; current_value?: number; cost_basis: number;
      acct_currency: string; account_id: string;
    }>;

    const accounts = db.prepare('SELECT * FROM accounts WHERE is_active=1').all() as Array<{ currency: string }>;

    let totalCOP = 0, capitalCOP = 0;
    let totalUSD = 0, capitalUSD = 0;

    for (const pos of positions) {
      const val = pos.current_value ?? pos.cost_basis;
      const cost = pos.cost_basis;
      if (pos.cost_currency === 'COP') {
        totalCOP += val;
        capitalCOP += cost;
      } else {
        totalUSD += val;
        capitalUSD += cost;
      }
    }

    const returnsCOP = totalCOP - capitalCOP;
    const returnsUSD = totalUSD - capitalUSD;
    const totalPnl = returnsCOP + (returnsUSD * TRM);
    const totalCapital = capitalCOP + (capitalUSD * TRM);
    const totalReturnPct = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

    // Period-based return — use portfolio_snapshots if available
    let returnPct = totalReturnPct;
    let dataCoverageMonths = 0;

    if (period !== 'total') {
      try {
        const now = new Date();
        let fromDate = '';
        if (period === 'ytd') {
          fromDate = `${now.getFullYear()}-01-01`;
        } else if (period === 'mtd') {
          fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        } else if (period === '12m') {
          const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
          fromDate = d.toISOString().slice(0, 10);
        } else if (period === '3y') {
          const d = new Date(now); d.setFullYear(d.getFullYear() - 3);
          fromDate = d.toISOString().slice(0, 10);
        } else if (period === '5y') {
          const d = new Date(now); d.setFullYear(d.getFullYear() - 5);
          fromDate = d.toISOString().slice(0, 10);
        }

        if (fromDate) {
          const snapshots = db.prepare(`
            SELECT return_pct FROM portfolio_snapshots WHERE date >= ? ORDER BY date ASC
          `).all(fromDate) as Array<{ return_pct: number }>;

          if (snapshots.length > 0) {
            const compound = snapshots.reduce((prod, s) => prod * (1 + s.return_pct / 100), 1);
            returnPct = (compound - 1) * 100;
            dataCoverageMonths = snapshots.length;
          }
        }
      } catch { /* table may not exist */ }
    }

    // Annualized return — find earliest transaction date for CAGR
    let annualizedReturnPct: number | null = null;
    try {
      const earliest = db.prepare(`SELECT MIN(transaction_date) as min_date FROM transactions`).get() as { min_date: string | null } | undefined;
      if (earliest?.min_date) {
        const startMs = new Date(earliest.min_date).getTime();
        const nowMs = Date.now();
        const years = (nowMs - startMs) / (365.25 * 24 * 60 * 60 * 1000);
        if (years >= 0.25 && totalReturnPct !== 0) {
          annualizedReturnPct = ((Math.pow(1 + totalReturnPct / 100, 1 / years)) - 1) * 100;
        }
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      total_cop: totalCOP,
      capital_cop: capitalCOP,
      returns_cop: returnsCOP,
      cop_accounts: accounts.filter(a => a.currency === 'COP').length,
      total_usd: totalUSD,
      capital_usd: capitalUSD,
      returns_usd: returnsUSD,
      usd_accounts: accounts.filter(a => a.currency === 'USD').length,
      total_pnl: totalPnl,
      total_cost_basis: totalCapital,
      total_return_pct: totalReturnPct,
      annualized_return_pct: annualizedReturnPct,
      active_positions: positions.length,
      active_accounts: accounts.length,
      return_pct: returnPct,
      data_coverage_months: dataCoverageMonths,
      is_partial_period: period !== 'total' && dataCoverageMonths === 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
