import React, { useMemo, useState } from 'react';
import { ArrowRight, KeyRound, Plus, Search, Users } from 'lucide-react';
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
  const [mostrarConvite, setMostrarConvite] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [personagemId, setPersonagemId] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return campanhas.filter(campanha => {
      const statusOk = filtro === 'todas' || campanha.status === filtro;
      const textoOk = !termo || campanha.nome.toLowerCase().includes(termo) || campanha.descricao.toLowerCase().includes(termo);
      return statusOk && textoOk;
    });
  }, [busca, campanhas, filtro]);

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

  return (
    <section className="ro-library">
      <header className="ro-library__hero">
        <div>
          <p className="ro-eyebrow">Arquivo da Vigília</p>
          <h1>Minhas Campanhas</h1>
          <p>Organize crônicas, one-shots e playtests sem misturar preparação com o espaço de jogo.</p>
        </div>
        <div className="ro-library__hero-actions">
          {onEntrarComCodigo && (
            <button type="button" className="ro-button--quiet" onClick={() => setMostrarConvite(value => !value)}>
              <KeyRound size={15} /> Entrar com código
            </button>
          )}
          <button type="button" className="ro-button" onClick={onNovaCampanha}>
            <Plus size={16} /> Nova campanha
          </button>
        </div>
      </header>

      {mostrarConvite && onEntrarComCodigo && (
        <form className="ro-library__join" onSubmit={entrar}>
          <div>
            <strong>Convite de campanha</strong>
            <small>Cole o código enviado pelo Mestre.</small>
          </div>
          <input value={codigo} onChange={event => setCodigo(event.target.value.toUpperCase())} placeholder="REINO-XXXXXXXXXXXX" />
          {personagensParaVinculo.length > 0 && (
            <select value={personagemId} onChange={event => setPersonagemId(event.target.value)}>
              <option value="">Vincular personagem depois</option>
              {personagensParaVinculo.map(personagem => (
                <option key={personagem.id} value={personagem.id}>{personagem.nome}</option>
              ))}
            </select>
          )}
          <button type="submit" disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar'} <ArrowRight size={14} /></button>
          {erro && <p>{erro}</p>}
        </form>
      )}

      <div className="ro-library__toolbar">
        <label className="ro-library__search">
          <Search size={16} />
          <input value={busca} onChange={event => setBusca(event.target.value)} placeholder="Buscar campanha…" />
        </label>
        <div className="ro-library__filters" role="group" aria-label="Filtrar campanhas">
          {([
            ['todas', 'Todas'],
            ['em_andamento', 'Em andamento'],
            ['planejamento', 'Planejamento'],
            ['concluida', 'Concluídas']
          ] as [Filter, string][]).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFiltro(value)} className={filtro === value ? 'is-active' : ''}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="ro-library__empty">
          <img src="/ro-mark.svg" alt="" />
          <h2>{campanhas.length ? 'Nenhuma campanha encontrada.' : 'Seu arquivo ainda está vazio.'}</h2>
          <p>{campanhas.length ? 'Tente outro termo ou filtro.' : 'Crie a primeira campanha e comece a preparar a Vigília.'}</p>
          {!campanhas.length && <button className="ro-button" onClick={onNovaCampanha}>Criar campanha</button>}
        </div>
      ) : (
        <div className="ro-library__grid">
          {filtradas.map(campanha => (
            <article key={campanha.id} className="ro-library__card">
              <button type="button" className="ro-library__cover" onClick={() => onDetalhesCampanha(campanha)}>
                <AssetImage src={campanha.imagemUrl} fallbackSrc="/ro-login-mist-city.webp" alt="" />
                <span className="ro-library__cover-shade" />
                <span className="ro-library__status">{campanha.status === 'em_andamento' ? 'Em andamento' : campanha.status === 'planejamento' ? 'Planejamento' : 'Concluída'}</span>
              </button>
              <div className="ro-library__body">
                <div>
                  <h2>{campanha.nome}</h2>
                  <p>{campanha.descricao || 'Sem descrição.'}</p>
                </div>
                <div className="ro-library__meta">
                  <span><Users size={13} /> {campanha.jogadoresCount || 0} membros</span>
                  <span>Sessão {campanha.sessaoAtual}</span>
                </div>
                <div className="ro-library__actions">
                  <button type="button" className="ro-button--quiet" onClick={() => onDetalhesCampanha(campanha)}>Preparar</button>
                  <button type="button" className="ro-button" onClick={() => onContinuarCampanha(campanha)}>Entrar na mesa <ArrowRight size={14} /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
