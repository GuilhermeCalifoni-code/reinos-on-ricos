import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Check,
  Crown,
  HeartHandshake,
  LockKeyhole,
  Package,
  Shield,
  Sparkles,
  Star,
  Users
} from 'lucide-react';
import {
  CommunityPlan,
  communityService
} from '../services/community/communityService';

type BillingCycle = 'monthly' | 'annual';

const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(cents / 100);

const MATRIX = [
  { key: 'community.read_public', label: 'Comunidade pública' },
  { key: 'community.post', label: 'Publicar e interagir' },
  { key: 'community.private_lounge', label: 'Salão reservado' },
  { key: 'community.supporter_badge', label: 'Selo de apoiador' },
  { key: 'content.early_access', label: 'Conteúdo antecipado' },
  { key: 'community.vote_roadmap', label: 'Voto no roadmap' },
  { key: 'content.playtest_priority', label: 'Prioridade em playtests' },
  { key: 'content.hires_assets', label: 'Assets em alta resolução' },
  { key: 'creator.publish_pack', label: 'Publicar packs' },
  { key: 'kits.full_archive', label: 'Arquivo premium completo' },
  { key: 'creator.featured_profile', label: 'Criador em destaque' },
  { key: 'community.name_credit', label: 'Crédito de apoiador' }
];

const tierIcon = (plan: CommunityPlan) => {
  if (plan.slug === 'guardiao') return Crown;
  if (plan.slug === 'circulo') return Star;
  if (plan.slug === 'vigilia') return BadgeCheck;
  return HeartHandshake;
};

export const CommunityView: React.FC = () => {
  const [plans, setPlans] = useState<CommunityPlan[]>([]);
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [activePlanSlug, setActivePlanSlug] = useState<string | null>(null);
  const [interestPlan, setInterestPlan] = useState<string | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    let alive = true;

    Promise.all([
      communityService.listarPlanos(),
      communityService.assinaturaAtual().catch(() => null)
    ])
      .then(([catalog, membership]) => {
        if (!alive) return;
        setPlans(catalog);
        setActivePlanSlug(membership?.plan.slug || null);
      })
      .catch((error: any) => {
        if (!alive) return;
        setCatalogError(error?.message || 'Não foi possível carregar os níveis da comunidade.');
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const premiumPlans = useMemo(
    () => plans.filter(plan => plan.rank > 0),
    [plans]
  );

  const featuredPlan = plans.find(plan => plan.destaque);

  const scrollToPlans = () => {
    document.getElementById('community-levels')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectPlan = async (plan: CommunityPlan) => {
    if (plan.rank === 0 || plan.slug === activePlanSlug) return;

    setInterestPlan(plan.slug);
    setInterestMessage('');

    try {
      await communityService.entrarListaInteresse(plan.id, billing);
      setInterestMessage(
        `${plan.nome} reservado para seu interesse. Quando o checkout abrir, este nível já estará marcado para você.`
      );
    } catch (error: any) {
      setInterestMessage(error?.message || 'Não foi possível registrar seu interesse agora.');
    } finally {
      setInterestPlan(null);
    }
  };

  return (
    <section className="ro-community-v3">
      <header className="ro-community-v3__hero">
        <div className="ro-community-v3__hero-art" aria-hidden="true" />
        <div className="ro-community-v3__hero-copy">
          <p className="ro-eyebrow">Comunidade Reinos Oníricos</p>
          <h1>Entre para a Vigília.<br /><em>Ajude o Sonhar a crescer.</em></h1>
          <p>
            Uma comunidade para encontrar mesas, compartilhar criações, acompanhar o desenvolvimento
            e receber materiais que realmente economizam preparação. O jogo essencial continua aberto;
            o apoio pago existe para ampliar o universo, não para bloquear a mesa.
          </p>

          <div className="ro-community-v3__hero-actions">
            <button type="button" className="is-primary" onClick={scrollToPlans}>
              Ver níveis de apoio <ArrowRight />
            </button>
            <span><Shield /> Regras, fichas, campanhas e mesa ao vivo continuam no acesso base.</span>
          </div>
        </div>

        <aside className="ro-community-v3__manifest">
          <HeartHandshake />
          <p className="ro-eyebrow">O pacto da comunidade</p>
          <blockquote>
            “Apoiar Reinos Oníricos deve entregar mais mundo para a mesa — nunca tirar o que já permite jogar.”
          </blockquote>
          {featuredPlan ? (
            <small><Sparkles /> Mais escolhido: {featuredPlan.nome}</small>
          ) : null}
        </aside>
      </header>

      <section className="ro-community-v3__promise">
        <article>
          <BookOpenText />
          <div><strong>O livro não vira paywall</strong><span>Compêndio e regras essenciais continuam acessíveis.</span></div>
        </article>
        <article>
          <Users />
          <div><strong>A comunidade começa aberta</strong><span>Descoberta de mesas, posts e arquivo público para todos.</span></div>
        </article>
        <article>
          <Package />
          <div><strong>Você paga por expansão</strong><span>Kits, arquivo premium, antecipação e ferramentas de criador.</span></div>
        </article>
      </section>

      <section id="community-levels" className="ro-community-v3__levels">
        <div className="ro-community-v3__section-head">
          <div>
            <p className="ro-eyebrow">Níveis da comunidade</p>
            <h2>Escolha até onde quer atravessar.</h2>
          </div>

          <div className="ro-community-v3__billing" role="group" aria-label="Periodicidade">
            <button type="button" className={billing === 'monthly' ? 'is-active' : ''} onClick={() => setBilling('monthly')}>
              Mensal
            </button>
            <button type="button" className={billing === 'annual' ? 'is-active' : ''} onClick={() => setBilling('annual')}>
              Anual <small>2 meses de vantagem</small>
            </button>
          </div>
        </div>

        {catalogError ? (
          <div className="ro-community-v3__state">{catalogError}</div>
        ) : loading ? (
          <div className="ro-community-v3__state">Abrindo o arquivo da comunidade…</div>
        ) : (
          <div className="ro-community-v3__plan-grid">
            {plans.map(plan => {
              const Icon = tierIcon(plan);
              const cents = billing === 'annual' ? plan.precoAnualCentavos : plan.precoMensalCentavos;
              const isCurrent = plan.slug === activePlanSlug;
              const isFree = plan.rank === 0;

              return (
                <article
                  key={plan.id}
                  className={`ro-community-v3__plan ${plan.destaque ? 'is-featured' : ''} ${isCurrent ? 'is-current' : ''}`}
                >
                  {plan.destaque ? <span className="ro-community-v3__popular"><Sparkles /> Recomendado</span> : null}

                  <div className="ro-community-v3__plan-head">
                    <span className="ro-community-v3__tier-icon"><Icon /></span>
                    <div>
                      <p className="ro-eyebrow">Nível {plan.rank}</p>
                      <h3>{plan.nome}</h3>
                    </div>
                  </div>

                  <p className="ro-community-v3__tagline">{plan.tagline}</p>

                  <div className="ro-community-v3__price">
                    <strong>{isFree ? 'Gratuito' : money(cents)}</strong>
                    {!isFree ? <span>/{billing === 'annual' ? 'ano' : 'mês'}</span> : null}
                  </div>

                  {!isFree && billing === 'annual' ? (
                    <small className="ro-community-v3__annual-note">
                      equivalente a {money(Math.round(plan.precoAnualCentavos / 12))}/mês
                    </small>
                  ) : null}

                  <div className="ro-community-v3__benefits">
                    {plan.benefits.map(benefit => (
                      <div key={benefit.key}>
                        <Check />
                        <span>
                          <strong>{benefit.label}</strong>
                          <small>{benefit.description}</small>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="ro-community-v3__kit-mini">
                    <Package />
                    <span>
                      <small>{isFree ? 'Incluído' : 'Kit do nível'}</small>
                      <strong>{plan.kit.nome}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    className={plan.destaque ? 'is-primary' : ''}
                    disabled={isFree || isCurrent || interestPlan === plan.slug}
                    onClick={() => void selectPlan(plan)}
                  >
                    {isCurrent
                      ? 'Seu nível atual'
                      : isFree
                        ? 'Acesso base incluído'
                        : interestPlan === plan.slug
                          ? 'Registrando…'
                          : 'Quero este nível'}
                    {!isFree && !isCurrent ? <ArrowRight /> : null}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {interestMessage ? (
          <div className="ro-community-v3__interest"><BadgeCheck /> {interestMessage}</div>
        ) : null}

        <p className="ro-community-v3__checkout-note">
          Os preços, níveis e permissões já são dados reais do sistema. O checkout ainda não está conectado;
          por enquanto o botão registra seu interesse sem realizar cobrança.
        </p>
      </section>

      <section className="ro-community-v3__kits">
        <div className="ro-community-v3__section-head">
          <div>
            <p className="ro-eyebrow">Drops para a mesa</p>
            <h2>Kits que justificam a assinatura.</h2>
          </div>
          <p>Não são “brindes” genéricos: cada nível foi desenhado para reduzir preparação e aumentar repertório.</p>
        </div>

        <div className="ro-community-v3__kit-grid">
          {premiumPlans.map(plan => (
            <article key={plan.id} className={plan.destaque ? 'is-featured' : ''}>
              <div className="ro-community-v3__kit-art" aria-hidden="true">
                <img
                  src={
                    plan.slug === 'guardiao'
                      ? '/compendium/compendium-hero.webp'
                      : plan.slug === 'circulo'
                        ? '/compendium/compendium-dice.webp'
                        : '/compendium/compendium-portal.webp'
                  }
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="ro-community-v3__kit-copy">
                <p className="ro-eyebrow">{plan.nome}</p>
                <h3>{plan.kit.nome}</h3>
                <p>{plan.kit.descricao}</p>
                <ul>
                  {plan.kit.itens.map(item => <li key={item}><Check /> {item}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {!loading && plans.length > 0 ? (
        <section className="ro-community-v3__compare">
          <div className="ro-community-v3__section-head">
            <div>
              <p className="ro-eyebrow">Permissões por nível</p>
              <h2>Sem letras pequenas.</h2>
            </div>
            <button type="button" onClick={() => setShowMatrix(value => !value)}>
              {showMatrix ? 'Ocultar comparação' : 'Comparar tudo'} <ArrowRight />
            </button>
          </div>

          {showMatrix ? (
            <div className="ro-community-v3__matrix-wrap">
              <table className="ro-community-v3__matrix">
                <thead>
                  <tr>
                    <th>Permissão</th>
                    {plans.map(plan => <th key={plan.id}>{plan.nome}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map(item => (
                    <tr key={item.key}>
                      <td>{item.label}</td>
                      {plans.map(plan => (
                        <td key={plan.id}>
                          {communityService.temPermissao(plan, item.key)
                            ? <Check aria-label="Incluído" />
                            : <span aria-label="Não incluído">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="ro-community-v3__closing">
        <div>
          <p className="ro-eyebrow">Clube da Vigília</p>
          <h2>Uma assinatura para financiar mais Reinos Oníricos — e devolver isso em conteúdo.</h2>
          <p>
            O objetivo é simples: manter o núcleo jogável para todos e transformar apoio em arte,
            kits, ferramentas, testes e um arquivo cada vez maior.
          </p>
        </div>
        <div className="ro-community-v3__closing-seal">
          <Crown />
          <strong>Sem paywall de regra</strong>
          <small>O apoio compra expansão, não acesso ao básico.</small>
        </div>
      </section>
    </section>
  );
};

export default CommunityView;
