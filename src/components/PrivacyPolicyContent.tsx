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
        <p>
          A presente Política de Privacidade descreve como <strong>Guilherme Fernandes</strong> (o “Vendedor”, “nós”), a operar sob o nome <strong>GK Performance Hub</strong>, recolhe, utiliza e protege os dados pessoais dos utilizadores da nossa aplicação de treinos para guarda-redes (a “Aplicação”). O Vendedor é o <strong>responsável pelo tratamento</strong> dos dados pessoais recolhidos através da Aplicação. Ao utilizar a Aplicação, concorda com os termos aqui descritos.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base">2. Dados Recolhidos</h3>
        <p><strong>2.1 Dados fornecidos pelo utilizador:</strong> nome completo, endereço de email, número de telefone, data de nascimento, informação de perfil desportivo (nível, posição, histórico de treinos).</p>
        <p><strong>2.2 Dados de utilização:</strong> histórico de treinos e desempenho, interações com a Aplicação, preferências e configurações.</p>
        <p><strong>2.3 Dados de pagamento:</strong> os dados de faturação necessários para processar pagamentos (ex: ID de transação, método de pagamento, país de faturação) são recolhidos e tratados diretamente pelo nosso Comerciante Registado, <strong>Paddle.com Market Limited</strong> (“Paddle”). Não armazenamos dados completos de cartões bancários.</p>
        <p><strong>2.4 Dados técnicos:</strong> endereço IP, tipo de dispositivo, sistema operativo, logs de acesso.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">3. Finalidade do Tratamento</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Fornecer e melhorar os serviços de treino</li>
          <li>Personalizar planos de treino</li>
          <li>Processar pagamentos e subscrições (através da Paddle)</li>
          <li>Comunicar com o utilizador (suporte, notificações, atualizações)</li>
          <li>Garantir segurança e prevenir fraude</li>
          <li>Cumprir obrigações legais</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base">4. Fundamento Legal do Tratamento</h3>
        <p>Tratamos os seus dados pessoais com base nos seguintes fundamentos legais ao abrigo do RGPD:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Execução do contrato</strong> (Art. 6.º, n.º 1, al. b)) — para fornecer a Aplicação e os serviços que subscreve (criação de conta, entrega de treinos, gestão de subscrições).</li>
          <li><strong>Interesses legítimos</strong> (Art. 6.º, n.º 1, al. f)) — para garantir a segurança da Aplicação, prevenir fraude e abuso, e melhorar o produto.</li>
          <li><strong>Consentimento</strong> (Art. 6.º, n.º 1, al. a)) — para analítica opcional, comunicações de marketing e cookies não essenciais, podendo retirá-lo a qualquer momento.</li>
          <li><strong>Obrigação legal</strong> (Art. 6.º, n.º 1, al. c)) — para cumprir deveres fiscais, contabilísticos e outras obrigações legais aplicáveis.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base">5. Partilha de Dados</h3>
        <p>Partilhamos dados pessoais com as seguintes categorias de destinatários:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Comerciante Registado — Paddle.com Market Limited:</strong> para venda do produto, gestão de subscrições, processamento de pagamentos, conformidade fiscal, faturação e gestão de reembolsos. A Paddle atua como responsável de tratamento independente para os dados de faturação. Ver a política de privacidade da Paddle em <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">paddle.com/legal/privacy</a>.</li>
          <li><strong>Prestadores de serviços / subcontratantes:</strong> alojamento e base de dados (Supabase), autenticação, envio de email, analítica e ferramentas de suporte ao cliente.</li>
          <li><strong>Consultores profissionais:</strong> consultores jurídicos, contabilísticos e fiscais, quando estritamente necessário.</li>
          <li><strong>Autoridades:</strong> reguladores, tribunais ou autoridades policiais quando exigido por lei.</li>
        </ul>
        <p>Nunca vendemos os seus dados pessoais.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">6. Transferências Internacionais</h3>
        <p>Alguns dos nossos prestadores de serviços podem tratar dados fora do EEE/Reino Unido. Quando isso acontece, recorremos a salvaguardas adequadas, como as Cláusulas Contratuais Tipo da Comissão Europeia ou decisões de adequação.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">7. Segurança</h3>
        <p>Adotamos medidas técnicas e organizativas adequadas, incluindo encriptação em trânsito, acesso restrito a informação pessoal e monitorização de sistemas. Apesar disso, nenhum sistema é totalmente seguro.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">8. Retenção de Dados</h3>
        <p>Os dados são mantidos apenas pelo período necessário para cumprir as finalidades descritas, obrigações legais (ex: registos fiscais) e resolução de disputas. Quando deixarem de ser necessários, são eliminados ou anonimizados.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">9. Direitos do Utilizador (RGPD)</h3>
        <p>Tem direito a aceder, retificar, solicitar eliminação (“direito ao esquecimento”), limitar ou opor-se ao tratamento, à portabilidade dos dados, e a retirar o consentimento a qualquer momento. Tem também o direito de apresentar reclamação a uma autoridade de controlo (em Portugal, a CNPD). Para exercer estes direitos, contacte-nos através de gkperformancehub.pt@gmail.com — responderemos no prazo de um mês.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">10. Cookies e Tecnologias Semelhantes</h3>
        <p>Podemos utilizar cookies essenciais para autenticação e gestão de sessão, e cookies de analítica opcionais sujeitos ao seu consentimento. Pode gerir preferências no seu dispositivo ou navegador.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">11. Alterações à Política</h3>
        <p>Podemos atualizar esta Política periodicamente. Notificaremos os utilizadores de alterações relevantes através da Aplicação.</p>
      </section>

      <section>
        <h3 className="font-semibold text-base">12. Contacto</h3>
        <p>
          Responsável pelo tratamento: <strong>Guilherme Fernandes</strong> (a operar sob o nome GK Performance Hub)<br />
          Email: gkperformancehub.pt@gmail.com
        </p>
        <p className="italic text-muted-foreground">Ao utilizar esta Aplicação, confirma que leu e compreendeu esta Política de Privacidade.</p>
      </section>
    </div>
  );
}
