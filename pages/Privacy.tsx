import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introdução</h2>
          <p className="text-gray-700 mb-4">
            Bem-vindo ao Vestiu Bem! Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza nosso aplicativo de provador virtual.
          </p>
          <p className="text-gray-700 mb-4">
            Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Informações que Coletamos</h2>
          <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Informações Fornecidas por Você</h3>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Nome e endereço de e-mail durante o registro</li>
            <li>Fotos enviadas para o provador virtual</li>
            <li>Preferências de uso do aplicativo</li>
          </ul>

          <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Informações Coletadas Automaticamente</h3>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Dados de uso do aplicativo</li>
            <li>Informações do dispositivo (tipo, sistema operacional)</li>
            <li>Endereço IP e localização aproximada</li>
            <li>Cookies e tecnologias similares</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Como Usamos suas Informações</h2>
          <p className="text-gray-700 mb-4">Utilizamos suas informações para:</p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Fornecer e melhorar nossos serviços de provador virtual</li>
            <li>Processar imagens usando inteligência artificial</li>
            <li>Gerenciar sua conta e fornecer suporte</li>
            <li>Enviar comunicações importantes sobre o serviço</li>
            <li>Analisar o uso do aplicativo para melhorias</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
          <p className="text-gray-700 mb-4">
            Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nas seguintes circunstâncias:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Com seu consentimento explícito</li>
            <li>Para cumprir obrigações legais</li>
            <li>Com provedores de serviços que nos ajudam a operar (sob acordos de confidencialidade)</li>
            <li>Em caso de fusão, aquisição ou venda de ativos</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Armazenamento e Segurança</h2>
          <p className="text-gray-700 mb-4">
            Armazenamos suas informações em servidores seguros e utilizamos medidas técnicas e organizacionais apropriadas para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>
          <p className="text-gray-700 mb-4">
            Suas fotos são processadas temporariamente para o provador virtual e não são armazenadas permanentemente sem seu consentimento.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
          <p className="text-gray-700 mb-4">
            Utilizamos cookies para melhorar sua experiência no aplicativo, lembrar suas preferências e analisar o uso do serviço. Você pode controlar o uso de cookies através das configurações do seu navegador.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seus Direitos</h2>
          <p className="text-gray-700 mb-4">Você tem o direito de:</p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li>Acessar suas informações pessoais</li>
            <li>Corrigir dados inexatos</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Optar por não receber comunicações de marketing</li>
            <li>Portabilidade dos dados</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Para exercer esses direitos, entre em contato conosco através do e-mail: privacy@vestiubem.com
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Retenção de Dados</h2>
          <p className="text-gray-700 mb-4">
            Mantemos suas informações apenas pelo tempo necessário para fornecer nossos serviços, cumprir obrigações legais ou resolver disputas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacidade de Crianças</h2>
          <p className="text-gray-700 mb-4">
            Nosso serviço não é direcionado a crianças menores de 13 anos. Não coletamos intencionalmente informações pessoais de crianças menores de 13 anos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Alterações nesta Política</h2>
          <p className="text-gray-700 mb-4">
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através do aplicativo ou por e-mail.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contato</h2>
          <p className="text-gray-700 mb-4">
            Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:
          </p>
          <p className="text-gray-700 mb-4">
            E-mail: privacy@vestiubem.com<br />
            Endereço: [Seu endereço físico, se aplicável]<br />
            Solicitar remoção de contas: privacy@vestiubem.com<br />
          </p>
        </section>
      </div>
    </div>
  );
};
