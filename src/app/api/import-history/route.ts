import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    try {
      const rows = db.prepare('SELECT * FROM import_history ORDER BY imported_at DESC LIMIT 100').all();
      return NextResponse.json(rows);
    } catch {
      return NextResponse.json([]);
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
