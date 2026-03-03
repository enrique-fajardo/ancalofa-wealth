import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    // Try valuations table first, fall back gracefully
    try {
      const rows = db.prepare('SELECT * FROM valuations ORDER BY period DESC').all();
      return NextResponse.json(rows);
    } catch {
      return NextResponse.json([]);
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
