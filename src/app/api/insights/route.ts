import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

let cache: { data: unknown[]; ts: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      return NextResponse.json(cache.data);
    }

    const db = getDb();
    const insights: unknown[] = [];

    const TRM_FALLBACK = 4200;
    let TRM = TRM_FALLBACK;
    try {
      const r = db.prepare(`SELECT value FROM macro_history WHERE indicator_id='trm' ORDER BY period DESC LIMIT 1`).get() as { value: number } | undefined;
      if (r?.value) TRM = r.value;
    } catch { /* ok */ }

    // --- 1. Allocation Drift ---
    try {
      const TARGETS: Record<string, number> = {
        cop_equity: 25, usd_equity: 35, fixed_income: 25, crypto: 5, cash: 10,
      };
      const positions = db.prepare(`SELECT p.position_type as sleeve, p.cost_currency, p.current_value, p.cost_basis FROM positions p WHERE p.is_active=1`).all() as Array<{ sleeve?: string; cost_currency: string; current_value?: number; cost_basis: number }>;
      let totalCOP = 0;
      const sleeveTotals: Record<string, number> = {};
      for (const pos of positions) {
        const val = pos.current_value ?? pos.cost_basis;
        const valCOP = pos.cost_currency === 'USD' ? val * TRM : val;
        totalCOP += valCOP;
        const s = pos.sleeve || 'cash';
        sleeveTotals[s] = (sleeveTotals[s] ?? 0) + valCOP;
      }
      for (const [sleeve, target] of Object.entries(TARGETS)) {
        const actual = totalCOP > 0 ? ((sleeveTotals[sleeve] ?? 0) / totalCOP) * 100 : 0;
        const drift = actual - target;
        if (Math.abs(drift) > 10) {
          insights.push({
            id: `allocation_drift_${sleeve}`,
            category: drift > 0 ? 'risk' : 'opportunity',
            severity: Math.abs(drift) > 15 ? 'high' : 'medium',
            title: `Allocation Drift: ${sleeve}`,
            message: `${sleeve} is ${drift > 0 ? 'over' : 'under'} target by ${Math.abs(drift).toFixed(1)}% (target: ${target}%, actual: ${actual.toFixed(1)}%)`,
            data: { sleeve, target, actual, drift },
          });
        }
      }
    } catch { /* ok */ }

    // --- 2. Maturity Urgency ---
    try {
      const today = new Date().toISOString().slice(0, 10);
      const maturities = db.prepare(`
        SELECT p.description, p.maturity_date, p.current_value, p.cost_basis, a.account_id
        FROM positions p JOIN accounts a ON p.account_id=a.account_id
        WHERE p.is_active=1 AND p.maturity_date IS NOT NULL AND p.maturity_date >= ?
        ORDER BY p.maturity_date ASC
      `).all(today) as Array<{ description: string; maturity_date: string; current_value?: number; cost_basis: number; account_id: string }>;

      for (const mat of maturities) {
        const days = Math.ceil((new Date(mat.maturity_date + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days <= 90) {
          insights.push({
            id: `maturity_${mat.account_id}_${mat.maturity_date}`,
            category: 'alert',
            severity: days <= 30 ? 'high' : 'medium',
            title: `Upcoming Maturity: ${mat.description}`,
            message: `${mat.description} matures in ${days} days (${mat.maturity_date}). Value: $${Math.round((mat.current_value ?? mat.cost_basis) / 1_000_000).toFixed(1)}M`,
            data: { days, maturity_date: mat.maturity_date, account_id: mat.account_id },
          });
        }
      }
    } catch { /* ok */ }

    // --- 3. Active Alerts ---
    try {
      const alerts = db.prepare('SELECT * FROM alerts WHERE is_acknowledged=0 LIMIT 5').all() as Array<{ alert_id: string; severity: string; category: string; title: string; message: string }>;
      for (const a of alerts) {
        insights.push({
          id: `alert_${a.alert_id}`,
          category: 'alert',
          severity: a.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
          title: a.title,
          message: a.message,
        });
      }
    } catch { /* ok */ }

    // --- 4. Portfolio Status ---
    try {
      const posCount = (db.prepare('SELECT COUNT(*) as n FROM positions WHERE is_active=1').get() as { n: number }).n;
      insights.push({
        id: 'portfolio_status',
        category: 'status',
        severity: 'info',
        title: 'Portfolio Status',
        message: `Active portfolio: ${posCount} positions tracked`,
      });
    } catch { /* ok */ }

    cache = { data: insights, ts: Date.now() };
    return NextResponse.json(insights);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
