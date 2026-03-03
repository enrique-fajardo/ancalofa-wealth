import { NextResponse } from 'next/server';

export async function GET() {
  // Return a simple CSV template
  const csv = [
    'account_id,transaction_type,amount,currency,transaction_date,symbol,description,notes',
    'SKA-CAR-001,deposit,1000000,COP,2026-01-01,,Initial deposit,',
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="import_template.csv"',
    },
  });
}
