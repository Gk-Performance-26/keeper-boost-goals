import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * RevenueCat webhook → updates the `subscriptions` table for native iOS/Android purchases.
 *
 * RevenueCat authenticates via the `Authorization` header configured in their
 * dashboard. We compare it against REVENUECAT_WEBHOOK_AUTH_HEADER.
 *
 * Configure in RevenueCat: Project → Integrations → Webhooks
 *   URL:  https://gmxdpofqobkussndolze.supabase.co/functions/v1/revenuecat-webhook
 *   Auth: <whatever you put in REVENUECAT_WEBHOOK_AUTH_HEADER>
 */

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const ACTIVE_TYPES = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'SUBSCRIPTION_EXTENDED',
]);

const CANCEL_TYPES = new Set([
  'CANCELLATION',     // user cancelled — still active until expiry
  'EXPIRATION',       // fully expired
]);

const ENTITLEMENT_ID = 'GKPerformanceHub Pro';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Auth check
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_HEADER');
  const provided = req.headers.get('authorization') ?? '';
  if (!expected || provided !== expected) {
    console.warn('[RC webhook] auth mismatch');
    return new Response('Unauthorized', { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const event = body?.event;
  if (!event) return new Response('No event', { status: 400 });

  const userId = event.app_user_id as string | undefined;
  if (!userId) {
    console.warn('[RC webhook] no app_user_id', event.type);
    return new Response('OK', { status: 200 });
  }

  const eventType = event.type as string;
  console.log('[RC webhook]', eventType, 'user:', userId, 'product:', event.product_id);

  const productId = event.product_id as string | undefined;
  const expirationMs = event.expiration_at_ms as number | undefined;
  const store = event.store as string | undefined;
  const originalTxId = event.original_transaction_id as string | undefined;

  // Map RC product id → our internal price_id (matches what Paddle webhook stores)
  const priceId = mapPriceId(productId);

  let status = 'inactive';
  if (ACTIVE_TYPES.has(eventType)) status = 'active';
  else if (eventType === 'CANCELLATION') status = 'active'; // canceled but still in period
  else if (eventType === 'EXPIRATION') status = 'canceled';
  else if (eventType === 'BILLING_ISSUE') status = 'past_due';

  // Determine cancel_at_period_end based on entitlement payload if present
  const entitlements = event.entitlement_ids ?? [];
  const hasOurEntitlement = Array.isArray(entitlements)
    ? entitlements.includes(ENTITLEMENT_ID)
    : false;

  const update: Record<string, unknown> = {
    user_id: userId,
    provider: 'revenuecat',
    rc_app_user_id: userId,
    store: store ?? null,
    product_identifier: productId ?? null,
    original_transaction_id: originalTxId ?? null,
    price_id: priceId,
    status,
    current_period_end: expirationMs ? new Date(expirationMs).toISOString() : null,
    cancel_at_period_end: eventType === 'CANCELLATION',
    updated_at: new Date().toISOString(),
  };

  if (!hasOurEntitlement && CANCEL_TYPES.has(eventType)) {
    // Even if entitlement_ids missing, treat expiration as canceled
    update.status = eventType === 'EXPIRATION' ? 'canceled' : update.status;
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(update, { onConflict: 'user_id' });

  if (error) {
    console.error('[RC webhook] DB error', error);
    return new Response('DB error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

function mapPriceId(productId: string | undefined): string | null {
  if (!productId) return null;
  if (productId.includes('yearly') || productId.includes('annual')) return 'premium_yearly';
  if (productId.includes('monthly')) return 'premium_monthly';
  return productId;
}
