import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  HeartHandshake,
  KeyRound,
  LogOut,
  Plus,
  Radio,
  Settings,
  Users
} from 'lucide-react';
import { Campanha, Sessao } from '../types/campaign';
import { Personagem } from '../types/character';
import { ThemeToggle } from '../design-system/ThemeToggle';
import { AssetImage } from './system/AssetImage';

interface DashboardViewProps {
  campanhas: Campanha[];
  userName?: string;
  avatarUrl?: string;
  personagens?: Personagem[];
  sessoes?: Sessao[];
  onNovaCampanha: () => void;
  onNovoPersonagem?: () => void;
  onAbrirPersonagem?: (personagem: Personagem) => void;
  onContinuarCampanha: (campanha: Campanha) => void;
  onDetalhesCampanha: (campanha: Campanha) => void;
  canPrepareCampaign?: (campanha: Campanha) => boolean;
  personagensParaVinculo?: Personagem[];
  onEntrarComCodigo?: (codigo: string, personagemId?: string) => Promise<void>;
  onAbrirCampanhas?: () => void;
  onAbrirPersonagens?: () => void;
  onAbrirComunidade?: () => void;
  onAbrirConfiguracoes?: () => void;
  onSair?: () => void;
}

const statusLabel: Record<Campanha['status'], string> = {
  em_andamento: 'Campanha',
  planejamento: 'Em preparação',
  concluida: 'Concluída'
};

const formatarDataSessao = (sessao: Sessao) => sessao.data || 'Data a definir';

export const DashboardView: React.FC<DashboardViewProps> = ({
  campanhas,
  userName,
  avatarUrl,
  personagens = [],
  sessoes = [],
  onNovaCampanha,
  onNovoPersonagem,
  onAbrirPersonagem,
  onContinuarCampanha,
  onDetalhesCampanha,
  canPrepareCampaign = () => false,
  onEntrarComCodigo,
  personagensParaVinculo = [],
  onAbrirCampanhas,
  onAbrirPersonagens,
  onAbrirComunidade,
  onAbrirConfiguracoes,
  onSair
}) => {
  const [codigo, setCodigo] = useState('');
  const [personagemId, setPersonagemId] = useState('');
  const [erro, setErro] = useState('');
  const [mostrarConvite, setMostrarConvite] = useState(false);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

  const primeiroNome = userName?.trim().split(/\s+/)[0] || 'Desvelado';

  const campanhasOrdenadas = useMemo(
    () => [...campanhas].sort((a, b) => {
      if (a.status === b.status) return b.sessaoAtual - a.sessaoAtual;
      if (a.status === 'em_andamento') return -1;
      if (b.status === 'em_andamento') return 1;
      return 0;
    }),
    [campanhas]
  );

  const proximasSessoes = useMemo(
    () => sessoes.filter(sessao => !sessao.concluida).slice(0, 3),
    [sessoes]
  );

  const entrar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onEntrarComCodigo || !codigo.trim()) return;
    try {
      setErro('');
      await onEntrarComCodigo(codigo, personagemId || undefined);
      setCodigo('');
      setMostrarConvite(false);
    } catch (e: any) {
      setErro(e.message || 'Não foi possível entrar com este código.');
    }
  };

  const abrirPerfil = () => {
    setMostrarPerfil(value => !value);
    setMostrarNotificacoes(false);
  };

  const abrirNotificacoes = () => {
    setMostrarNotificacoes(value => !value);
    setMostrarPerfil(false);
  };

  return (
    <section className="ro-home">
      <img className="ro-home__frame" src="/ro-login-frame.webp" alt="" aria-hidden="true" />

      <div className="ro-home__topbar">
        <div className="ro-home__motto">
          <span>A realidade é só o começo.</span>
          <i aria-hidden="true" />
          <b aria-hidden="true">✦</b>
        </div>

        <div className="ro-home__account-area">
          <div className="ro-home__popover-wrap">
            <button type="button" className="ro-home__notification" aria-label="Abrir notificações" aria-expanded={mostrarNotificacoes} onClick={abrirNotificacoes}>
              <Bell />
              {proximasSessoes.length > 0 && <span className="ro-home__notification-dot">{Math.min(proximasSessoes.length, 9)}</span>}
            </button>

            {mostrarNotificacoes && (
              <div className="ro-home__popover ro-home__notifications">
                <div className="ro-home__popover-head">
                  <div><strong>Atividade da Vigília</strong><small>O que precisa da sua atenção.</small></div>
                  <Bell size={16} />
                </div>
                {proximasSessoes.length ? (
                  <div className="ro-home__notification-list">
                    {proximasSessoes.map(sessao => (
                      <div key={sessao.id}>
                        <CalendarDays size={14} />
                        <span><strong>{sessao.titulo}</strong><small>{formatarDataSessao(sessao)}</small></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ro-home__popover-empty">Nenhuma sessão pendente no momento.</p>
                )}
                <button type="button" className="ro-home__popover-action" onClick={() => { setMostrarNotificacoes(false); onAbrirCampanhas?.(); }}>
                  Abrir campanhas <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="ro-home__popover-wrap">
            <button type="button" className="ro-home__identity" onClick={abrirPerfil} aria-expanded={mostrarPerfil} aria-label="Abrir menu da conta">
              <span className="ro-home__avatar" aria-hidden="true">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : primeiroNome.slice(0, 2).toUpperCase()}
              </span>
              <span className="ro-home__identity-copy">
                <strong>{primeiroNome}</strong>
                <small>Desvelado</small>
              </span>
              <ChevronDown className={mostrarPerfil ? 'is-open' : ''} />
            </button>

            {mostrarPerfil && (
              <div className="ro-home__popover ro-home__profile-menu">
                <div className="ro-home__profile-summary">
                  <span className="ro-home__avatar">
                    {avatarUrl ? <img src={avatarUrl} alt="" /> : primeiroNome.slice(0, 2).toUpperCase()}
                  </span>
                  <span><strong>{userName || primeiroNome}</strong><small>Conta Reinos Oníricos</small></span>
                </div>
                <div className="ro-home__profile-row">
                  <span>Aparência</span>
                  <ThemeToggle compact />
                </div>
                <button type="button" onClick={() => { setMostrarPerfil(false); onAbrirConfiguracoes?.(); }}>
                  <Settings size={15} /> Configurações
                </button>
                <button type="button" className="is-danger" onClick={() => { setMostrarPerfil(false); onSair?.(); }}>
                  <LogOut size={15} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <header className="ro-home__welcome">
        <div className="ro-home__welcome-copy">
          <h1>Bem-vindo de volta, <em>{primeiroNome}.</em></h1>
          <p>A Vigília continua. Há mundos a investigar, memórias a decifrar e sonhos que não se calam.</p>

          <div className="ro-home__stats" aria-label="Resumo da sua Vigília">
            <div>
              <BookOpen />
              <span><strong>{campanhas.length}</strong><small>Campanhas</small></span>
            </div>
            <div>
              <Users />
              <span><strong>{personagens.length}</strong><small>Personagens</small></span>
            </div>
            <div>
              <CalendarDays />
              <span><strong>{proximasSessoes.length}</strong><small>Próximas sessões</small></span>
            </div>
            <button type="button" onClick={onAbrirComunidade}>
              <HeartHandshake />
              <span><strong>Comunidade</strong><small>Entre no Círculo da Vigília</small></span>
            </button>
          </div>
        </div>

        <blockquote>
          “Entre o concreto<br />
          e o impossível,<br />
          existem aqueles<br />
          que ainda investigam.”
          <span aria-hidden="true" />
        </blockquote>
      </header>

      <section className="ro-home__campaigns">
        <div className="ro-home__section-head">
          <div>
            <h2>Minhas Campanhas</h2>
            <span aria-hidden="true" />
          </div>
          <div className="ro-home__section-actions">
            {onAbrirCampanhas && (
              <button type="button" className="ro-home__text-action" onClick={onAbrirCampanhas}>
                Ver todas <ArrowRight />
              </button>
            )}
            {onEntrarComCodigo && (
              <button type="button" className="ro-home__text-action" onClick={() => setMostrarConvite(valor => !valor)}>
                <KeyRound /> Entrar com código
              </button>
            )}
            <button type="button" className="ro-home__primary-action" onClick={onNovaCampanha}>
              <Plus /> Nova Campanha
            </button>
          </div>
        </div>

        {mostrarConvite && onEntrarComCodigo && (
          <form className="ro-home__join" onSubmit={entrar}>
            <div>
              <strong>Entrar em uma campanha</strong>
              <small>Use o código enviado pelo Mestre.</small>
            </div>
            <input value={codigo} onChange={event => setCodigo(event.target.value.toUpperCase())} placeholder="REINO-XXXXXXXXXXXX" aria-label="Código de convite" />
            {personagensParaVinculo.length > 0 && (
              <select value={personagemId} onChange={event => setPersonagemId(event.target.value)} aria-label="Personagem para vincular">
                <option value="">Vincular ficha depois</option>
                {personagensParaVinculo.map(personagem => <option key={personagem.id} value={personagem.id}>{personagem.nome}</option>)}
              </select>
            )}
            <button type="submit">Entrar <ArrowRight /></button>
            {erro && <p>{erro}</p>}
          </form>
        )}

        {campanhasOrdenadas.length === 0 ? (
          <div className="ro-home__empty">
            <div className="ro-home__empty-mark">
              <img src="/ro-mark.svg" alt="" />
            </div>
            <div>
              <span>O arquivo está vazio</span>
              <h3>A primeira fissura começa aqui.</h3>
              <p>Crie uma campanha para reunir cenas, personagens, pistas e anotações de mesa. Toda grande história começa com um primeiro passo.</p>
            </div>
            <button onClick={onNovaCampanha}><Plus /> Nova Campanha <ArrowRight /></button>
          </div>
        ) : (
          <div className="ro-home__campaign-grid">
            {campanhasOrdenadas.slice(0, 2).map((campanha, index) => (
              <article key={campanha.id} className={`ro-home__campaign-card ro-home__campaign-card--${index % 2 === 0 ? 'ink' : 'rift'}`}>
                <button type="button" className="ro-home__campaign-main" onClick={() => (canPrepareCampaign(campanha) ? onDetalhesCampanha : onContinuarCampanha)(campanha)} aria-label={canPrepareCampaign(campanha) ? `Preparar ${campanha.nome}` : `Entrar na Mesa Ao Vivo de ${campanha.nome}`}>
                  <AssetImage src={campanha.imagemUrl} fallbackSrc="/ro-login-mist-city.webp" alt="" />
                  <span className="ro-home__campaign-shade" />
                  <span className="ro-home__campaign-copy">
                    <strong>{campanha.nome}</strong>
                    <small>{statusLabel[campanha.status]} · {campanha.jogadoresCount || 0} membros</small>
                    <em>{campanha.descricao}</em>
                  </span>
                  <span className="ro-home__campaign-star" aria-hidden="true">✦</span>
                </button>
                <button type="button" className="ro-home__campaign-enter" onClick={() => onContinuarCampanha(campanha)}>
                  Entrar na mesa <ArrowRight />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="ro-home__lower-grid">
        <section className="ro-home__characters-section">
          <div className="ro-home__section-head ro-home__section-head--compact">
            <div><h2>Seus Personagens</h2><span aria-hidden="true" /></div>
            {onAbrirPersonagens && <button type="button" className="ro-home__text-action" onClick={onAbrirPersonagens}>Ver todos <ArrowRight /></button>}
          </div>

          {personagens.length === 0 ? (
            <button type="button" onClick={onNovoPersonagem} className="ro-home__character-empty">
              <span className="ro-home__new-plus"><Plus /></span>
              <strong>Criar Personagem</strong>
              <small>Dê vida àqueles que caminham entre os mundos.</small>
            </button>
          ) : (
            <div className="ro-home__characters">
              {personagens.slice(0, 3).map((personagem, index) => (
                <button type="button" key={personagem.id} onClick={() => onAbrirPersonagem?.(personagem)} className="ro-home__character">
                  <span className={`ro-home__character-avatar ro-home__character-avatar--${index + 1}`}>
                    <span>{personagem.nome.slice(0, 2).toUpperCase()}</span>
                  </span>
                  <span className="ro-home__character-copy">
                    <strong>{personagem.nome}</strong>
                    <small>Nível {personagem.nivel}</small>
                    <em>{personagem.conceito || 'Desvelado'}</em>
                  </span>
                  <span className="ro-home__character-sigil" aria-hidden="true">✧</span>
                </button>
              ))}

              {onNovoPersonagem && (
                <button type="button" onClick={onNovoPersonagem} className="ro-home__character ro-home__character--new">
                  <span className="ro-home__new-plus"><Plus /></span>
                  <span><strong>Novo</strong><small>Personagem</small></span>
                </button>
              )}
            </div>
          )}
        </section>

        <section className="ro-home__sessions-section">
          <div className="ro-home__section-head ro-home__section-head--compact">
            <div><h2>Próximas Sessões</h2><span aria-hidden="true" /></div>
            {onAbrirCampanhas && <button type="button" className="ro-home__text-action" onClick={onAbrirCampanhas}>Ver todas <ArrowRight /></button>}
          </div>

          {proximasSessoes.length > 0 ? (
            <div className="ro-home__sessions">
              {proximasSessoes.slice(0, 1).map(sessao => {
                const campanha = campanhas.find(item => item.id === sessao.campanhaId) || campanhasOrdenadas[0];
                return (
                  <article key={sessao.id} className="ro-home__session">
                    <div className="ro-home__session-art">
                      <AssetImage src={campanha?.imagemUrl} fallbackSrc="/ro-login-mist-city.webp" alt="" />
                    </div>
                    <div className="ro-home__session-copy">
                      <strong>{campanha?.nome || 'Campanha'}</strong>
                      <span><CalendarDays /> {formatarDataSessao(sessao)}</span>
                      <span><Radio /> Sessão {sessao.numero}</span>
                      <h3>{sessao.titulo}</h3>
                    </div>
                    {campanha && <button type="button" onClick={() => onContinuarCampanha(campanha)}>Entrar na Mesa <ArrowRight /></button>}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="ro-home__session ro-home__session--empty">
              <div className="ro-home__session-empty-icon"><CalendarDays /></div>
              <div className="ro-home__session-copy">
                <strong>Nenhuma sessão agendada</strong>
                <p>Abra uma campanha para planejar o próximo encontro da mesa.</p>
              </div>
              {campanhasOrdenadas.find(canPrepareCampaign) && <button type="button" onClick={() => onDetalhesCampanha(campanhasOrdenadas.find(canPrepareCampaign)!)}>Planejar <ArrowRight /></button>}
            </div>
          )}
        </section>
      </div>

      <div className="ro-home__side-art" aria-hidden="true">
        <img src="/ro-login-mist-city.webp" alt="" />
      </div>
    </section>
  );
};
