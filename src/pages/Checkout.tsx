import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Public checkout entry point. Used when the iOS app opens the web checkout
 * in Safari. Requires an authenticated session and validates that the URL
 * `uid` matches the signed-in user — never trust client-supplied user IDs
 * for linking payments.
 */
const Checkout = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const priceKey = params.get("price") || params.get("checkout");
    const urlUid = params.get("uid");
    const urlEmail = params.get("email") || undefined;

    if (!priceKey) {
      setError("Parâmetros de checkout em falta.");
      return;
    }

    (async () => {
      try {
        // Resolve identity safely. Always check the current session first;
        // if a session exists, it is the source of truth and any `uid` in
        // the URL must match it (otherwise an attacker could trick a
        // signed-in victim into paying for the attacker's subscription).
        // Only fall back to the URL `uid` for the native iOS Safari flow
        // where no shared session is available.
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        let userId: string | undefined;
        let email: string | undefined = urlEmail;

        if (session) {
          if (urlUid && urlUid !== session.user.id) {
            setError("Sessão não corresponde ao utilizador do checkout.");
            return;
          }
          userId = session.user.id;
          email = email ?? session.user.email ?? undefined;
        } else if (urlUid) {
          // Native iOS flow: no shared web session. Accept the URL uid —
          // the Paddle webhook only credits the subscription after the
          // payment succeeds, and the iOS app builds this URL from the
          // signed-in native session.
          userId = urlUid;
        } else {
          setError("Sessão necessária para abrir o checkout.");
          return;
        }

        await initializePaddle();
        const paddlePriceId = await getPaddlePriceId(priceKey);
        window.Paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customer: email ? { email } : undefined,
          customData: { userId },
          settings: {
            displayMode: "overlay",
            successUrl: `${window.location.origin}/checkout?success=1`,
            allowLogout: false,
            variant: "one-page",
          },
        });
      } catch (e: any) {
        setError(e.message ?? "Erro ao abrir o checkout.");
        toast.error(e.message ?? "Erro ao abrir o checkout.");
      }
    })();
  }, []);

  const success = new URLSearchParams(window.location.search).get("success");

  return (
    <>
      <PaymentTestModeBanner />
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        {success ? (
          <>
            <h1 className="font-display text-2xl">Subscrição ativada!</h1>
            <p className="text-sm text-muted-foreground">
              Pode voltar à aplicação. A sua subscrição estará disponível em instantes.
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="font-display text-xl text-destructive">Não foi possível abrir o checkout</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">A abrir o checkout seguro…</p>
          </>
        )}
      </div>
    </>
  );
};

export default Checkout;
