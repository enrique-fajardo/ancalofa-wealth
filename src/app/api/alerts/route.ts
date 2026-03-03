import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const acknowledged = searchParams.get('acknowledged') === 'true';
    // Check if alerts table exists
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='alerts'`).get();
    if (!tableExists) return NextResponse.json([]);
    const rows = acknowledged
      ? db.prepare('SELECT * FROM alerts ORDER BY rowid DESC').all()
      : db.prepare('SELECT * FROM alerts WHERE is_acknowledged=0 ORDER BY rowid DESC').all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const { alert_id, is_acknowledged } = await req.json();
    if (!alert_id) return NextResponse.json({ error: 'alert_id required' }, { status: 400 });
    db.prepare('UPDATE alerts SET is_acknowledged=? WHERE alert_id=?').run(is_acknowledged ? 1 : 0, alert_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
