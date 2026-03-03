import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

const TRM_FALLBACK = 4200;

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'total';
    void period;

    let TRM = TRM_FALLBACK;
    try {
      const r = db.prepare(`SELECT value FROM macro_history WHERE indicator_id='trm' ORDER BY period DESC LIMIT 1`).get() as { value: number } | undefined;
      if (r?.value) TRM = r.value;
    } catch { /* ok */ }

    const positions = db.prepare(`
      SELECT p.cost_currency, p.current_value, p.cost_basis,
             a.investor_id, i.used_name as investor_name,
             a.institution
      FROM positions p
      JOIN accounts a ON p.account_id=a.account_id
      JOIN investors i ON a.investor_id=i.investor_id
      WHERE p.is_active=1
    `).all() as Array<{
      cost_currency: string; current_value?: number; cost_basis: number;
      investor_id: string; investor_name: string; institution: string;
    }>;

    // Totals
    let copBalance = 0, copCapital = 0;
    let usdBalance = 0, usdCapital = 0;

    for (const pos of positions) {
      const val = pos.current_value ?? pos.cost_basis;
      const cost = pos.cost_basis;
      if (pos.cost_currency === 'COP') { copBalance += val; copCapital += cost; }
      else { usdBalance += val; usdCapital += cost; }
    }

    const balance = copBalance + usdBalance * TRM;
    const capital = copCapital + usdCapital * TRM;
    const returns = balance - capital;
    const returnPct = capital > 0 ? (returns / capital) * 100 : 0;

    // By investor
    const investorMap: Record<string, { name: string; balance: number; capital: number }> = {};
    for (const pos of positions) {
      const val = pos.current_value ?? pos.cost_basis;
      const cost = pos.cost_basis;
      const valCOP = pos.cost_currency === 'USD' ? val * TRM : val;
      const costCOP = pos.cost_currency === 'USD' ? cost * TRM : cost;
      if (!investorMap[pos.investor_id]) {
        investorMap[pos.investor_id] = { name: pos.investor_name, balance: 0, capital: 0 };
      }
      investorMap[pos.investor_id].balance += valCOP;
      investorMap[pos.investor_id].capital += costCOP;
    }

    // By institution
    const instMap: Record<string, { balance: number; capital: number }> = {};
    for (const pos of positions) {
      const val = pos.current_value ?? pos.cost_basis;
      const cost = pos.cost_basis;
      const valCOP = pos.cost_currency === 'USD' ? val * TRM : val;
      const costCOP = pos.cost_currency === 'USD' ? cost * TRM : cost;
      if (!instMap[pos.institution]) instMap[pos.institution] = { balance: 0, capital: 0 };
      instMap[pos.institution].balance += valCOP;
      instMap[pos.institution].capital += costCOP;
    }

    return NextResponse.json({
      totals: {
        balance, capital, returns, return_pct: returnPct,
        cop_balance: copBalance, cop_capital: copCapital, cop_returns: copBalance - copCapital,
        usd_balance: usdBalance, usd_capital: usdCapital, usd_returns: usdBalance - usdCapital,
      },
      by_investor: Object.values(investorMap).map(inv => ({
        name: inv.name,
        balance: inv.balance, capital: inv.capital,
        returns: inv.balance - inv.capital,
        return_pct: inv.capital > 0 ? ((inv.balance - inv.capital) / inv.capital) * 100 : 0,
      })),
      by_institution: Object.entries(instMap).map(([name, inst]) => ({
        name,
        balance: inst.balance, capital: inst.capital,
        returns: inst.balance - inst.capital,
        return_pct: inst.capital > 0 ? ((inst.balance - inst.capital) / inst.capital) * 100 : 0,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
