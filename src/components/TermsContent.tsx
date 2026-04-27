import { useLanguage } from "@/contexts/LanguageContext";

export function TermsContent() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <div className="max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl">Terms of Use (EULA)</h2>

        <section>
          <h3 className="font-semibold text-base">1. Acceptance</h3>
          <p>By creating an account or using GK Performance Hub (the “App”), you agree to these Terms of Use and our Privacy Policy. If you do not agree, do not use the App.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">2. License</h3>
          <p>We grant you a personal, non-transferable, non-exclusive, revocable license to use the App for personal, non-commercial purposes, in accordance with these Terms and the rules of the platform from which the App was downloaded (e.g., Apple App Store).</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">3. Eligibility</h3>
          <p>You must be at least 13 years old (or the minimum age in your country). Minors must have permission from a parent or legal guardian.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">4. Account</h3>
          <p>You are responsible for keeping your credentials secure and for all activity under your account. Notify us immediately of any unauthorized use.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">5. Subscriptions and Payments</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium plans: <strong>€10/month</strong> or <strong>€96/year</strong>.</li>
            <li>Subscriptions <strong>renew automatically</strong> at the end of each period unless cancelled at least 24 hours before renewal.</li>
            <li>You can cancel at any time in account settings or via your platform’s subscription manager.</li>
            <li>Refunds follow the policy of the store from which you purchased (Apple App Store, Google Play, or web payment provider).</li>
            <li>Free trials, if offered, automatically convert to a paid subscription at the end of the trial unless cancelled before.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-base">6. User Conduct</h3>
          <p>You agree not to: misuse the App, attempt to reverse engineer it, share offensive content, infringe third-party rights, or use the App for unlawful purposes.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">7. Content</h3>
          <p>All training content, videos, designs, and trademarks are owned by us or our licensors. You may not copy, reproduce, or redistribute content without authorization.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">8. Health Disclaimer</h3>
          <p>The App provides training content for informational purposes. Consult a qualified health professional before starting any physical activity. We are not responsible for injuries resulting from App use.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">9. Termination</h3>
          <p>You may delete your account at any time from the “Profile” section. We may suspend or terminate accounts that violate these Terms.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">10. Limitation of Liability</h3>
          <p>To the extent permitted by law, the App is provided “as is”, without warranties of any kind. We shall not be liable for indirect, incidental or consequential damages arising from use of the App.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">11. Changes</h3>
          <p>We may update these Terms. Material changes will be communicated through the App. Continued use means acceptance of the changes.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">12. Governing Law</h3>
          <p>These Terms are governed by the laws of Portugal. Disputes shall be submitted to the competent courts of the district of Lisbon.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">13. Contact</h3>
          <p>Email: gkperformancehub.pt@gmail.com<br />Responsible: Guilherme Fernandes</p>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
      <h2 className="font-display text-xl">Termos de Utilização (EULA)</h2>

      <section>
        <h3 className="font-semibold text-base">1. Aceitação</h3>
        <p>Ao criar conta ou utilizar o GK Performance Hub (a “Aplicação”), aceita estes Termos de Utilização e a nossa Política de Privacidade. Caso não concorde, não deve utilizar a Aplicação.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">2. Licença</h3>
        <p>Concedemos-lhe uma licença pessoal, intransmissível, não exclusiva e revogável para utilizar a Aplicação para fins pessoais e não comerciais, em conformidade com estes Termos e com as regras da plataforma onde descarregou a Aplicação (ex.: Apple App Store).</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">3. Elegibilidade</h3>
        <p>Tem de ter pelo menos 13 anos de idade (ou a idade mínima do seu país). Menores devem ter autorização do encarregado de educação.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">4. Conta</h3>
        <p>É responsável por manter as suas credenciais seguras e por toda a atividade realizada na sua conta. Notifique-nos imediatamente em caso de uso não autorizado.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">5. Subscrições e Pagamentos</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Planos Premium: <strong>10€/mês</strong> ou <strong>96€/ano</strong>.</li>
          <li>As subscrições <strong>renovam-se automaticamente</strong> no final de cada período, salvo cancelamento até 24 horas antes da renovação.</li>
          <li>Pode cancelar a qualquer momento nas definições da conta ou através do gestor de subscrições da sua loja (App Store, Google Play, etc.).</li>
          <li>Reembolsos seguem a política da loja onde efetuou a compra (Apple App Store, Google Play ou processador de pagamentos web).</li>
          <li>Períodos de avaliação gratuita, quando oferecidos, convertem-se automaticamente numa subscrição paga no final do período, salvo cancelamento prévio.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base">6. Utilização Adequada</h3>
        <p>Compromete-se a não: utilizar a Aplicação de forma indevida, fazer engenharia reversa, partilhar conteúdo ofensivo, violar direitos de terceiros ou usar a Aplicação para fins ilegais.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">7. Conteúdo</h3>
        <p>Todo o conteúdo de treinos, vídeos, design e marcas é propriedade nossa ou dos nossos licenciadores. Não pode copiar, reproduzir ou redistribuir conteúdos sem autorização.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">8. Aviso de Saúde</h3>
        <p>A Aplicação fornece conteúdos de treino com fins informativos. Consulte um profissional de saúde qualificado antes de iniciar qualquer atividade física. Não nos responsabilizamos por lesões decorrentes da utilização.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">9. Cessação</h3>
        <p>Pode eliminar a sua conta a qualquer momento na secção “Perfil”. Podemos suspender ou encerrar contas que violem estes Termos.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">10. Limitação de Responsabilidade</h3>
        <p>Na medida permitida por lei, a Aplicação é fornecida “tal como está”, sem garantias de qualquer tipo. Não somos responsáveis por danos indiretos, incidentais ou consequenciais resultantes do uso da Aplicação.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">11. Alterações</h3>
        <p>Podemos atualizar estes Termos. Alterações relevantes serão comunicadas através da Aplicação. A utilização continuada implica a aceitação das alterações.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">12. Lei Aplicável</h3>
        <p>Estes Termos são regidos pela lei portuguesa. Litígios serão submetidos aos tribunais competentes da comarca de Lisboa.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">13. Contacto</h3>
        <p>Email: gkperformancehub.pt@gmail.com<br />Responsável: Guilherme Fernandes</p>
      </section>
    </div>
  );
}
