import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  FileUp,
  Grid2X2,
  Heart,
  List,
  Plus,
  Search,
  Sparkles,
  Sun,
  TriangleAlert,
  Users
} from 'lucide-react';
import { Personagem } from '../types/character';
import { AssetImage } from './system/AssetImage';

interface CharactersListViewProps {
  personagens: Personagem[];
  currentUserId?: string;
  onSelecionarPersonagem: (p: Personagem) => void;
  onNovoPersonagem: () => void;
  onImportarJSON: () => void;
}

type Filter = 'todos' | 'meus' | 'em_campanha' | 'sem_campanha';
type LayoutMode = 'grid' | 'list';

const conceitoLabel = (value: string) => value?.trim() || 'Desvelado';

export const CharactersListView: React.FC<CharactersListViewProps> = ({
  personagens,
  currentUserId,
  onSelecionarPersonagem,
  onNovoPersonagem,
  onImportarJSON
}) => {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filter>('todos');
  const [layout, setLayout] = useState<LayoutMode>('grid');

  const isMine = (personagem: Personagem) => {
    if (!currentUserId) return true;
    return !personagem.ownerUserId || personagem.ownerUserId === currentUserId;
  };

  const contagens = useMemo(() => ({
    todos: personagens.length,
    meus: personagens.filter(isMine).length,
    em_campanha: personagens.filter(personagem => Boolean(personagem.campaignId)).length,
    sem_campanha: personagens.filter(personagem => !personagem.campaignId).length
  }), [personagens, currentUserId]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return personagens
      .filter(personagem => {
        const texto = `${personagem.nome} ${personagem.conceito} ${personagem.jogador || ''}`.toLowerCase();
        const buscaOk = !termo || texto.includes(termo);

        const filtroOk =
          filtro === 'todos'
            ? true
            : filtro === 'meus'
              ? isMine(personagem)
              : filtro === 'em_campanha'
                ? Boolean(personagem.campaignId)
                : !personagem.campaignId;

        return buscaOk && filtroOk;
      })
      .sort((a, b) => {
        const mineA = isMine(a) ? 1 : 0;
        const mineB = isMine(b) ? 1 : 0;
        if (mineA !== mineB) return mineB - mineA;

        const dateA = Date.parse(a.atualizadoEm || a.criadoEm || '') || 0;
        const dateB = Date.parse(b.atualizadoEm || b.criadoEm || '') || 0;
        if (dateA !== dateB) return dateB - dateA;

        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [busca, filtro, personagens, currentUserId]);

  const filterItems: Array<{ id: Filter; label: string }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'meus', label: 'Meus Desvelados' },
    { id: 'em_campanha', label: 'Em campanha' },
    { id: 'sem_campanha', label: 'Sem campanha' }
  ];

  return (
    <section className="ro-characters">
      <img className="ro-characters__frame" src="/ro-login-frame.webp" alt="" aria-hidden="true" />

      <header className="ro-characters__hero">
        <div>
          <p className="ro-eyebrow">Arquivo pessoal</p>
          <h1>Personagens Desvelados</h1>
          <p>Agentes conscientes da fronteira entre a Vigília e o Sonhar.</p>
        </div>

        <div className="ro-characters__hero-actions">
          <button type="button" className="ro-characters__secondary-action" onClick={onImportarJSON}>
            <FileUp /> Importar (.json)
          </button>
          <button type="button" className="ro-characters__primary-action" onClick={onNovoPersonagem}>
            <Plus /> Novo Desvelado
          </button>
        </div>
      </header>

      <div className="ro-characters__toolbar">
        <label className="ro-characters__search">
          <Search />
          <input
            value={busca}
            onChange={event => setBusca(event.target.value)}
            placeholder="Buscar personagens..."
            aria-label="Buscar personagens"
          />
        </label>

        <div className="ro-characters__filters" role="group" aria-label="Filtrar personagens">
          {filterItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={filtro === item.id ? 'is-active' : ''}
              onClick={() => setFiltro(item.id)}
            >
              {item.label}
              <span>{contagens[item.id]}</span>
            </button>
          ))}
        </div>

        <div className="ro-characters__view-options">
          <span>{filtrados.length} {filtrados.length === 1 ? 'personagem' : 'personagens'}</span>
          <button type="button" className={layout === 'grid' ? 'is-active' : ''} onClick={() => setLayout('grid')} aria-label="Visualização em grade">
            <Grid2X2 />
          </button>
          <button type="button" className={layout === 'list' ? 'is-active' : ''} onClick={() => setLayout('list')} aria-label="Visualização em lista">
            <List />
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="ro-characters__empty">
          <div className="ro-characters__empty-sigil">
            <img src="/ro-mark.svg" alt="" />
          </div>
          <p className="ro-eyebrow">Arquivo sem registros</p>
          <h2>{personagens.length ? 'Nenhum Desvelado corresponde ao filtro.' : 'O primeiro Desvelado ainda não foi registrado.'}</h2>
          <p>
            {personagens.length
              ? 'Tente outro termo de busca ou volte para Todos.'
              : 'Crie uma ficha para dar forma a quem atravessa a fronteira entre a Vigília e o Sonhar.'}
          </p>
          {!personagens.length && (
            <button type="button" className="ro-characters__primary-action" onClick={onNovoPersonagem}>
              <Plus /> Criar Desvelado
            </button>
          )}
        </div>
      ) : (
        <div className={`ro-characters__collection ${layout === 'list' ? 'is-list' : ''}`}>
          {filtrados.map((personagem, index) => {
            const mine = isMine(personagem);
            const emCampanha = Boolean(personagem.campaignId);

            return (
              <article
                key={personagem.id}
                className={`ro-character-card ${index === 0 && layout === 'grid' ? 'is-featured' : ''}`}
              >
                <button
                  type="button"
                  className="ro-character-card__visual"
                  onClick={() => onSelecionarPersonagem(personagem)}
                  aria-label={`Abrir ficha de ${personagem.nome}`}
                >
                  <span className={`ro-character-card__orb ${personagem.imagemUrl ? 'has-image' : ''}`} aria-hidden="true">
                    {personagem.imagemUrl
                      ? <AssetImage src={personagem.imagemUrl} alt="" />
                      : <span>{personagem.nome.slice(0, 1).toUpperCase()}</span>}
                  </span>
                  <span className="ro-character-card__sigil" aria-hidden="true">✦</span>
                  <span className="ro-character-card__visual-lines" aria-hidden="true" />

                  <span className="ro-character-card__ownership">
                    {mine ? <><Users /> Meu Desvelado</> : <><Users /> Compartilhado</>}
                  </span>

                  <span className={`ro-character-card__campaign ${emCampanha ? 'is-linked' : ''}`}>
                    {emCampanha ? 'Em campanha' : 'Sem campanha'}
                  </span>
                </button>

                <div className="ro-character-card__body">
                  <div className="ro-character-card__heading">
                    <div>
                      <h2>{personagem.nome}</h2>
                      <p>{conceitoLabel(personagem.conceito)} <span>•</span> Nível {personagem.nivel}</p>
                    </div>
                    <span className="ro-character-card__player">{personagem.jogador || 'Jogador'}</span>
                  </div>

                  <div className="ro-character-card__attributes" aria-label={`Atributos de ${personagem.nome}`}>
                    <div><small>Cor</small><strong>{personagem.atributos.corpo}</strong></div>
                    <div><small>Men</small><strong>{personagem.atributos.mente}</strong></div>
                    <div><small>Von</small><strong>{personagem.atributos.vontade}</strong></div>
                    <div><small>Vín</small><strong>{personagem.atributos.vinculo}</strong></div>
                  </div>

                  <div className="ro-character-card__resources">
                    <div>
                      <Heart />
                      <span><small>Vida</small><strong>{personagem.vidaAtual}/{personagem.vidaMaxima}</strong></span>
                    </div>
                    <div>
                      <Sun />
                      <span><small>Foco</small><strong>{personagem.focoAtual}/{personagem.focoMaximo}</strong></span>
                    </div>
                    <div className={personagem.ruptura >= 4 ? 'is-alert' : ''}>
                      <TriangleAlert />
                      <span><small>Ruptura</small><strong>{personagem.ruptura}/6</strong></span>
                    </div>
                  </div>

                  <button type="button" className="ro-character-card__open" onClick={() => onSelecionarPersonagem(personagem)}>
                    Abrir ficha <ArrowRight />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="ro-characters__watermark" aria-hidden="true">
        <Sparkles />
      </div>
    </section>
  );
};
