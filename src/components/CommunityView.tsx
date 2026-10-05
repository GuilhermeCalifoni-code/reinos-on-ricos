import React from 'react';
import {
  BadgeCheck,
  BookOpenText,
  Crown,
  HeartHandshake,
  LockKeyhole,
  Map,
  Sparkles,
  Users,
  WandSparkles
} from 'lucide-react';

const freeFeatures = [
  {
    icon: Users,
    title: 'Mesas e criadores',
    text: 'Descubra campanhas, ideias e pessoas que também atravessam a Vigília.'
  },
  {
    icon: BookOpenText,
    title: 'Arquivo da comunidade',
    text: 'Um espaço para novidades, materiais públicos e conteúdos compartilhados.'
  },
  {
    icon: HeartHandshake,
    title: 'Conexões',
    text: 'Acompanhe o crescimento do sistema e participe dos próximos passos do projeto.'
  }
];

const premiumFeatures = [
  {
    icon: BadgeCheck,
    title: 'Selo de apoiador',
    text: 'Identidade especial no perfil e reconhecimento dentro da comunidade.'
  },
  {
    icon: Map,
    title: 'Packs exclusivos',
    text: 'Mapas, handouts, modelos de campanha e materiais prontos para levar à mesa.'
  },
  {
    icon: Sparkles,
    title: 'Conteúdo antecipado',
    text: 'Acesso antecipado a recursos, playtests e novidades do Reinos Oníricos.'
  },
  {
    icon: LockKeyhole,
    title: 'Arquivo reservado',
    text: 'Conteúdos e espaços exclusivos para quem sustenta o desenvolvimento do projeto.'
  }
];

export const CommunityView: React.FC = () => {
  const scrollToPremium = () => {
    document.getElementById('clube-da-vigilia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="ro-community">
      <div className="ro-community__ornament" aria-hidden="true">
        <img src="/ro-login-frame.webp" alt="" />
      </div>

      <header className="ro-community__hero">
        <div className="ro-community__hero-copy">
          <p className="ro-eyebrow">Comunidade Reinos Oníricos</p>
          <h1>O Sonhar fica maior quando é compartilhado.</h1>
          <p>
            Um ponto de encontro para Mestres, jogadores, criadores e apoiadores do projeto.
            A comunidade será o lugar para descobrir mesas, materiais e tudo que nasce ao redor de Reinos Oníricos.
          </p>
          <div className="ro-community__hero-actions">
            <button type="button" className="ro-community__primary" onClick={scrollToPremium}>
              <Crown /> Conhecer o Clube da Vigília
            </button>
            <span><Sparkles /> A comunidade está sendo preparada por etapas.</span>
          </div>
        </div>

        <aside className="ro-community__sigil" aria-label="Manifesto da comunidade">
          <div>
            <HeartHandshake />
            <span>Comunidade</span>
          </div>
          <blockquote>
            “Alguns atravessam a fissura sozinhos.<br />
            Outros constroem um caminho para todos.”
          </blockquote>
        </aside>
      </header>

      <section className="ro-community__free">
        <div className="ro-community__section-head">
          <div>
            <p className="ro-eyebrow">Para todos os Desvelados</p>
            <h2>A comunidade começa aberta.</h2>
          </div>
          <p>O acesso básico continuará sendo um espaço de encontro, descoberta e participação.</p>
        </div>

        <div className="ro-community__feature-grid">
          {freeFeatures.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <span><Icon /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="clube-da-vigilia" className="ro-community__premium">
        <div className="ro-community__premium-copy">
          <div className="ro-community__premium-badge"><Crown /> Clube da Vigília</div>
          <h2>Para quem quer sustentar o projeto e receber mais em troca.</h2>
          <p>
            O Clube da Vigília será a camada premium da comunidade. A ideia é financiar a evolução da plataforma
            sem transformar recursos essenciais de jogo em barreiras.
          </p>

          <div className="ro-community__premium-note">
            <Sparkles />
            <span>
              A assinatura ainda não está sendo cobrada. Esta área já deixa a estrutura pronta para receber o checkout
              quando os benefícios e valores forem definidos.
            </span>
          </div>
        </div>

        <div className="ro-community__premium-card">
          <div className="ro-community__premium-card-head">
            <span>Assinatura de apoiador</span>
            <strong>Clube da Vigília</strong>
            <small>Conteúdo, identidade e acesso antecipado.</small>
          </div>

          <div className="ro-community__premium-features">
            {premiumFeatures.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon />
                <span><strong>{title}</strong><small>{text}</small></span>
              </div>
            ))}
          </div>

          <button type="button" disabled>
            Assinatura em breve
          </button>
          <small className="ro-community__premium-footnote">
            Nenhuma cobrança é feita nesta versão.
          </small>
        </div>
      </section>
    </section>
  );
};

export default CommunityView;
