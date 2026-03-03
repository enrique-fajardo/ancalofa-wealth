import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const investorId = searchParams.get('investor_id');

    if (id) {
      const row = db.prepare('SELECT * FROM accounts WHERE account_id = ?').get(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(row);
    }
    if (investorId) {
      const rows = db.prepare('SELECT * FROM accounts WHERE investor_id = ? ORDER BY account_id').all(investorId);
      return NextResponse.json(rows);
    }
    const rows = db.prepare('SELECT * FROM accounts ORDER BY account_id').all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const data = await req.json();
    db.prepare(`
      INSERT INTO accounts (account_id, investor_id, institution, account_type, currency, sleeve, name, is_active, notes, first_deposit_date)
      VALUES (@account_id, @investor_id, @institution, @account_type, @currency, @sleeve, @name, @is_active, @notes, @first_deposit_date)
    `).run({ ...data, is_active: data.is_active ? 1 : 0 });
    const row = db.prepare('SELECT * FROM accounts WHERE account_id = ?').get(data.account_id);
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
      UPDATE accounts SET institution=@institution, account_type=@account_type, currency=@currency,
      sleeve=@sleeve, name=@name, is_active=@is_active, notes=@notes, first_deposit_date=@first_deposit_date
      WHERE account_id=@account_id
    `).run({ ...data, account_id: id, is_active: data.is_active ? 1 : 0 });
    const row = db.prepare('SELECT * FROM accounts WHERE account_id = ?').get(id);
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
    db.prepare('UPDATE accounts SET is_active=0 WHERE account_id=?').run(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
