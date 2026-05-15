import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  const res = await fetch(
    `https://thebuilderman.app.n8n.cloud/webhook/Search?q=${encodeURIComponent(q)}`,
    {
      headers: {
        'ngrok-skip-browser-warning': '1',
        'User-Agent': 'surfaced-app',
        'Accept': 'application/json'
      }
    }
  );

  const text = await res.text();
  console.log('ngrok response:', text.substring(0, 200));

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw: text.substring(0, 500) }, { status: 500 });
  }
}
