import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const TYPESENSE_URL = process.env.TYPESENSE_HOST ?? 'https://search.ushuruflow.com';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY ?? '';
const COLLECTION = 'tools';
const ANON_LIMIT = 3;
const FREE_LIMIT = 15;
const ANON_COOKIE = 'anon_searches';

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

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!TYPESENSE_API_KEY || !TYPESENSE_URL) {
    return NextResponse.json({ error: 'Search not configured' }, { status: 500 });
  }

  const q = request.nextUrl.searchParams.get('q') || '';
  const response = NextResponse.next(); // placeholder so we can attach cookies

  // Build Supabase client that reads/writes cookies on this request
  let userId: string | null = null;
  let isPlus = false;
  let searchesToday = 0;
  let lastSearchDate: string | null = null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    userId = user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_plus, searches_today, last_search_date')
      .eq('id', userId)
      .single();

    if (profile) {
      isPlus = profile.is_plus;
      lastSearchDate = profile.last_search_date;
      // Reset daily count if it's a new day
      searchesToday = lastSearchDate === todayUTC() ? profile.searches_today : 0;
    }
  }

  // --- Limit checks ---
  if (!userId) {
    // Anonymous: track via cookie
    const anonCount = parseInt(request.cookies.get(ANON_COOKIE)?.value ?? '0', 10);
    if (anonCount >= ANON_LIMIT) {
      return NextResponse.json(
        { error: 'anon_limit', message: 'Sign in to continue searching' },
        { status: 401 }
      );
    }
  } else if (!isPlus) {
    // Free user: enforce daily limit
    if (searchesToday >= FREE_LIMIT) {
      return NextResponse.json(
        { error: 'free_limit', message: 'Upgrade to Plus for unlimited searches' },
        { status: 401 }
      );
    }
  }

  // --- Typesense query ---
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
      results = [...primary, ...categoryDocs.filter(d => !seen.has(d.name))];
    } catch {
      // use primary results only
    }
  }

  // --- Post-search: increment counts ---
  const finalResponse = NextResponse.json(results, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });

  if (!userId) {
    const anonCount = parseInt(request.cookies.get(ANON_COOKIE)?.value ?? '0', 10);
    finalResponse.cookies.set(ANON_COOKIE, String(anonCount + 1), {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // resets every 24h
      path: '/',
    });
  } else if (!isPlus) {
    const newCount = searchesToday + 1;
    await supabase
      .from('profiles')
      .update({ searches_today: newCount, last_search_date: todayUTC() })
      .eq('id', userId);
  }

  return finalResponse;
}
