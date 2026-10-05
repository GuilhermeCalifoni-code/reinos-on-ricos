import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Compass,
  FileText,
  Moon,
  RotateCcw,
  Search,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Users,
  X
} from 'lucide-react';
import {
  COMPENDIUM_CATEGORIES,
  COMPENDIUM_ENTRIES,
  CompendiumCategory,
  CompendiumEntry,
  DEFAULT_COMPENDIUM_ENTRY_ID
} from '../rules/compendiumData';
import { getFullCompendiumRule } from '../rules/compendiumFullRules';

interface RecentQuery {
  id: string;
  at: number;
}

interface TopicCard {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
}

const RECENT_KEY = 'reinos_oniricos_compendium_recent_v2';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stopWords = new Set([
  'a', 'as', 'o', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'para', 'por', 'com', 'como', 'que', 'qual', 'quais', 'funciona',
  'posso', 'pode', 'usar', 'uso', 'ser', 'se', 'me', 'meu', 'minha', 'quando', 'quanto'
]);

const searchableText = (entry: CompendiumEntry) =>
  normalize([
    entry.title,
    entry.eyebrow,
    entry.summary,
    entry.answer,
    ...(entry.details || []),
    ...(entry.steps || []),
    ...entry.keywords
  ].join(' '));

const findBestEntry = (query: string): CompendiumEntry => {
  const normalized = normalize(query);
  if (!normalized) {
    return COMPENDIUM_ENTRIES.find(entry => entry.id === DEFAULT_COMPENDIUM_ENTRY_ID) || COMPENDIUM_ENTRIES[0];
  }

  const tokens = normalized.split(' ').filter(token => token.length > 1 && !stopWords.has(token));
  let winner = COMPENDIUM_ENTRIES[0];
  let bestScore = -1;

  for (const entry of COMPENDIUM_ENTRIES) {
    const title = normalize(entry.title);
    const keywords = entry.keywords.map(normalize);
    const haystack = searchableText(entry);

    let score = 0;
    if (title === normalized) score += 80;
    if (title.includes(normalized) || normalized.includes(title)) score += 35;

    for (const keyword of keywords) {
      if (keyword === normalized) score += 36;
      else if (normalized.includes(keyword) || keyword.includes(normalized)) score += 18;
    }

    for (const token of tokens) {
      if (title.includes(token)) score += 11;
      if (keywords.some(keyword => keyword.includes(token))) score += 8;
      if (haystack.includes(token)) score += 2;
    }

    if (entry.featured) score += 0.3;

    if (score > bestScore) {
      bestScore = score;
      winner = entry;
    }
  }

  return winner;
};

const categoryIcon = (category: CompendiumCategory) => {
  switch (category) {
    case 'regras': return BookOpen;
    case 'sonhar': return Moon;
    case 'desvelados': return Users;
    case 'combate': return Swords;
    case 'mestre': return Shield;
    case 'adversarios': return Skull;
    case 'mundo': return Compass;
    case 'referencia': return FileText;
  }
};

const categoryLabel = (category: CompendiumCategory) =>
  COMPENDIUM_CATEGORIES.find(item => item.id === category)?.label || category;

const QUICK_ACCESS_IDS = [
  'criacao-desvelado',
  'teste-onirico',
  'condicoes',
  'acoes-mestre',
  'ficha-adversario',
  'referencia-rapida'
];

const HOME_TOPICS: TopicCard[] = [
  {
    id: 'teste-mundano',
    eyebrow: 'Testes',
    title: 'Testes Mundanos',
    description: 'Use 1d20 + Atributo contra uma DT. Entenda dificuldades, sucesso e consequências.',
    image: '/compendium/compendium-dice.webp'
  },
  {
    id: 'teste-onirico',
    eyebrow: 'Sonhar',
    title: 'Teste Onírico',
    description: 'Realidade e Sonhar contra a mesma DT, com resultados que alteram a Ruptura.',
    image: '/compendium/compendium-desvelado.webp'
  },
  {
    id: 'ruptura',
    eyebrow: 'Ruptura',
    title: 'Ruptura',
    description: 'Entenda a trilha de 0 a 6, Efeitos de Ruptura e o que acontece quando o limite é alcançado.',
    image: '/compendium/compendium-portal.webp'
  },
  {
    id: 'teste-mundano',
    eyebrow: 'Mecânica',
    title: 'Dificuldades (DTs)',
    description: 'Valores de referência para testes triviais, comuns, difíceis e extraordinários.',
    image: '/compendium/compendium-sonhar.webp'
  },
  {
    id: 'condicoes',
    eyebrow: 'Estados',
    title: 'Condições',
    description: 'Estados temporários, seus efeitos e a forma como interferem em ações e manifestações.',
    image: '/compendium/compendium-rupture.webp'
  },
  {
    id: 'acoes-mestre',
    eyebrow: 'Mestre',
    title: 'Ações do Mestre',
    description: 'Ferramentas para ativar ameaças, ambiente e narrativa durante uma Cena de Tensão.',
    image: '/compendium/compendium-desvelado.webp'
  }
];

const imageForEntry = (entry: CompendiumEntry) => {
  if (entry.id === 'teste-mundano' || entry.id === 'intensidade-dano' || entry.category === 'referencia') {
    return '/compendium/compendium-dice.webp';
  }
  if (entry.category === 'sonhar') return '/compendium/compendium-sonhar.webp';
  if (entry.category === 'desvelados') return '/compendium/compendium-desvelado.webp';
  if (entry.category === 'adversarios' || entry.id === 'condicoes') return '/compendium/compendium-rupture.webp';
  if (entry.category === 'mundo') return '/compendium/compendium-hero.webp';
  if (entry.category === 'mestre') return '/compendium/compendium-desvelado.webp';
  return '/compendium/compendium-portal.webp';
};

const formatRecency = (at: number) => {
  const minutes = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.max(1, Math.round(hours / 24));
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
};

export const CompendiumView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CompendiumCategory>('regras');
  const [selectedId, setSelectedId] = useState(DEFAULT_COMPENDIUM_ENTRY_ID);
  const [recent, setRecent] = useState<RecentQuery[]>([]);
  const [showFull, setShowFull] = useState(false);
  const answerRef = useRef<HTMLDivElement | null>(null);
  const categoriesRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentQuery[];
      setRecent(
        Array.isArray(parsed)
          ? parsed.filter(item => COMPENDIUM_ENTRIES.some(entry => entry.id === item.id)).slice(0, 5)
          : []
      );
    } catch {
      setRecent([]);
    }
  }, []);

  const selected = useMemo(
    () => COMPENDIUM_ENTRIES.find(entry => entry.id === selectedId) || COMPENDIUM_ENTRIES[0],
    [selectedId]
  );

  const selectedRule = useMemo(
    () => getFullCompendiumRule(selected.id),
    [selected.id]
  );

  useEffect(() => {
    if (!showFull) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFull(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showFull]);

  const topicCards = useMemo<TopicCard[]>(() => {
    if (category === 'regras') return HOME_TOPICS;

    return COMPENDIUM_ENTRIES
      .filter(entry => entry.category === category)
      .slice(0, 6)
      .map(entry => ({
        id: entry.id,
        eyebrow: entry.eyebrow,
        title: entry.title,
        description: entry.summary,
        image: imageForEntry(entry)
      }));
  }, [category]);

  const saveRecent = (entry: CompendiumEntry) => {
    const next = [{ id: entry.id, at: Date.now() }, ...recent.filter(item => item.id !== entry.id)].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // O histórico é apenas uma conveniência local.
    }
  };

  const openEntry = (entry: CompendiumEntry, scroll = true) => {
    setSelectedId(entry.id);
    setCategory(entry.category);
    setShowFull(false);
    saveRecent(entry);
    if (scroll) {
      window.requestAnimationFrame(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  };

  const submitQuery = (event?: React.FormEvent) => {
    event?.preventDefault();
    const entry = findBestEntry(query);
    openEntry(entry);
  };

  const askAgain = () => {
    setQuery('');
    setShowFull(false);
    window.requestAnimationFrame(() => {
      (document.getElementById('compendium-query') as HTMLInputElement | null)?.focus();
    });
  };

  const selectCategory = (nextCategory: CompendiumCategory) => {
    setCategory(nextCategory);
    setShowFull(false);
    const first = COMPENDIUM_ENTRIES.find(entry => entry.category === nextCategory);
    if (first) setSelectedId(first.id);
  };

  const openTopic = (topic: TopicCard) => {
    const entry = COMPENDIUM_ENTRIES.find(candidate => candidate.id === topic.id);
    if (entry) openEntry(entry);
  };

  const showCompleteRule = () => setShowFull(true);

  const SelectedCategoryIcon = categoryIcon(selected.category);

  return (
    <section className="ro-compendium-final">
      <header className="ro-compendium-final__hero">
        <div className="ro-compendium-final__hero-art" aria-hidden="true" />
        <div className="ro-compendium-final__hero-copy">
          <p className="ro-eyebrow">Referência de mesa</p>
          <h1>Compêndio dos Reinos Oníricos</h1>
          <p>
            Referência completa de regras, mecânicas e cenário dos Reinos Oníricos.
            Busque por termos, faça perguntas e encontre respostas rápidas para usar durante suas sessões.
          </p>
        </div>
        <blockquote>
          “Todo conhecimento<br />
          também é um sonho<br />
          que se lembra de si mesmo.”
          <span aria-hidden="true">✦</span>
        </blockquote>
      </header>

      <div className="ro-compendium-final__layout">
        <main className="ro-compendium-final__main">
          <form className="ro-compendium-final__search" onSubmit={submitQuery}>
            <Search />
            <input
              id="compendium-query"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Pergunte ao Compêndio ou busque uma regra..."
              autoComplete="off"
            />
            <button type="submit" aria-label="Consultar Compêndio"><ArrowRight /></button>
          </form>

          <nav ref={categoriesRef} className="ro-compendium-final__categories" aria-label="Categorias do Compêndio">
            {COMPENDIUM_CATEGORIES.map(item => {
              const Icon = categoryIcon(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={category === item.id ? 'is-active' : ''}
                  onClick={() => selectCategory(item.id)}
                  title={item.description}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <section ref={answerRef} className="ro-compendium-final__answer">
            <div className="ro-compendium-final__answer-copy">
              <div className="ro-compendium-final__answer-kicker">
                <Sparkles />
                <span>Pergunte ao Compêndio</span>
                <em>{categoryLabel(selected.category)}</em>
              </div>
              <h2>{selected.title}</h2>
              <p>{selected.answer}</p>
              <div className="ro-compendium-final__answer-actions">
                <button type="button" className="is-primary" onClick={showCompleteRule}>
                  Ver regra completa <ArrowRight />
                </button>
                <button type="button" onClick={askAgain}>
                  <RotateCcw /> Fazer outra pergunta
                </button>
              </div>
            </div>
            <div className="ro-compendium-final__answer-art" aria-hidden="true" />
          </section>

          <div className="ro-compendium-final__section-title">
            <Sparkles />
            <span>{category === 'regras' ? 'Principais tópicos' : categoryLabel(category)}</span>
            <i />
          </div>

          <section className="ro-compendium-final__topics">
            {topicCards.map(topic => (
              <button key={`${topic.id}-${topic.title}`} type="button" className="ro-compendium-final__topic" onClick={() => openTopic(topic)}>
                <span className="ro-compendium-final__topic-image">
                  <img src={topic.image} alt="" loading="lazy" />
                </span>
                <span className="ro-compendium-final__topic-copy">
                  <em>{topic.eyebrow}</em>
                  <strong>{topic.title}</strong>
                  <small>{topic.description}</small>
                </span>
                <span className="ro-compendium-final__topic-arrow"><ChevronRight /></span>
              </button>
            ))}
          </section>

          <section className="ro-compendium-final__browse">
            <BookOpen />
            <div>
              <strong>Navegue por todas as categorias</strong>
              <small>Explore o compêndio completo e encontre regras, Sonhar, Desvelados, cenário e referências de mesa.</small>
            </div>
            <button type="button" onClick={() => categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              Ver todas as categorias <ArrowRight />
            </button>
          </section>


        </main>

        <aside className="ro-compendium-final__rail">
          <section className="ro-compendium-final__rail-card">
            <div className="ro-compendium-final__rail-title"><Sparkles /><span>Acesso rápido</span></div>
            <div className="ro-compendium-final__quick">
              {QUICK_ACCESS_IDS.map(id => {
                const entry = COMPENDIUM_ENTRIES.find(item => item.id === id);
                if (!entry) return null;
                const Icon = categoryIcon(entry.category);
                return (
                  <button key={entry.id} type="button" onClick={() => openEntry(entry)}>
                    <Icon />
                    <span><strong>{entry.title}</strong><small>{entry.summary}</small></span>
                    <ChevronRight />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ro-compendium-final__reference-card">
            <div className="ro-compendium-final__reference-image">
              <img src="/compendium/compendium-dice.webp" alt="" loading="lazy" />
            </div>
            <div>
              <p className="ro-eyebrow">Referência rápida</p>
              <h3>As tabelas e regras essenciais para sua mesa, sempre à mão.</h3>
              <button type="button" onClick={() => {
                const entry = COMPENDIUM_ENTRIES.find(item => item.id === 'referencia-rapida');
                if (entry) openEntry(entry);
              }}>
                Ver tabelas e resumos <ArrowRight />
              </button>
            </div>
          </section>

          <section className="ro-compendium-final__rail-card">
            <div className="ro-compendium-final__rail-title">
              <Clock3 />
              <span>Consultas recentes</span>
              {recent.length > 0 && (
                <button type="button" onClick={() => {
                  setRecent([]);
                  try { window.localStorage.removeItem(RECENT_KEY); } catch {}
                }}>Limpar histórico</button>
              )}
            </div>
            <div className="ro-compendium-final__recent">
              {recent.length === 0 ? (
                <p>As regras consultadas aparecerão aqui.</p>
              ) : recent.map(item => {
                const entry = COMPENDIUM_ENTRIES.find(candidate => candidate.id === item.id);
                if (!entry) return null;
                return (
                  <button key={item.id} type="button" onClick={() => openEntry(entry)}>
                    <Search />
                    <span>{entry.title}</span>
                    <small>{formatRecency(item.at)}</small>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      {showFull && (
        <div
          className="ro-rule-modal"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setShowFull(false);
          }}
        >
          <section className="ro-rule-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="ro-rule-modal-title">
            <header className="ro-rule-modal__header">
              <span className="ro-rule-modal__icon"><SelectedCategoryIcon /></span>
              <div className="ro-rule-modal__heading">
                <p className="ro-eyebrow">{selected.eyebrow} · {categoryLabel(selected.category)}</p>
                <h2 id="ro-rule-modal-title">{selected.title}</h2>
                <p>{selected.summary}</p>
                <span className="ro-rule-modal__source">
                  {selectedRule ? `${selectedRule.source} · pág. ${selectedRule.pages}` : 'Resumo do Compêndio'}
                </span>
              </div>
              <button type="button" className="ro-rule-modal__close" onClick={() => setShowFull(false)} aria-label="Fechar regra completa">
                <X />
              </button>
            </header>

            <div className="ro-rule-modal__body">
              {selectedRule ? selectedRule.sections.map((section, sectionIndex) => (
                <article className="ro-rule-modal__section" key={`${selected.id}-${sectionIndex}`}>
                  {section.title ? <h3>{section.title}</h3> : null}

                  {section.paragraphs?.map((paragraph, paragraphIndex) => (
                    <p key={`p-${paragraphIndex}`}>{paragraph}</p>
                  ))}

                  {section.bullets?.length ? (
                    <ul>
                      {section.bullets.map((bullet, bulletIndex) => (
                        <li key={`b-${bulletIndex}`}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}

                  {section.table ? (
                    <div className="ro-rule-modal__table-wrap">
                      <table>
                        <thead>
                          <tr>{section.table.headers.map(header => <th key={header}>{header}</th>)}</tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, rowIndex) => (
                            <tr key={`row-${rowIndex}`}>
                              {row.map((cell, cellIndex) => <td key={`cell-${cellIndex}`}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {section.note ? <aside className="ro-rule-modal__note">{section.note}</aside> : null}
                </article>
              )) : (
                <>
                  <article className="ro-rule-modal__section">
                    <h3>Regra</h3>
                    <p>{selected.answer}</p>
                  </article>
                  {selected.steps?.length ? (
                    <article className="ro-rule-modal__section">
                      <h3>Como resolver</h3>
                      <ol>{selected.steps.map(step => <li key={step}>{step}</li>)}</ol>
                    </article>
                  ) : null}
                  {selected.details?.length ? (
                    <article className="ro-rule-modal__section">
                      <h3>Detalhes importantes</h3>
                      <ul>{selected.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
                    </article>
                  ) : null}
                </>
              )}
            </div>

            <footer className="ro-rule-modal__footer">
              <BookOpen />
              <span>
                {selectedRule
                  ? 'Conteúdo transcrito e organizado a partir do Livro Básico para consulta durante a mesa.'
                  : 'Esta entrada ainda usa a síntese do Compêndio.'}
              </span>
              <button type="button" onClick={askAgain}>Nova consulta</button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
};

export default CompendiumView;
