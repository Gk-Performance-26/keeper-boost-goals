ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'paddle',
  ADD COLUMN IF NOT EXISTS rc_app_user_id text,
  ADD COLUMN IF NOT EXISTS store text,
  ADD COLUMN IF NOT EXISTS product_identifier text,
  ADD COLUMN IF NOT EXISTS original_transaction_id text;

CREATE INDEX IF NOT EXISTS subscriptions_rc_app_user_id_idx ON public.subscriptions (rc_app_user_id);
CREATE INDEX IF NOT EXISTS subscriptions_original_transaction_idx ON public.subscriptions (original_transaction_id);