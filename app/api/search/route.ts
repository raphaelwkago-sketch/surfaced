import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const url = `https://specked-recycler-uproot.ngrok-free.dev/webhook/Search?q=${encodeURIComponent(q)}`;

  console.log('[search] fetching:', url);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': '1',
        'User-Agent': 'surfaced-app',
        'Accept': 'application/json'
      }
    });
  } catch (err) {
    console.error('[search] fetch threw:', err);
    return NextResponse.json({ error: 'Fetch failed', detail: String(err) }, { status: 502 });
  }

  console.log('[search] status:', res.status);
  console.log('[search] content-type:', res.headers.get('content-type'));

  const text = await res.text();
  console.log('[search] body length:', text.length);
  console.log('[search] body preview:', text.substring(0, 500));

  if (!res.ok) {
    return NextResponse.json({ error: `n8n returned ${res.status}`, raw: text.substring(0, 500) }, { status: 502 });
  }

  if (!text.trim()) {
    return NextResponse.json({ error: 'Empty response from n8n' }, { status: 502 });
  }

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('[search] JSON parse error:', err);
    return NextResponse.json({ error: 'Parse failed', raw: text.substring(0, 500) }, { status: 500 });
  }
}
