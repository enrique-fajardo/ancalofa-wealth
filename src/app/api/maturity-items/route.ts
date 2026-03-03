import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    // Get positions with maturity dates (CDTs / CATs)
    const rows = db.prepare(`
      SELECT p.position_id, p.account_id, p.symbol, p.description,
             p.current_value, p.cost_basis, p.cost_currency, p.position_type,
             p.interest_rate, p.maturity_date,
             i.used_name as investor_name
      FROM positions p
      JOIN accounts a ON p.account_id = a.account_id
      JOIN investors i ON a.investor_id = i.investor_id
      WHERE p.is_active = 1 AND p.maturity_date IS NOT NULL
      ORDER BY p.maturity_date ASC
    `).all() as Array<{
      position_id: string; account_id: string; symbol: string;
      description: string; current_value?: number; cost_basis: number;
      cost_currency: string; position_type: string;
      interest_rate?: number; maturity_date: string; investor_name: string;
    }>;

    const items = rows.map(r => ({
      id: r.position_id,
      instrument_name: r.description || r.symbol,
      type: r.position_type,
      investor_name: r.investor_name,
      account_id: r.account_id,
      interest_rate: r.interest_rate ?? 0,
      maturity_date: r.maturity_date,
      value_at_maturity: r.current_value ?? r.cost_basis,
    }));

    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
