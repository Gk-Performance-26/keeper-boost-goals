import { isTestMode } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (!isTestMode()) return null;

  return (
    <div className="w-full border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-xs text-orange-800">
      Pagamentos em modo de teste. Usa o cartão{" "}
      <span className="font-mono font-semibold">4242 4242 4242 4242</span> para testar.
    </div>
  );
}
