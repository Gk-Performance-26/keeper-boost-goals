import { useLanguage } from "@/contexts/LanguageContext";

export function TermsContent() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <div className="max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl">Terms of Use (EULA)</h2>

        <section>
          <h3 className="font-semibold text-base">1. Seller and Acceptance</h3>
          <p>
            These Terms of Use govern your use of <strong>GK Performance Hub</strong> (the “App”), operated by <strong>Guilherme Fernandes</strong> (the “Seller”, “we”, “us”), based in Portugal. By creating an account or using the App, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the App.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base">2. License</h3>
          <p>We grant you a personal, non-transferable, non-exclusive, revocable license to use the App for personal, non-commercial purposes, in accordance with these Terms and the rules of the platform from which the App was downloaded (e.g., Apple App Store).</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">3. Eligibility</h3>
          <p>You must be at least 13 years old (or the minimum age in your country). Minors must have permission from a parent or legal guardian. By using the App, you confirm you have the authority to enter into these Terms.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">4. Account</h3>
          <p>You are responsible for keeping your credentials secure, providing accurate information, and for all activity under your account. Notify us immediately of any unauthorized use.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">5. Subscriptions, Payments and Merchant of Record</h3>
          <p>
            <strong>Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium plans: <strong>€10/month</strong> or <strong>€96/year</strong>.</li>
            <li>Subscriptions <strong>renew automatically</strong> at the end of each period unless cancelled before renewal.</li>
            <li>You can cancel at any time in account settings.</li>
            <li>Payment, billing, tax and refund mechanics for web purchases are governed by the <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Paddle Buyer Terms</a> and the <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Paddle Refund Policy</a>.</li>
            <li>Free trials, if offered, automatically convert to a paid subscription at the end of the trial unless cancelled before.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-base">6. Refunds</h3>
          <p>
            We offer a <strong>30-day money-back guarantee</strong> for web purchases. Refunds are processed by Paddle. To request a refund, visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a> or contact us at gkperformancehub.pt@gmail.com. Purchases made through the Apple App Store or Google Play follow those stores' refund policies. See our full <a href="/refund" className="text-primary underline">Refund Policy</a>.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base">7. User Conduct</h3>
          <p>You agree not to: misuse the App, attempt to reverse engineer it, share offensive content, infringe third-party rights, or use the App for unlawful purposes, fraud, spam, or to interfere with the security of the service.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">8. Intellectual Property</h3>
          <p>All training content, videos, designs, software, and trademarks in the App are owned by us or our licensors. You may not copy, reproduce, redistribute, or create derivative works without authorization.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">9. Service Availability</h3>
          <p>We do not guarantee uninterrupted or error-free performance of the App. We may modify, suspend or discontinue features at any time.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">10. Health Disclaimer</h3>
          <p>The App provides training content for informational purposes. Consult a qualified health professional before starting any physical activity. We are not responsible for injuries resulting from App use.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">11. Suspension and Termination</h3>
          <p>You may delete your account at any time from the “Profile” section. We may suspend or terminate accounts for material breach of these Terms, non-payment, fraud or security risk, or repeated/serious policy violations.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">12. Limitation of Liability</h3>
          <p>To the extent permitted by law, the App is provided “as is”, without warranties of any kind. We shall not be liable for indirect, incidental or consequential damages arising from use of the App. Nothing in these Terms excludes liability for fraud, death or personal injury caused by negligence.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">13. Changes</h3>
          <p>We may update these Terms. Material changes will be communicated through the App. Continued use means acceptance of the changes.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">14. Governing Law</h3>
          <p>These Terms are governed by the laws of Portugal. Disputes shall be submitted to the competent courts of the district of Lisbon.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">15. Contact</h3>
          <p>
            Seller: <strong>Guilherme Fernandes</strong> (trading as GK Performance Hub), Portugal<br />
            Email: gkperformancehub.pt@gmail.com
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
      <h2 className="font-display text-xl">Termos de Utilização (EULA)</h2>

      <section>
        <h3 className="font-semibold text-base">1. Vendedor e Aceitação</h3>
        <p>
          Estes Termos de Utilização regem a utilização do <strong>GK Performance Hub</strong> (a “Aplicação”), operado por <strong>Guilherme Fernandes</strong> (o “Vendedor”, “nós”), com sede em Portugal. Ao criar conta ou utilizar a Aplicação, aceita estes Termos e a nossa Política de Privacidade. Caso não concorde, não deve utilizar a Aplicação.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base">2. Licença</h3>
        <p>Concedemos-lhe uma licença pessoal, intransmissível, não exclusiva e revogável para utilizar a Aplicação para fins pessoais e não comerciais, em conformidade com estes Termos e com as regras da plataforma onde descarregou a Aplicação (ex.: Apple App Store).</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">3. Elegibilidade</h3>
        <p>Tem de ter pelo menos 13 anos (ou a idade mínima do seu país). Menores devem ter autorização do encarregado de educação. Ao utilizar a Aplicação, confirma que tem autoridade para celebrar estes Termos.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">4. Conta</h3>
        <p>É responsável por manter as suas credenciais seguras, fornecer informação rigorosa e por toda a atividade realizada na sua conta. Notifique-nos imediatamente em caso de uso não autorizado.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">5. Subscrições, Pagamentos e Comerciante Registado</h3>
        <p>
          <strong>O nosso processo de encomenda é conduzido pelo nosso revendedor online Paddle.com. A Paddle.com é o Comerciante Registado (Merchant of Record) para todas as nossas encomendas. A Paddle gere todas as questões de apoio ao cliente relativas a pagamentos e processa os reembolsos.</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Planos Premium: <strong>10€/mês</strong> ou <strong>96€/ano</strong>.</li>
          <li>As subscrições <strong>renovam-se automaticamente</strong> no final de cada período, salvo cancelamento antes da renovação.</li>
          <li>Pode cancelar a qualquer momento nas definições da conta.</li>
          <li>Os termos de pagamento, faturação, impostos e reembolsos para compras web são regidos pelos <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Termos de Comprador da Paddle</a> e pela <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Política de Reembolso da Paddle</a>.</li>
          <li>Períodos de avaliação gratuita, quando oferecidos, convertem-se automaticamente numa subscrição paga no final do período, salvo cancelamento prévio.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base">6. Reembolsos</h3>
        <p>
          Oferecemos uma <strong>garantia de reembolso de 30 dias</strong> para compras web. Os reembolsos são processados pela Paddle. Para solicitar um reembolso, visite <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.net</a> ou contacte-nos em gkperformancehub.pt@gmail.com. Compras feitas através da Apple App Store ou Google Play seguem as políticas de reembolso dessas lojas. Veja a nossa <a href="/refund" className="text-primary underline">Política de Reembolso</a> completa.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base">7. Utilização Adequada</h3>
        <p>Compromete-se a não: utilizar a Aplicação de forma indevida, fazer engenharia reversa, partilhar conteúdo ofensivo, violar direitos de terceiros, ou usar a Aplicação para fins ilegais, fraude, spam ou para interferir com a segurança do serviço.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">8. Propriedade Intelectual</h3>
        <p>Todo o conteúdo de treinos, vídeos, design, software e marcas é propriedade nossa ou dos nossos licenciadores. Não pode copiar, reproduzir, redistribuir ou criar trabalhos derivados sem autorização.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">9. Disponibilidade do Serviço</h3>
        <p>Não garantimos o funcionamento ininterrupto ou isento de erros da Aplicação. Podemos modificar, suspender ou descontinuar funcionalidades a qualquer momento.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">10. Aviso de Saúde</h3>
        <p>A Aplicação fornece conteúdos de treino com fins informativos. Consulte um profissional de saúde qualificado antes de iniciar qualquer atividade física. Não nos responsabilizamos por lesões decorrentes da utilização.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">11. Suspensão e Cessação</h3>
        <p>Pode eliminar a sua conta a qualquer momento na secção “Perfil”. Podemos suspender ou encerrar contas por incumprimento material destes Termos, falta de pagamento, fraude ou risco de segurança, ou violações repetidas/graves das políticas.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">12. Limitação de Responsabilidade</h3>
        <p>Na medida permitida por lei, a Aplicação é fornecida “tal como está”, sem garantias de qualquer tipo. Não somos responsáveis por danos indiretos, incidentais ou consequenciais resultantes do uso da Aplicação. Nada nestes Termos exclui responsabilidade por dolo, morte ou lesão pessoal causada por negligência.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">13. Alterações</h3>
        <p>Podemos atualizar estes Termos. Alterações relevantes serão comunicadas através da Aplicação. A utilização continuada implica a aceitação das alterações.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">14. Lei Aplicável</h3>
        <p>Estes Termos são regidos pela lei portuguesa. Litígios serão submetidos aos tribunais competentes da comarca de Lisboa.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">15. Contacto</h3>
        <p>
          Vendedor: <strong>Guilherme Fernandes</strong> (a operar sob o nome GK Performance Hub), Portugal<br />
          Email: gkperformancehub.pt@gmail.com
        </p>
      </section>
    </div>
  );
}
