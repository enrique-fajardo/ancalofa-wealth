import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Return empty parsed result — actual parsing done by Python backend
    return NextResponse.json({
      rows: [],
      headers: [],
      filename: file.name,
      message: 'File received. Manual import or Python backend required for parsing.',
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
