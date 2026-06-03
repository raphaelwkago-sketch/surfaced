import { NextRequest, NextResponse } from 'next/server';

const TYPESENSE_URL = 'https://surfacedtypesense.ushuruflow.com';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY ?? '';
const COLLECTION = 'tools';

type ToolDoc = { name?: string; category?: string; [key: string]: unknown };

async function tsSearch(params: string): Promise<ToolDoc[]> {
  const res = await fetch(
    `${TYPESENSE_URL}/collections/${COLLECTION}/documents/search?${params}`,
    { headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.hits?.map((h: { document: ToolDoc }) => h.document) ?? [];
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  let primary: ToolDoc[];
  try {
    primary = await tsSearch(
      `q=${encodeURIComponent(q)}&query_by=name,tagline,category,gotcha,limitations,free_tier_description&per_page=25`
    );
  } catch (err) {
    return NextResponse.json({ error: 'Fetch failed', detail: String(err) }, { status: 502 });
  }

  // Pull remaining tools from the same category as the top result
  const topCategory = primary[0]?.category;
  let results = primary;

  if (topCategory) {
    try {
      const categoryDocs = await tsSearch(
        `q=*&query_by=name&filter_by=category:=${encodeURIComponent(topCategory)}&per_page=50`
      );
      const seen = new Set(primary.map(d => d.name));
      const extras = categoryDocs.filter(d => !seen.has(d.name));
      results = [...primary, ...extras];
    } catch {
      // use primary results only
    }
  }

  return NextResponse.json(results, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
