import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const res = await fetch(
    `https://specked-recycler-uproot.ngrok-free.dev/webhook/Search?q=${encodeURIComponent(q)}`,
    { headers: { 'ngrok-skip-browser-warning': '1' } }
  );
  const data = await res.json();
  return NextResponse.json(data, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}
