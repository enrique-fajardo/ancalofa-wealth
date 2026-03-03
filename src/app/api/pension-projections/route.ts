import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    // Get pension positions
    const positions = db.prepare(`
      SELECT p.current_value, p.cost_basis, a.investor_id
      FROM positions p JOIN accounts a ON p.account_id=a.account_id
      WHERE p.is_active=1 AND p.position_type='pension'
    `).all() as Array<{ current_value?: number; cost_basis: number; investor_id: string }>;

    if (positions.length === 0) return NextResponse.json([]);

    const totalValue = positions.reduce((s, p) => s + (p.current_value ?? p.cost_basis), 0);

    // Simple projection: assume 6% annual return, project 30 years
    const ANNUAL_RETURN = 0.06;
    const currentYear = new Date().getFullYear();
    const projections = [];
    let value = totalValue;
    const annualContrib = 3_000_000; // assumed monthly contrib * 12
    let cumContribs = 0;

    for (let i = 0; i <= 30; i++) {
      projections.push({
        year: currentYear + i,
        age: 45 + i, // approximate
        projected_value: Math.round(value),
        contributions_cumulative: Math.round(cumContribs),
      });
      value = (value + annualContrib) * (1 + ANNUAL_RETURN);
      cumContribs += annualContrib;
    }

    return NextResponse.json(projections);
  } catch {
    return NextResponse.json([]);
  }
}
