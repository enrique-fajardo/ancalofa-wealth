import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account_id');
    if (accountId) {
      const rows = db.prepare('SELECT * FROM transactions WHERE account_id = ? ORDER BY transaction_date DESC').all(accountId);
      return NextResponse.json(rows);
    }
    const rows = db.prepare('SELECT * FROM transactions ORDER BY transaction_date DESC').all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const data = await req.json();
    const result = db.prepare(`
      INSERT INTO transactions (account_id, symbol, description, transaction_type, amount, currency, transaction_date, notes)
      VALUES (@account_id, @symbol, @description, @transaction_type, @amount, @currency, @transaction_date, @notes)
    `).run({ symbol: null, description: null, notes: null, ...data });
    const row = db.prepare('SELECT * FROM transactions WHERE transaction_id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    db.prepare('DELETE FROM transactions WHERE transaction_id=?').run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
