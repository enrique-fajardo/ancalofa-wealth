import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { transactions, account_id, source } = await req.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    let inserted = 0;
    let skipped = 0;

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO transactions
      (account_id, symbol, description, transaction_type, amount, currency, transaction_date, notes)
      VALUES (@account_id, @symbol, @description, @transaction_type, @amount, @currency, @transaction_date, @notes)
    `);

    const insertMany = db.transaction((rows: unknown[]) => {
      for (const row of rows as Array<Record<string, unknown>>) {
        const result = insertStmt.run({
          account_id: row.account_id || account_id,
          symbol: row.symbol || null,
          description: row.description || null,
          transaction_type: row.transaction_type || row.type || 'deposit',
          amount: row.amount || 0,
          currency: row.currency || 'COP',
          transaction_date: row.transaction_date || row.date,
          notes: row.notes || null,
        });
        if (result.changes > 0) inserted++;
        else skipped++;
      }
    });

    insertMany(transactions);

    // Log to import_history
    try {
      db.prepare(`
        INSERT INTO import_history (filename, source, rows_imported, imported_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(source || 'manual', source || 'api', inserted);
    } catch { /* table may not exist */ }

    return NextResponse.json({ ok: true, inserted, skipped });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
