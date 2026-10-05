import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Check,
  Crown,
  FileDown,
  FolderKanban,
  HeartHandshake,
  Library,
  Shield,
  Sparkles,
  Star,
  UserRound,
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

const MATRIX: Array<
  | { type: 'permission'; key: string; label: string }
  | { type: 'limit'; key: 'characters' | 'projects'; label: string }
> = [
  { type: 'limit', key: 'characters', label: 'Personagens salvos' },
  { type: 'limit', key: 'projects', label: 'Campanhas / one-shots / playtests' },
  { type: 'permission', key: 'downloads.rulebook_pdf', label: 'Livro Básico em PDF' },
  { type: 'permission', key: 'downloads.adversary_book_pdf', label: 'Livro de Adversários em PDF' },
  { type: 'permission', key: 'downloads.all_official_pdfs', label: 'Biblioteca oficial de PDFs' },
  { type: 'permission', key: 'community.supporter_badge', label: 'Selo de apoiador' },
  { type: 'permission', key: 'community.guardian_badge', label: 'Insígnia Guardião' },
  { type: 'permission', key: 'community.name_credit', label: 'Crédito de apoiador' }
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
  const [activePlanSlug, setActivePlanSlug] = useState<string>('aberto');
  const [interestPlan, setInterestPlan] = useState<string | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
    let alive = true;

    Promise.all([
      communityService.listarPlanos(),
      communityService.assinaturaAtual().catch(() => null)
    ])
      .then(([catalog, membership]) => {
        if (!alive) return;
        setPlans(catalog);
        setActivePlanSlug(membership?.plan.slug || 'aberto');
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

  const featuredPlan = plans.find(plan => plan.destaque);
  const currentPlan = plans.find(plan => plan.slug === activePlanSlug) || plans.find(plan => plan.slug === 'aberto') || null;
  const canDownloadRulebook = communityService.temPermissao(currentPlan, 'downloads.rulebook_pdf');
  const canDownloadAdversaries = communityService.temPermissao(currentPlan, 'downloads.adversary_book_pdf');
  const hasOfficialLibrary = communityService.temPermissao(currentPlan, 'downloads.all_official_pdfs');

  const scrollToPlans = () => {
    document.getElementById('community-levels')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const downloadOfficialDocument = async (slug: string) => {
    setDownloadingSlug(slug);
    setDownloadMessage('');

    try {
      const download = await communityService.baixarDocumentoOficial(slug);
      const link = document.createElement('a');
      link.href = download.url;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloadMessage(`${download.title}: link protegido liberado por ${download.expiresIn} segundos.`);
    } catch (error: any) {
      setDownloadMessage(error?.message || 'Não foi possível baixar este documento agora.');
    } finally {
      setDownloadingSlug(null);
    }
  };

  const selectPlan = async (plan: CommunityPlan) => {
    if (plan.rank === 0 || plan.slug === activePlanSlug) return;

    setInterestPlan(plan.slug);
    setInterestMessage('');

    try {
      await communityService.entrarListaInteresse(plan.id, billing);
      setInterestMessage(
        `${plan.nome} registrado. Quando o checkout for conectado, sua preferência já estará salva.`
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
          <p className="ro-eyebrow">Clube da Vigília</p>
          <h1>Mais espaço para suas mesas.<br /><em>Mais Reinos Oníricos na sua biblioteca.</em></h1>
          <p>
            Os níveis de apoio foram desenhados para uma equipe pequena conseguir sustentar de verdade:
            você recebe capacidade maior na plataforma, PDFs oficiais e identidade de apoiador. Sem promessa
            de kit mensal, conteúdo semanal ou benefício que dependa de uma produção impossível de manter.
          </p>

          <div className="ro-community-v3__hero-actions">
            <button type="button" className="is-primary" onClick={scrollToPlans}>
              Ver níveis <ArrowRight />
            </button>
            <span><Shield /> O Compêndio online e o núcleo necessário para conhecer o sistema continuam no acesso base.</span>
          </div>
        </div>

        <aside className="ro-community-v3__manifest">
          <HeartHandshake />
          <p className="ro-eyebrow">Princípio do clube</p>
          <blockquote>
            “A assinatura aumenta capacidade e biblioteca. Ela não cria uma dívida infinita de conteúdo para o projeto.”
          </blockquote>
          {featuredPlan ? (
            <small><Sparkles /> Recomendado para Mestres: {featuredPlan.nome}</small>
          ) : null}
        </aside>
      </header>

      <section className="ro-community-v3__promise">
        <article>
          <BookOpenText />
          <div><strong>Compêndio para todos</strong><span>As regras continuam consultáveis dentro do sistema.</span></div>
        </article>
        <article>
          <FolderKanban />
          <div><strong>Limite simples</strong><span>Campanha, one-shot e playtest usam a mesma cota de projetos.</span></div>
        </article>
        <article>
          <FileDown />
          <div><strong>PDF como benefício real</strong><span>Assinantes levam os livros oficiais para leitura offline.</span></div>
        </article>
      </section>

      <section id="community-levels" className="ro-community-v3__levels">
        <div className="ro-community-v3__section-head">
          <div>
            <p className="ro-eyebrow">Níveis da comunidade</p>
            <h2>Escolha o espaço que sua mesa precisa.</h2>
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

                  <div className="ro-community-v3__capacity">
                    <div>
                      <UserRound />
                      <span><strong>{plan.limits.characters}</strong><small>personagens</small></span>
                    </div>
                    <div>
                      <FolderKanban />
                      <span><strong>{plan.limits.projects}</strong><small>projetos de mesa</small></span>
                    </div>
                  </div>

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

                  <button
                    type="button"
                    className={plan.destaque ? 'is-primary' : ''}
                    disabled={isFree || isCurrent || interestPlan === plan.slug}
                    onClick={() => void selectPlan(plan)}
                  >
                    {isCurrent
                      ? 'Seu nível atual'
                      : isFree
                        ? 'Acesso base'
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
          Os limites já são regras reais da plataforma. O checkout ainda não realiza cobrança; por enquanto o botão apenas registra interesse.
        </p>
      </section>

      <section className="ro-community-v3__library">
        <div className="ro-community-v3__section-head">
          <div>
            <p className="ro-eyebrow">Biblioteca digital</p>
            <h2>Seus livros, protegidos pelo seu nível.</h2>
          </div>
          <p>
            Os arquivos não ficam expostos em uma URL pública. Quando seu nível permite o download,
            o sistema gera um link temporário e individual para o PDF.
          </p>
        </div>

        <div className="ro-community-v3__library-grid">
          <article className={canDownloadRulebook ? 'is-unlocked' : 'is-locked'}>
            <div><BookOpenText /></div>
            <p className="ro-eyebrow">Vigília+</p>
            <h3>Livro Básico em PDF</h3>
            <p>A versão digital oficial do livro de regras para estudar e levar para a mesa offline.</p>
            <button
              type="button"
              disabled={!canDownloadRulebook || downloadingSlug === 'livro-basico'}
              onClick={() => void downloadOfficialDocument('livro-basico')}
            >
              {canDownloadRulebook
                ? downloadingSlug === 'livro-basico' ? 'Preparando…' : 'Baixar Livro Básico'
                : 'Disponível a partir do Vigília'}
              {canDownloadRulebook ? <FileDown /> : <Shield />}
            </button>
          </article>

          <article className={canDownloadAdversaries ? 'is-unlocked' : 'is-locked'}>
            <div><Users /></div>
            <p className="ro-eyebrow">Círculo+</p>
            <h3>Livro de Adversários em PDF</h3>
            <p>O bestiário oficial entra na biblioteca a partir do Círculo, junto do Livro Básico.</p>
            <button
              type="button"
              disabled={!canDownloadAdversaries || downloadingSlug === 'livro-adversarios'}
              onClick={() => void downloadOfficialDocument('livro-adversarios')}
            >
              {canDownloadAdversaries
                ? downloadingSlug === 'livro-adversarios' ? 'Preparando…' : 'Baixar Livro de Adversários'
                : 'Disponível a partir do Círculo'}
              {canDownloadAdversaries ? <FileDown /> : <Shield />}
            </button>
          </article>

          <article className={hasOfficialLibrary ? 'is-unlocked' : 'is-locked'}>
            <div><Library /></div>
            <p className="ro-eyebrow">Guardião</p>
            <h3>Biblioteca oficial</h3>
            <p>
              O Guardião recebe os PDFs oficiais que forem liberados para o clube, sem calendário artificial
              e sem obrigação de produzir material todo mês.
            </p>
            <div className="ro-community-v3__library-status">
              {hasOfficialLibrary ? <Check /> : <Shield />}
              <span>{hasOfficialLibrary ? 'Biblioteca completa habilitada' : 'Disponível no Guardião'}</span>
            </div>
          </article>
        </div>

        {downloadMessage ? (
          <div className="ro-community-v3__download-message">
            <BadgeCheck /> {downloadMessage}
          </div>
        ) : null}
      </section>

      {!loading && plans.length > 0 ? (
        <section className="ro-community-v3__compare">
          <div className="ro-community-v3__section-head">
            <div>
              <p className="ro-eyebrow">Comparação completa</p>
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
                    <th>Benefício / limite</th>
                    {plans.map(plan => <th key={plan.id}>{plan.nome}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map(item => (
                    <tr key={item.key}>
                      <td>{item.label}</td>
                      {plans.map(plan => (
                        <td key={plan.id}>
                          {item.type === 'limit'
                            ? <strong>{plan.limits[item.key]}</strong>
                            : communityService.temPermissao(plan, item.key)
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

      <section className="ro-community-v3__quota-note">
        <Shield />
        <div>
          <p className="ro-eyebrow">Como as cotas funcionam</p>
          <h3>Nada é apagado automaticamente se você mudar de nível.</h3>
          <p>
            Personagens e projetos existentes continuam preservados. Se a conta ficar acima da cota do novo nível,
            o sistema apenas bloqueia novas criações até você excluir algo ou voltar para um nível com mais espaço.
            Campanhas, one-shots e playtests contam juntos como “projetos de mesa”.
          </p>
        </div>
      </section>

      <section className="ro-community-v3__closing">
        <div>
          <p className="ro-eyebrow">Clube da Vigília</p>
          <h2>Um modelo que o projeto consegue cumprir daqui a um ano — não só no mês do lançamento.</h2>
          <p>
            A assinatura financia a plataforma e oferece algo objetivo em troca: espaço, livros digitais e reconhecimento.
            O time não precisa fabricar um novo pacote toda semana para justificar a existência do plano.
          </p>
        </div>
        <div className="ro-community-v3__closing-seal">
          <Crown />
          <strong>Sustentável por design</strong>
          <small>Mais valor para o usuário sem criar uma operação impossível para a equipe.</small>
        </div>
      </section>
    </section>
  );
};

export default CommunityView;
