import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
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
  TriangleAlert,
  Users
} from 'lucide-react';
import {
  COMPENDIUM_CATEGORIES,
  COMPENDIUM_ENTRIES,
  CompendiumCategory,
  CompendiumEntry,
  DEFAULT_COMPENDIUM_ENTRY_ID,
  DT_REFERENCE
} from '../rules/compendiumData';

type CategoryFilter = 'all' | CompendiumCategory;

interface RecentQuery {
  id: string;
  at: number;
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

const quickAccessIds = [
  'criacao-desvelado',
  'teste-onirico',
  'condicoes',
  'acoes-mestre',
  'ficha-adversario',
  'referencia-rapida'
];

const bookNavigation = [
  { id: 'referencia-rapida', label: 'Comece Aqui', description: 'Visão rápida do sistema' },
  { id: 'criacao-desvelado', label: 'Personagem e Recursos', description: 'Criação, ficha e progressão' },
  { id: 'cena-tensao', label: 'Regras de Combate', description: 'Conflitos, Ações e Movimento' },
  { id: 'guia-sonhar', label: 'O Sonhar', description: 'Possibilidades e limites' },
  { id: 'dominios', label: 'Guia do Sonhar', description: 'Domínios e linguagem dos níveis' },
  { id: 'arbitragem-mestre', label: 'Conduzindo o Jogo', description: 'Ferramentas para o Mestre' },
  { id: 'construir-pesadelo', label: 'Adversários', description: 'Bestiário e criação de ameaças' },
  { id: 'referencia-rapida', label: 'Guia Rápido', description: 'Tabelas e resumos de mesa' }
];

export const CompendiumView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedId, setSelectedId] = useState(DEFAULT_COMPENDIUM_ENTRY_ID);
  const [recent, setRecent] = useState<RecentQuery[]>([]);
  const answerRef = useRef<HTMLDivElement | null>(null);
  const fullRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentQuery[];
      setRecent(Array.isArray(parsed) ? parsed.filter(item => COMPENDIUM_ENTRIES.some(entry => entry.id === item.id)).slice(0, 5) : []);
    } catch {
      setRecent([]);
    }
  }, []);

  const selected = useMemo(
    () => COMPENDIUM_ENTRIES.find(entry => entry.id === selectedId) || COMPENDIUM_ENTRIES[0],
    [selectedId]
  );

  const visibleTopics = useMemo(() => {
    const source = category === 'all'
      ? COMPENDIUM_ENTRIES.filter(entry => entry.featured)
      : COMPENDIUM_ENTRIES.filter(entry => entry.category === category);

    return source.slice(0, category === 'all' ? 6 : 9);
  }, [category]);

  const saveRecent = (entry: CompendiumEntry) => {
    const next = [
      { id: entry.id, at: Date.now() },
      ...recent.filter(item => item.id !== entry.id)
    ].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Histórico local é conveniência; a consulta continua funcional sem ele.
    }
  };

  const openEntry = (entry: CompendiumEntry, scroll = true) => {
    setSelectedId(entry.id);
    setCategory(entry.category);
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
    window.requestAnimationFrame(() => {
      const input = document.getElementById('compendium-query') as HTMLInputElement | null;
      input?.focus();
    });
  };

  const selectedCategoryIcon = categoryIcon(selected.category);
  const SelectedCategoryIcon = selectedCategoryIcon;

  return (
    <section className="ro-compendium-v2">
      <header className="ro-compendium-v2__hero">
        <div className="ro-compendium-v2__hero-art" aria-hidden="true" />
        <div className="ro-compendium-v2__hero-copy">
          <p className="ro-eyebrow">Referência de mesa</p>
          <h1>Compêndio dos Reinos Oníricos</h1>
          <p>
            Referência completa de regras, mecânicas e cenário. Busque por termos,
            faça perguntas e encontre respostas rápidas sem quebrar o ritmo da sessão.
          </p>
        </div>
        <blockquote>
          “Todo conhecimento<br />
          também é um sonho<br />
          que se lembra de si mesmo.”
          <span aria-hidden="true">✦</span>
        </blockquote>
      </header>

      <div className="ro-compendium-v2__layout">
        <main className="ro-compendium-v2__main">
          <form className="ro-compendium-v2__search" onSubmit={submitQuery}>
            <Search />
            <input
              id="compendium-query"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Pergunte ao Compêndio ou busque uma regra..."
              autoComplete="off"
            />
            <span>Ex.: “Posso usar Espaço para atravessar uma parede?”</span>
            <button type="submit" aria-label="Consultar Compêndio"><ArrowRight /></button>
          </form>

          <nav className="ro-compendium-v2__categories" aria-label="Categorias do Compêndio">
            {COMPENDIUM_CATEGORIES.map(item => {
              const Icon = categoryIcon(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={category === item.id ? 'is-active' : ''}
                  onClick={() => setCategory(item.id)}
                  title={item.description}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <section ref={answerRef} className="ro-compendium-answer">
            <div className={`ro-compendium-answer__art is-${selected.art || 'none'}`} aria-hidden="true" />
            <div className="ro-compendium-answer__content">
              <div className="ro-compendium-answer__eyebrow">
                <Sparkles />
                <span>Pergunte ao Compêndio</span>
                <em>{categoryLabel(selected.category)}</em>
              </div>
              <h2>{selected.title}</h2>
              <p className="ro-compendium-answer__summary">{selected.answer}</p>

              <div className="ro-compendium-answer__columns">
                <article>
                  <span className="ro-compendium-answer__number">01</span>
                  <div>
                    <strong>Resposta curta</strong>
                    <p>{selected.summary}</p>
                  </div>
                </article>

                <article>
                  <span className="ro-compendium-answer__number">02</span>
                  <div>
                    <strong>Como resolver</strong>
                    {selected.steps?.length ? (
                      <ol>
                        {selected.steps.slice(0, 4).map(step => <li key={step}>{step}</li>)}
                      </ol>
                    ) : (
                      <p>{selected.details?.[0] || selected.answer}</p>
                    )}
                  </div>
                </article>

                <article>
                  <span className="ro-compendium-answer__number">03</span>
                  <div>
                    <strong>Regra-chave</strong>
                    <p>{selected.details?.[1] || selected.details?.[0] || 'A narrativa define quando a regra entra em jogo e quais consequências fazem sentido.'}</p>
                  </div>
                </article>
              </div>

              <div className="ro-compendium-answer__actions">
                <button type="button" className="is-primary" onClick={() => fullRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <BookOpen /> Ver regra completa <ArrowRight />
                </button>
                <button type="button" onClick={askAgain}><RotateCcw /> Fazer outra pergunta</button>
              </div>
            </div>
          </section>

          <div className="ro-compendium-section-title">
            <div><Sparkles /><span>{category === 'all' ? 'Principais tópicos' : categoryLabel(category)}</span></div>
            {category !== 'all' && <button type="button" onClick={() => setCategory('all')}>Ver principais</button>}
          </div>

          <section className="ro-compendium-topics">
            {visibleTopics.map(entry => {
              const Icon = categoryIcon(entry.category);
              return (
                <button key={entry.id} type="button" className="ro-compendium-topic" onClick={() => openEntry(entry)}>
                  <span className={`ro-compendium-topic__art is-${entry.art || 'none'}`} aria-hidden="true" />
                  <span className="ro-compendium-topic__copy">
                    <em>{entry.eyebrow}</em>
                    <strong>{entry.title}</strong>
                    <small>{entry.summary}</small>
                  </span>
                  <span className="ro-compendium-topic__arrow"><ChevronRight /></span>
                  <span className="ro-compendium-topic__icon"><Icon /></span>
                </button>
              );
            })}
          </section>

          <section className="ro-compendium-dt">
            <div>
              <p className="ro-eyebrow">Referência de DT</p>
              <strong>Teste Mundano</strong>
            </div>
            <div className="ro-compendium-dt__grid">
              {DT_REFERENCE.map(item => (
                <span key={item.value}><strong>{item.value}</strong><small>{item.label}</small></span>
              ))}
            </div>
          </section>

          <section ref={fullRef} className="ro-compendium-full">
            <header>
              <div className="ro-compendium-full__icon"><SelectedCategoryIcon /></div>
              <div>
                <p className="ro-eyebrow">{selected.eyebrow}</p>
                <h2>{selected.title}</h2>
                <p>{selected.summary}</p>
              </div>
            </header>

            <div className="ro-compendium-full__body">
              <article>
                <h3>Regra</h3>
                <p>{selected.answer}</p>
              </article>

              {selected.steps?.length ? (
                <article>
                  <h3>Procedimento</h3>
                  <ol>
                    {selected.steps.map(step => <li key={step}>{step}</li>)}
                  </ol>
                </article>
              ) : null}

              {selected.details?.length ? (
                <article>
                  <h3>Detalhes importantes</h3>
                  <ul>
                    {selected.details.map(detail => <li key={detail}>{detail}</li>)}
                  </ul>
                </article>
              ) : null}
            </div>
          </section>
        </main>

        <aside className="ro-compendium-v2__rail">
          <section className="ro-compendium-rail-card">
            <div className="ro-compendium-rail-card__title"><Sparkles /> <span>Acesso rápido</span></div>
            <div className="ro-compendium-quick">
              {quickAccessIds.map(id => {
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

          <section className="ro-compendium-rail-card">
            <div className="ro-compendium-rail-card__title"><BookOpen /> <span>Navegação do livro</span></div>
            <div className="ro-compendium-book-nav">
              {bookNavigation.map((item, index) => (
                <button key={`${item.id}-${index}`} type="button" onClick={() => {
                  const entry = COMPENDIUM_ENTRIES.find(candidate => candidate.id === item.id);
                  if (entry) openEntry(entry);
                }}>
                  <BookOpen />
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </section>

          <section className="ro-compendium-rail-card ro-compendium-rail-card--visual">
            <div className="ro-compendium-rail-card__visual" aria-hidden="true" />
            <div>
              <p className="ro-eyebrow">Referência rápida</p>
              <h3>As tabelas essenciais sempre à mão.</h3>
              <button type="button" onClick={() => {
                const entry = COMPENDIUM_ENTRIES.find(item => item.id === 'referencia-rapida');
                if (entry) openEntry(entry);
              }}>
                Ver tabelas e resumos <ArrowRight />
              </button>
            </div>
          </section>

          <section className="ro-compendium-rail-card">
            <div className="ro-compendium-rail-card__title">
              <Clock3 />
              <span>Consultas recentes</span>
              {recent.length > 0 && (
                <button type="button" onClick={() => {
                  setRecent([]);
                  try { window.localStorage.removeItem(RECENT_KEY); } catch {}
                }}>Limpar</button>
              )}
            </div>

            <div className="ro-compendium-recent">
              {recent.length === 0 ? (
                <p>As regras que você consultar aparecerão aqui.</p>
              ) : recent.map(item => {
                const entry = COMPENDIUM_ENTRIES.find(candidate => candidate.id === item.id);
                if (!entry) return null;
                return (
                  <button key={item.id} type="button" onClick={() => openEntry(entry)}>
                    <Search />
                    <span>{entry.title}</span>
                    <small>{new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }).format(
                      -Math.max(1, Math.round((Date.now() - item.at) / 60000)),
                      'minute'
                    )}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ro-compendium-rail-card ro-compendium-rail-card--principle">
            <TriangleAlert />
            <div>
              <strong>Princípio de arbitragem</strong>
              <p>O Mestre apresenta o problema. Os Jogadores imaginam soluções. As regras determinam os limites. A narrativa mostra as consequências.</p>
            </div>
          </section>
        </aside>
      </div>

      <div className="ro-compendium-v2__watermark" aria-hidden="true"><Brain /></div>
    </section>
  );
};

export default CompendiumView;
