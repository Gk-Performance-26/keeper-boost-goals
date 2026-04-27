import { useLanguage } from "@/contexts/LanguageContext";

export function RefundPolicyContent() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <div className="max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl">Refund Policy</h2>

        <section>
          <h3 className="font-semibold text-base">1. 30-Day Money-Back Guarantee</h3>
          <p>
            We offer a <strong>30-day money-back guarantee</strong> on all subscriptions purchased through our website. If you are not satisfied with your purchase, you can request a full refund within 30 days of your order date.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base">2. Merchant of Record</h3>
          <p>
            Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle is the Merchant of Record for all our orders and processes all refunds directly.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base">3. How to Request a Refund</h3>
          <p>To request a refund:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a> and use the order details from your purchase confirmation email to manage your order and request a refund directly with Paddle.
            </li>
            <li>
              Or contact our support team at <a href="mailto:gkperformancehub.pt@gmail.com" className="text-primary underline">gkperformancehub.pt@gmail.com</a> and we will help you process the refund through Paddle.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-base">4. Processing Time</h3>
          <p>
            Once approved, refunds are typically processed by Paddle within 3–10 business days, depending on your payment method and bank.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base">5. Mobile App Store Purchases</h3>
          <p>
            If you purchased a subscription through the Apple App Store or Google Play, refunds are subject to the policies of those stores and must be requested directly from them.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base">6. Contact</h3>
          <p>
            Seller: Guilherme Fernandes<br />
            Email: gkperformancehub.pt@gmail.com
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
      <h2 className="font-display text-xl">Política de Reembolso</h2>

      <section>
        <h3 className="font-semibold text-base">1. Garantia de Reembolso de 30 Dias</h3>
        <p>
          Oferecemos uma <strong>garantia de reembolso de 30 dias</strong> em todas as subscrições adquiridas no nosso website. Se não estiver satisfeito com a sua compra, pode solicitar o reembolso integral no prazo de 30 dias após a data da encomenda.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base">2. Comerciante Registado (Merchant of Record)</h3>
        <p>
          O nosso processo de encomenda é conduzido pelo nosso revendedor online <strong>Paddle.com</strong>. A Paddle é o Comerciante Registado (Merchant of Record) para todas as nossas encomendas e processa diretamente todos os reembolsos.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base">3. Como Solicitar um Reembolso</h3>
        <p>Para solicitar um reembolso:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Visite <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a> e use os dados da encomenda no email de confirmação para gerir a encomenda e pedir o reembolso diretamente à Paddle.
          </li>
          <li>
            Ou contacte o nosso suporte através de <a href="mailto:gkperformancehub.pt@gmail.com" className="text-primary underline">gkperformancehub.pt@gmail.com</a> e ajudamos a processar o reembolso através da Paddle.
          </li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base">4. Tempo de Processamento</h3>
        <p>
          Após aprovação, os reembolsos são tipicamente processados pela Paddle no prazo de 3 a 10 dias úteis, dependendo do método de pagamento e do banco.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base">5. Compras nas Lojas de Aplicações</h3>
        <p>
          Se subscreveu através da Apple App Store ou Google Play, os reembolsos seguem as políticas dessas lojas e devem ser solicitados diretamente às mesmas.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base">6. Contacto</h3>
        <p>
          Vendedor: Guilherme Fernandes<br />
          Email: gkperformancehub.pt@gmail.com
        </p>
      </section>
    </div>
  );
}
