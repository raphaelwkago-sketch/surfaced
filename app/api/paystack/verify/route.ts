import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

// Plus costs KES 1200 — Paystack reports amounts in subunits (cents)
const PLUS_PRICE_SUBUNITS = 120000;
const PLUS_CURRENCY = 'KES';

export async function POST(request: NextRequest) {
  const { reference } = await request.json();

  if (!reference || typeof reference !== 'string') {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
  }

  // Get authenticated user first — no Paystack call for anonymous requests
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify transaction with Paystack
  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  const paystackData = await paystackRes.json();

  if (!paystackData.status || paystackData.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
  }

  // The transaction must be for the full Plus price in the right currency.
  // Without this, a client-initiated charge of KES 1 would unlock Plus.
  const tx = paystackData.data;
  if (tx.currency !== PLUS_CURRENCY || Number(tx.amount) < PLUS_PRICE_SUBUNITS) {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
  }

  // The payer must be the signed-in user — stops redeeming someone else's receipt
  if (tx.customer?.email?.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
  }

  const admin = createAdminClient();

  // One reference unlocks one account — reject replays across accounts
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('paystack_reference', reference)
    .neq('id', user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
  }

  // Mark user as Plus — service-role write (browser writes are forbidden by RLS)
  const { error } = await admin
    .from('profiles')
    .update({ is_plus: true, paystack_reference: reference })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
