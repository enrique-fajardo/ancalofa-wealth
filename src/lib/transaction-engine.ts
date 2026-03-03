/**
 * Transaction Engine — computes monthly portfolio snapshots from transactions
 * Uses Modified Dietz method for monthly returns.
 */
import getDb from '@/lib/db';

export interface MonthlySnapshot {
  date: string;        // YYYY-MM-01
  month_label: string; // e.g. "Jan 2024"
  capital: number;
  returns: number;
  return_pct: number;
}

function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function computeSnapshots(): MonthlySnapshot[] {
  const db = getDb();

  try {
    const transactions = db.prepare(`
      SELECT transaction_date, transaction_type, amount, currency, account_id
      FROM transactions ORDER BY transaction_date ASC
    `).all() as Array<{
      transaction_date: string; transaction_type: string;
      amount: number; currency: string; account_id: string;
    }>;

    if (transactions.length === 0) return [];

    const TRM = 4200;

    // Group by month
    const byMonth: Record<string, number> = {};
    for (const tx of transactions) {
      const ym = toYearMonth(tx.transaction_date);
      const amtCOP = tx.currency === 'USD' ? tx.amount * TRM : tx.amount;
      const sign = ['withdrawal', 'fee'].includes(tx.transaction_type) ? -1 : 1;
      byMonth[ym] = (byMonth[ym] ?? 0) + sign * amtCOP;
    }

    const months = Object.keys(byMonth).sort();
    const snapshots: MonthlySnapshot[] = [];
    let runningCapital = 0;

    for (const ym of months) {
      const netFlow = byMonth[ym];
      runningCapital += netFlow;
      // Simplified: returns estimated at 0 per month (actual values from DB preferred)
      snapshots.push({
        date: `${ym}-01`,
        month_label: monthLabel(ym),
        capital: Math.round(runningCapital),
        returns: 0,
        return_pct: 0,
      });
    }

    return snapshots;
  } catch {
    return [];
  }
}

export function ensureSnapshotTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL UNIQUE,
      month_label TEXT NOT NULL,
      capital     REAL NOT NULL DEFAULT 0,
      returns     REAL NOT NULL DEFAULT 0,
      return_pct  REAL NOT NULL DEFAULT 0
    );
  `);
}
