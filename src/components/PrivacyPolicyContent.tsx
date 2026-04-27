import { useLanguage } from "@/contexts/LanguageContext";

export function PrivacyPolicyContent() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <div className="prose prose-invert max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
        <h2 className="font-display text-xl">Privacy Policy</h2>

        <section>
          <h3 className="font-semibold text-base">1. Introduction</h3>
          <p>
            This Privacy Policy describes how <strong>Guilherme Fernandes</strong> (the “Seller”, “we”, “us”), trading as <strong>GK Performance Hub</strong>, collects, uses and protects the personal data of users of our goalkeeper training application (the “App”). The Seller is the <strong>data controller</strong> of personal data collected through the App. By using the App, you agree to the terms described here.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base">2. Data Collected</h3>
          <p><strong>2.1 Data provided by the user:</strong> full name, email address, phone number, date of birth, sports profile information (level, position, training history).</p>
          <p><strong>2.2 Usage data:</strong> training and performance history, interactions with the App, preferences and settings.</p>
          <p><strong>2.3 Payment data:</strong> billing information needed to process payments (e.g., transaction ID, payment method, billing country) is collected and processed directly by our Merchant of Record, <strong>Paddle.com Market Limited</strong> (“Paddle”). We do not store full bank card data.</p>
          <p><strong>2.4 Technical data:</strong> IP address, device type, operating system, access logs.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">3. Purpose of Processing</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and improve training services</li>
            <li>Personalize training plans</li>
            <li>Process payments and subscriptions (via Paddle)</li>
            <li>Communicate with the user (support, notifications, updates)</li>
            <li>Ensure security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-base">4. Legal Basis for Processing</h3>
          <p>We process your personal data on the following legal bases under the GDPR:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Performance of a contract</strong> (Art. 6(1)(b)) — to provide the App and the services you subscribe to (account creation, training delivery, subscription management).</li>
            <li><strong>Legitimate interests</strong> (Art. 6(1)(f)) — to secure the App, prevent fraud and abuse, and improve the product.</li>
            <li><strong>Consent</strong> (Art. 6(1)(a)) — for optional analytics, marketing communications and non-essential cookies, which you can withdraw at any time.</li>
            <li><strong>Legal obligation</strong> (Art. 6(1)(c)) — to comply with tax, accounting and other applicable legal duties.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-base">5. Data Sharing</h3>
          <p>We share personal data with the following categories of recipients:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Merchant of Record — Paddle.com Market Limited:</strong> for the sale of the product, subscription management, payment processing, tax compliance, invoicing and refund handling. Paddle acts as an independent data controller for billing data. See Paddle's privacy notice at <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.com/legal/privacy</a>.</li>
            <li><strong>Service providers / subprocessors:</strong> hosting and database (Supabase), authentication, email delivery, analytics and customer support tooling.</li>
            <li><strong>Professional advisers:</strong> legal, accounting and tax advisers where strictly necessary.</li>
            <li><strong>Authorities:</strong> regulators, courts or law enforcement where required by law.</li>
          </ul>
          <p>We never sell your personal data.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">6. International Transfers</h3>
          <p>Some of our service providers may process data outside the EEA/UK. Where this happens, we rely on appropriate safeguards such as the European Commission's Standard Contractual Clauses or adequacy decisions.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">7. Security</h3>
          <p>We adopt appropriate technical and organizational measures including encryption in transit, restricted access to personal information, and system monitoring. Despite this, no system is completely secure.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">8. Data Retention</h3>
          <p>Data is kept only for the period necessary to fulfil the described purposes, legal obligations (e.g., tax records), and dispute resolution. When no longer needed, data is deleted or anonymised.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">9. User Rights (GDPR)</h3>
          <p>You have the right to access, rectify, request erasure (“right to be forgotten”), restrict or object to processing, data portability, and to withdraw consent at any time. You also have the right to lodge a complaint with a supervisory authority (in Portugal, the CNPD). To exercise these rights, contact us at gkperformancehub.pt@gmail.com — we will respond within one month.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">10. Cookies and Similar Technologies</h3>
          <p>We may use essential cookies for authentication and session management, and optional analytics cookies subject to your consent. You can manage preferences on your device or browser.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">11. Policy Changes</h3>
          <p>We may update this Policy periodically. We will notify users of relevant changes through the App.</p>
        </section>

        <section>
          <h3 className="font-semibold text-base">12. Contact</h3>
          <p>
            Data controller: <strong>Guilherme Fernandes</strong> (trading as GK Performance Hub)<br />
            Email: gkperformancehub.pt@gmail.com
          </p>
          <p className="italic text-muted-foreground">By using this App, you confirm that you have read and understood this Privacy Policy.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none text-sm text-foreground/90 space-y-4 leading-relaxed">
      <h2 className="font-display text-xl">Política de Privacidade</h2>

      <section>
        <h3 className="font-semibold text-base">1. Introdução</h3>
        <p>A presente Política de Privacidade descreve como recolhemos, utilizamos e protegemos os dados pessoais dos utilizadores da nossa aplicação de treinos para guarda-redes (“Aplicação”). Ao utilizar a Aplicação, concorda com os termos aqui descritos.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">2. Dados Recolhidos</h3>
        <p><strong>2.1 Dados fornecidos pelo utilizador:</strong> nome completo, endereço de email, número de telefone, data de nascimento, informação de perfil desportivo (nível, posição, histórico de treinos).</p>
        <p><strong>2.2 Dados de utilização:</strong> histórico de treinos e desempenho, interações com a Aplicação, preferências e configurações.</p>
        <p><strong>2.3 Dados de pagamento:</strong> informações necessárias para processar pagamentos (ex: ID de transação, método de pagamento). Não armazenamos diretamente dados completos de cartões bancários. Os pagamentos são processados por fornecedores externos seguros.</p>
        <p><strong>2.4 Dados técnicos:</strong> endereço IP, tipo de dispositivo, sistema operativo, logs de acesso.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">3. Finalidade do Tratamento</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fornecer e melhorar os serviços de treino</li>
          <li>Personalizar planos de treino</li>
          <li>Processar pagamentos e subscrições</li>
          <li>Comunicar com o utilizador (suporte, notificações, atualizações)</li>
          <li>Garantir segurança e prevenir fraude</li>
          <li>Cumprir obrigações legais</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base">4. Partilha de Dados</h3>
        <p>Podemos partilhar dados com prestadores de serviços (ex: processamento de pagamentos, armazenamento cloud), autoridades legais quando exigido por lei, e parceiros técnicos exclusivamente para funcionamento da Aplicação. Nunca vendemos os seus dados pessoais.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">5. Segurança</h3>
        <p>Adotamos medidas técnicas e organizativas adequadas, incluindo encriptação de dados sensíveis, acesso restrito a informação pessoal e monitorização de sistemas. Apesar disso, nenhum sistema é totalmente seguro.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">6. Retenção de Dados</h3>
        <p>Os dados serão mantidos apenas pelo período necessário para cumprir as finalidades descritas, obrigações legais e resolução de disputas.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">7. Direitos do Utilizador</h3>
        <p>Nos termos da legislação aplicável (ex: RGPD), o utilizador tem direito a aceder aos seus dados, retificar dados incorretos, solicitar eliminação (“direito ao esquecimento”), limitar ou opor-se ao tratamento, e à portabilidade dos dados. Para exercer estes direitos, contacte-nos através de gkperformancehub.pt@gmail.com.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">8. Pagamentos e Subscrições</h3>
        <p>Todos os pagamentos são processados por plataformas seguras de terceiros. A Aplicação pode oferecer planos de subscrição renováveis automaticamente. O utilizador pode cancelar a subscrição a qualquer momento através das definições da conta.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">9. Cookies e Tecnologias Semelhantes</h3>
        <p>Podemos utilizar cookies ou tecnologias similares para melhorar a experiência do utilizador e analisar a utilização da Aplicação. O utilizador pode gerir preferências no seu dispositivo.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">10. Alterações à Política</h3>
        <p>Podemos atualizar esta Política periodicamente. Notificaremos os utilizadores em caso de alterações relevantes.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">11. Contacto</h3>
        <p>Email: gkperformancehub.pt@gmail.com<br />Responsável pelo tratamento: Guilherme Fernandes</p>
        <p className="italic text-muted-foreground">Ao utilizar esta Aplicação, confirma que leu e compreendeu esta Política de Privacidade.</p>
      </section>
    </div>
  );
}
