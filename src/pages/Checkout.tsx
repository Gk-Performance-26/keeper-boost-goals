import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { toast } from "sonner";

/**
 * Public checkout entry point. No auth required — used when the iOS app
 * opens the web checkout in Safari. Reads ?price=&uid=&email= from the URL
 * and immediately opens the Paddle overlay.
 */
const Checkout = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Accept both ?price= and the legacy ?checkout= for backwards compat
    const priceKey = params.get("price") || params.get("checkout");
    const uid = params.get("uid");
    const email = params.get("email");

    if (!priceKey || !uid) {
      setError("Parâmetros de checkout em falta.");
      return;
    }

    (async () => {
      try {
        await initializePaddle();
        const paddlePriceId = await getPaddlePriceId(priceKey);
        window.Paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customer: email ? { email } : undefined,
          customData: { userId: uid },
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
