import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Compass,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  Users
} from 'lucide-react';
import { Campanha } from '../types/campaign';
import { Personagem } from '../types/character';
import { AssetImage } from './system/AssetImage';

interface CampaignsLibraryViewProps {
  campanhas: Campanha[];
  personagensParaVinculo?: Personagem[];
  onNovaCampanha: () => void;
  onDetalhesCampanha: (campanha: Campanha) => void;
  onContinuarCampanha: (campanha: Campanha) => void;
  onEntrarComCodigo?: (codigo: string, personagemId?: string) => Promise<void>;
}

type Filter = 'todas' | Campanha['status'];
type Sort = 'recentes' | 'nome' | 'sessao';

const statusLabel: Record<Campanha['status'], string> = {
  em_andamento: 'Em andamento',
  planejamento: 'Planejamento',
  concluida: 'Concluída'
};

const statusClass: Record<Campanha['status'], string> = {
  em_andamento: 'is-running',
  planejamento: 'is-planning',
  concluida: 'is-finished'
};

const parseDate = (value?: string) => {
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(time) ? 0 : time;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const time = parseDate(value);
  if (!time) return '';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(time));
};

export const CampaignsLibraryView: React.FC<CampaignsLibraryViewProps> = ({
  campanhas,
  personagensParaVinculo = [],
  onNovaCampanha,
  onDetalhesCampanha,
  onContinuarCampanha,
  onEntrarComCodigo
}) => {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filter>('todas');
  const [ordem, setOrdem] = useState<Sort>('recentes');
  const [mostrarConvite, setMostrarConvite] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [personagemId, setPersonagemId] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  const contagens = useMemo(() => ({
    todas: campanhas.length,
    em_andamento: campanhas.filter(c => c.status === 'em_andamento').length,
    planejamento: campanhas.filter(c => c.status === 'planejamento').length,
    concluida: campanhas.filter(c => c.status === 'concluida').length
  }), [campanhas]);

  const resumo = useMemo(() => ({
    campanhas: campanhas.length,
    jogadores: campanhas.reduce((total, campanha) => total + (campanha.jogadoresCount || 0), 0),
    sessoes: campanhas.reduce((total, campanha) => total + Math.max(0, campanha.sessaoAtual || 0), 0),
    ativas: campanhas.filter(campanha => campanha.status === 'em_andamento').length
  }), [campanhas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const resultado = campanhas.filter(campanha => {
      const statusOk = filtro === 'todas' || campanha.status === filtro;
      const texto = `${campanha.nome} ${campanha.descricao} ${campanha.tipo}`.toLowerCase();
      const textoOk = !termo || texto.includes(termo);
      return statusOk && textoOk;
    });

    return resultado.sort((a, b) => {
      if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
      if (ordem === 'sessao') return (b.sessaoAtual || 0) - (a.sessaoAtual || 0);

      const dataB = parseDate(b.ultimaSessaoData) || parseDate(b.criadaEm);
      const dataA = parseDate(a.ultimaSessaoData) || parseDate(a.criadaEm);
      return dataB - dataA;
    });
  }, [busca, campanhas, filtro, ordem]);

  const entrar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onEntrarComCodigo || !codigo.trim() || entrando) return;
    setEntrando(true);
    setErro('');
    try {
      await onEntrarComCodigo(codigo.trim(), personagemId || undefined);
      setCodigo('');
      setMostrarConvite(false);
    } catch (error: any) {
      setErro(error.message || 'Não foi possível entrar nesta campanha.');
    } finally {
      setEntrando(false);
    }
  };

  const campaignMeta = (campanha: Campanha) => {
    if (campanha.status === 'planejamento') return 'Planejamento';
    if (campanha.status === 'concluida') {
      const concluidaEm = formatDate(campanha.ultimaSessaoData);
      return concluidaEm ? `Concluída em ${concluidaEm}` : 'Concluída';
    }

    const ultima = formatDate(campanha.ultimaSessaoData);
    return ultima ? `Última sessão: ${ultima}` : 'Em andamento';
  };

  return (
    <section className="ro-library ro-library--v2">
      <img className="ro-library__frame" src="/ro-login-frame.webp" alt="" aria-hidden="true" />

      <header className="ro-library__hero ro-library__hero--v2">
        <div>
          <p className="ro-eyebrow">Arquivo da Vigília</p>
          <h1>Minhas Campanhas</h1>
          <p>Organize crônicas, one-shots e playtests sem misturar preparação com o espaço de jogo.</p>
        </div>

        <div className="ro-library__hero-actions">
          {onEntrarComCodigo && (
            <button type="button" className="ro-library__secondary-action" onClick={() => setMostrarConvite(value => !value)}>
              <KeyRound /> Entrar com código
            </button>
          )}
          <button type="button" className="ro-library__primary-action" onClick={onNovaCampanha}>
            <Plus /> Nova campanha
          </button>
        </div>
      </header>

      <section className="ro-library__stats" aria-label="Resumo das campanhas">
        <div>
          <span className="ro-library__stat-icon"><BookOpen /></span>
          <span><strong>{resumo.campanhas}</strong><small>Campanhas</small></span>
        </div>
        <div>
          <span className="ro-library__stat-icon"><Users /></span>
          <span><strong>{resumo.jogadores}</strong><small>Jogadores</small></span>
        </div>
        <div>
          <span className="ro-library__stat-icon"><CalendarDays /></span>
          <span><strong>{resumo.sessoes}</strong><small>Sessões registradas</small></span>
        </div>
        <div>
          <span className="ro-library__stat-icon"><Compass /></span>
          <span><strong>{resumo.ativas}</strong><small>Mesas ativas</small></span>
        </div>
      </section>

      {mostrarConvite && onEntrarComCodigo && (
        <form className="ro-library__join ro-library__join--v2" onSubmit={entrar}>
          <div>
            <strong>Convite de campanha</strong>
            <small>Cole o código enviado pelo Mestre.</small>
          </div>
          <input value={codigo} onChange={event => setCodigo(event.target.value.toUpperCase())} placeholder="REINO-XXXXXXXXXXXX" aria-label="Código de convite" />
          {personagensParaVinculo.length > 0 && (
            <select value={personagemId} onChange={event => setPersonagemId(event.target.value)} aria-label="Personagem para vincular">
              <option value="">Vincular personagem depois</option>
              {personagensParaVinculo.map(personagem => (
                <option key={personagem.id} value={personagem.id}>{personagem.nome}</option>
              ))}
            </select>
          )}
          <button type="submit" disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar'} <ArrowRight /></button>
          {erro && <p>{erro}</p>}
        </form>
      )}

      <div className="ro-library__toolbar ro-library__toolbar--v2">
        <label className="ro-library__search ro-library__search--v2">
          <Search />
          <input
            value={busca}
            onChange={event => setBusca(event.target.value)}
            placeholder="Buscar campanha, cenário ou palavras-chave..."
          />
        </label>

        <div className="ro-library__toolbar-right">
          <div className="ro-library__filters ro-library__filters--v2" role="group" aria-label="Filtrar campanhas">
            {([
              ['todas', 'Todas'],
              ['em_andamento', 'Em andamento'],
              ['planejamento', 'Planejamento'],
              ['concluida', 'Concluídas']
            ] as [Filter, string][]).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFiltro(value)} className={filtro === value ? 'is-active' : ''}>
                {label} <span>({contagens[value]})</span>
              </button>
            ))}
          </div>

          <label className="ro-library__sort">
            <ArrowDownUp />
            <select value={ordem} onChange={event => setOrdem(event.target.value as Sort)} aria-label="Ordenar campanhas">
              <option value="recentes">Mais recentes</option>
              <option value="nome">Nome A–Z</option>
              <option value="sessao">Mais sessões</option>
            </select>
          </label>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="ro-library__empty ro-library__empty--v2">
          <img src="/ro-mark.svg" alt="" />
          <h2>{campanhas.length ? 'Nenhuma campanha encontrada.' : 'Seu arquivo ainda está vazio.'}</h2>
          <p>{campanhas.length ? 'Tente outro termo ou filtro.' : 'Crie a primeira campanha e comece a preparar a Vigília.'}</p>
          {!campanhas.length && <button className="ro-library__primary-action" onClick={onNovaCampanha}>Criar campanha</button>}
        </div>
      ) : (
        <div className={`ro-library__showcase ${filtradas.length === 1 ? 'is-single' : ''}`}>
          {filtradas.map((campanha, index) => {
            const destaque = index === 0;
            return (
              <article key={campanha.id} className={`ro-library__campaign-card ${destaque ? 'is-featured' : 'is-secondary'}`}>
                <button
                  type="button"
                  className="ro-library__campaign-media"
                  onClick={() => onDetalhesCampanha(campanha)}
                  aria-label={`Abrir detalhes de ${campanha.nome}`}
                >
                  <AssetImage src={campanha.imagemUrl} fallbackSrc="/ro-login-mist-city.webp" alt="" />
                  <span className="ro-library__campaign-shade" />
                  <span className={`ro-library__campaign-status ${statusClass[campanha.status]}`}>
                    <i /> {statusLabel[campanha.status]}
                  </span>
                  <span className="ro-library__campaign-menu" aria-hidden="true"><MoreHorizontal /></span>
                </button>

                <div className="ro-library__campaign-body">
                  <div className="ro-library__campaign-copy">
                    <h2>{campanha.nome}</h2>
                    <p>{campanha.descricao || 'Sem descrição.'}</p>
                  </div>

                  <div className="ro-library__campaign-meta">
                    <span><Users /> {campanha.jogadoresCount || 0} membros</span>
                    <span>Sessão {campanha.sessaoAtual || 0}</span>
                    <span>{campaignMeta(campanha)}</span>
                  </div>

                  <div className="ro-library__campaign-actions">
                    <button type="button" className="ro-library__prepare-action" onClick={() => onDetalhesCampanha(campanha)}>
                      <BookOpen /> Preparar
                    </button>
                    <button type="button" className="ro-library__enter-action" onClick={() => onContinuarCampanha(campanha)}>
                      Entrar na mesa <ArrowRight />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
