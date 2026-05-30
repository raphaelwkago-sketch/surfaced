import { NextRequest, NextResponse } from 'next/server';

const TYPESENSE_URL = 'https://surfacedtypesense.ushuruflow.com';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY ?? '';
const COLLECTION = 'tools';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  const url = `${TYPESENSE_URL}/collections/${COLLECTION}/documents/search?q=${encodeURIComponent(q)}&query_by=name,tagline,category&per_page=25`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Fetch failed', detail: String(err) }, { status: 502 });
  }

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json({ error: `Typesense returned ${res.status}`, raw: text.substring(0, 500) }, { status: 502 });
  }

  try {
    const data = JSON.parse(text);
    const tools = data.hits?.map((h: { document: unknown }) => h.document) ?? [];
    return NextResponse.json(tools, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    return NextResponse.json({ error: 'Parse failed', raw: text.substring(0, 500) }, { status: 500 });
  }
}
