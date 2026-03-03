import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const accountId = searchParams.get('account_id');

    if (id) {
      const row = db.prepare('SELECT * FROM positions WHERE position_id = ?').get(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(row);
    }
    if (accountId) {
      const rows = db.prepare('SELECT * FROM positions WHERE account_id = ? ORDER BY symbol').all(accountId);
      return NextResponse.json(rows);
    }
    const rows = db.prepare('SELECT * FROM positions ORDER BY account_id, symbol').all();
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
      INSERT INTO positions (account_id, symbol, description, quantity, cost_basis, current_value, cost_currency, position_type, acquisition_date, is_active, interest_rate, maturity_date)
      VALUES (@account_id, @symbol, @description, @quantity, @cost_basis, @current_value, @cost_currency, @position_type, @acquisition_date, @is_active, @interest_rate, @maturity_date)
    `).run({ current_value: null, acquisition_date: null, interest_rate: null, maturity_date: null, ...data, is_active: data.is_active ? 1 : 0 });
    const row = db.prepare('SELECT * FROM positions WHERE position_id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const data = await req.json();
    db.prepare(`
      UPDATE positions SET symbol=@symbol, description=@description, quantity=@quantity,
      cost_basis=@cost_basis, current_value=@current_value, cost_currency=@cost_currency,
      position_type=@position_type, acquisition_date=@acquisition_date, is_active=@is_active,
      interest_rate=@interest_rate, maturity_date=@maturity_date
      WHERE position_id=@position_id
    `).run({ ...data, position_id: id, is_active: data.is_active ? 1 : 0 });
    const row = db.prepare('SELECT * FROM positions WHERE position_id = ?').get(id);
    return NextResponse.json(row);
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
    db.prepare('UPDATE positions SET is_active=0 WHERE position_id=?').run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
