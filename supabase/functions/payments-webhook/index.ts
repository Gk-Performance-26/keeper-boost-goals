import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhookAutoEnv, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // SECURITY: Determine the environment by which webhook secret successfully
    // verifies the signature — never trust a caller-supplied query parameter.
    // An attacker who only has the sandbox secret can therefore never have
    // their event accepted as a live event.
    const { event, env } = await verifyWebhookAutoEnv(req);
    console.log('Received event:', event.eventType, 'env:', env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        console.log('Transaction completed:', event.data.id, 'env:', env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id, 'env:', env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    price_id: priceId,
    status: status,
    current_period_end: currentBillingPeriod?.endsAt,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id',
  });
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, scheduledChange } = data;

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId || item?.price?.id;

  const update: Record<string, unknown> = {
    status: status,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    updated_at: new Date().toISOString(),
  };
  if (priceId) update.price_id = priceId;
  if (customerId) update.paddle_customer_id = customerId;

  await supabase.from('subscriptions')
    .update(update)
    .eq('paddle_subscription_id', id);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await supabase.from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id);
}
