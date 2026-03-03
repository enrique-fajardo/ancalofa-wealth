import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    // Pension contributions are deposits to pension-type positions
    const rows = db.prepare(`
      SELECT t.transaction_id as id, t.transaction_date as date,
             t.amount, t.transaction_type as type, t.description
      FROM transactions t
      JOIN accounts a ON t.account_id = a.account_id
      JOIN positions p ON p.account_id = a.account_id AND p.is_active=1 AND p.position_type='pension'
      WHERE t.transaction_type IN ('deposit','contribution')
      GROUP BY t.transaction_id
      ORDER BY t.transaction_date DESC
    `).all();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
