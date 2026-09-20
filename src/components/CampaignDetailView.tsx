import React, { useState } from 'react';
import { Campanha, Sessao, NPC, Adversario, Local, Pista, LoreEntry, Anotacao } from '../types/campaign';
import { Personagem } from '../types/character';

export type CampaignTabType = 
  | 'visao_geral'
  | 'sessoes'
  | 'personagens'
  | 'npcs'
  | 'adversarios'
  | 'locais'
  | 'pistas'
  | 'lore'
  | 'anotacoes'
  | 'configuracoes';

interface CampaignDetailViewProps {
  campanha: Campanha;
  personagens: Personagem[];
  sessoes: Sessao[];
  npcs: NPC[];
  adversarios: Adversario[];
  locais: Local[];
  pistas: Pista[];
  loreEntries: LoreEntry[];
  anotacoes: Anotacao[];
  onIniciarSessao: (campanha: Campanha) => void;
  onAbrirFichaPersonagem: (personagem: Personagem) => void;
  onNovaSessao: (campanhaId: string, titulo: string) => void;
  onAdicionarNPC: (npc: Omit<NPC, 'id'>) => void;
  onAdicionarAdversario: (adv: Omit<Adversario, 'id'>) => void;
  onAdicionarLocal: (loc: Omit<Local, 'id'>) => void;
  onAdicionarPista: (pista: Omit<Pista, 'id'>) => void;
  onAdicionarLore: (lore: Omit<LoreEntry, 'id'>) => void;
  onAdicionarAnotacao: (campanhaId: string, titulo: string, conteudo: string) => void;
  onExcluirCampanha?: (id: string) => void;
}

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campanha,
  personagens,
  sessoes,
  npcs,
  adversarios,
  locais,
  pistas,
  loreEntries,
  anotacoes,
  onIniciarSessao,
  onAbrirFichaPersonagem,
  onNovaSessao,
  onAdicionarNPC,
  onAdicionarAdversario,
  onAdicionarLocal,
  onAdicionarPista,
  onAdicionarLore,
  onAdicionarAnotacao,
  onExcluirCampanha
}) => {
  const [abaAtiva, setAbaAtiva] = useState<CampaignTabType>('visao_geral');
  
  // Estados para modais simples de adição rápida
  const [modalNovaSessao, setModalNovaSessao] = useState(false);
  const [tituloNovaSessao, setTituloNovaSessao] = useState('');

  const [modalNovoItem, setModalNovoItem] = useState<CampaignTabType | null>(null);
  const [itemNome, setItemNome] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemExtra, setItemExtra] = useState('');

  const sessoesCampanha = sessoes.filter(s => s.campanhaId === campanha.id);
  const npcsCampanha = npcs.filter(n => n.campanhaId === campanha.id);
  const adversariosCampanha = adversarios.filter(a => a.campanhaId === campanha.id);
  const locaisCampanha = locais.filter(l => l.campanhaId === campanha.id);
  const pistasCampanha = pistas.filter(p => p.campanhaId === campanha.id);
  const loreCampanha = loreEntries.filter(l => l.campanhaId === campanha.id);
  const anotacoesCampanha = anotacoes.filter(a => a.campanhaId === campanha.id);

  const handleCriarSessaoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNovaSessao.trim()) return;
    onNovaSessao(campanha.id, tituloNovaSessao);
    setTituloNovaSessao('');
    setModalNovaSessao(false);
  };

  const handleCriarItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNome.trim() || !modalNovoItem) return;

    if (modalNovoItem === 'npcs') {
      onAdicionarNPC({
        campanhaId: campanha.id,
        nome: itemNome.trim(),
        papel: itemExtra.trim() || 'Desconhecido',
        conceito: itemExtra.trim() || 'Habitante da Vigília',
        descricao: itemDesc.trim() || 'Sem descrição.',
        atitude: 'neutro',
        localizacao: 'São Paulo'
      });
    } else if (modalNovoItem === 'adversarios') {
      onAdicionarAdversario({
        campanhaId: campanha.id,
        nome: itemNome.trim(),
        tipo: 'pesadelo',
        nivel: 1,
        vida: 6,
        vidaMaxima: 6,
        defesa: 10,
        resistencia: 7,
        ataquePrincipal: itemExtra.trim() || 'Golpe de Tensão (1d6)',
        descricao: itemDesc.trim() || 'Aberração do Sonhar.'
      });
    } else if (modalNovoItem === 'locais') {
      onAdicionarLocal({
        campanhaId: campanha.id,
        nome: itemNome.trim(),
        tipo: 'fronteira',
        descricao: itemDesc.trim() || 'Ponto de encontro urbano.',
        anomaliaDetectada: itemExtra.trim() || 'Sem anomalia detectada'
      });
    } else if (modalNovoItem === 'pistas') {
      onAdicionarPista({
        campanhaId: campanha.id,
        titulo: itemNome.trim(),
        tipo: 'documento',
        status: 'descoberta',
        descricao: itemDesc.trim() || 'Pista em investigação.'
      });
    } else if (modalNovoItem === 'lore') {
      onAdicionarLore({
        campanhaId: campanha.id,
        titulo: itemNome.trim(),
        categoria: 'mundo',
        conteudo: itemDesc.trim() || 'Registro nos arquivos oníricos.'
      });
    } else if (modalNovoItem === 'anotacoes') {
      onAdicionarAnotacao(campanha.id, itemNome.trim(), itemDesc.trim());
    }

    setItemNome('');
    setItemDesc('');
    setItemExtra('');
    setModalNovoItem(null);
  };

  const tabs: { id: CampaignTabType; label: string }[] = [
    { id: 'visao_geral', label: 'Visão Geral' },
    { id: 'sessoes', label: 'Sessões' },
    { id: 'personagens', label: 'Personagens' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'adversarios', label: 'Adversários' },
    { id: 'locais', label: 'Locais' },
    { id: 'pistas', label: 'Pistas' },
    { id: 'lore', label: 'Lore' },
    { id: 'anotacoes', label: 'Anotações' },
    { id: 'configuracoes', label: 'Configurações' }
  ];

  return (
    <div className="w-full flex flex-col pb-20">
      {/* 20. HERO DA CAMPANHA (Cinematográfico, Atmosférico) */}
      <section className="relative w-full h-80 sm:h-96 overflow-hidden bg-[#0B0B0B] border-b border-[#292929]">
        <img
          src={campanha.imagemUrl}
          alt={campanha.nome}
          className="w-full h-full object-cover filter brightness-[0.45] contrast-[0.9] grayscale-[30%]"
        />
        {/* Overlay escuro em camadas */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/70 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />

        {/* Informações Hero */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-8 flex flex-col justify-end pb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-[11px] font-mono tracking-widest text-[#A88952] uppercase block mb-2">
                Código: {campanha.codigo} · {campanha.tipo}
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#F5F3EE] tracking-tight leading-tight">
                {campanha.nome}
              </h1>
              <p className="text-sm text-[#D9D7D2]/90 mt-3 font-normal leading-relaxed">
                {campanha.descricao}
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs font-mono text-[#666666]">
                <span>{campanha.jogadoresCount || personagens.length || 4} jogadores</span>
                <span>·</span>
                <span>{sessoesCampanha.length} sessões</span>
                <span>·</span>
                <span className="text-[#A88952]">Em andamento</span>
              </div>
            </div>

            <div>
              <button
                onClick={() => onIniciarSessao(campanha)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium tracking-wider uppercase transition-colors rounded-sm shadow-none"
              >
                <span>Iniciar Sessão</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Navegação de Abas (Visão Geral, Sessões, Personagens, etc.) */}
      <nav className="w-full border-b border-[#292929] bg-[#0B0B0B] sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-8 flex items-center gap-1 overflow-x-auto py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id)}
              className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap rounded-sm ${
                abaAtiva === tab.id
                  ? 'text-[#F5F3EE] bg-[#292929] border-b-2 border-[#A88952]'
                  : 'text-[#666666] hover:text-[#D9D7D2] hover:bg-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo da Aba */}
      <main className="max-w-7xl mx-auto px-8 py-10 w-full">
        {/* ABA: VISÃO GERAL */}
        {abaAtiva === 'visao_geral' && (
          <div className="space-y-10">
            {/* Grid Superior: Próxima Ação & Resumo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#171717] border border-[#292929] p-6 rounded-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-[#292929] mb-4">
                    <span className="text-xs font-mono tracking-widest text-[#666666] uppercase">
                      Última Sessão Registrada
                    </span>
                    <span className="text-xs font-mono text-[#A88952]">
                      Sessão #{String(campanha.sessaoAtual).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">
                    {sessoesCampanha[0]?.titulo || 'O que existe atrás da porta?'}
                  </h3>
                  <p className="text-xs text-[#D9D7D2]/80 mt-2.5 leading-relaxed font-normal">
                    {sessoesCampanha[0]?.resumo || 'O grupo adentra o limiar onde a realidade mundana perde consistência. As paredes reverberam com o murmúrio da Vigília enfraquecida.'}
                  </p>
                  <div className="pt-5 mt-5 border-t border-[#292929] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#666666]">
                      Data: {sessoesCampanha[0]?.data || campanha.ultimaSessaoData}
                    </span>
                    <button
                      onClick={() => onIniciarSessao(campanha)}
                      className="text-xs font-mono text-[#A88952] hover:underline"
                    >
                      Continuar na Mesa →
                    </button>
                  </div>
                </div>

                {/* Lista de Pistas Recentes */}
                <div className="bg-[#171717] border border-[#292929] p-6 rounded-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-[#292929] mb-4">
                    <span className="text-xs font-mono tracking-widest text-[#666666] uppercase">
                      Pistas Investigativas Ativas
                    </span>
                    <button
                      onClick={() => setAbaAtiva('pistas')}
                      className="text-xs font-mono text-[#666666] hover:text-[#D9D7D2]"
                    >
                      Ver todas ({pistasCampanha.length})
                    </button>
                  </div>
                  <div className="space-y-3">
                    {pistasCampanha.slice(0, 2).map(pista => (
                      <div key={pista.id} className="p-3 bg-[#0B0B0B] border border-[#292929] rounded-sm">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#F5F3EE] font-medium">{pista.titulo}</span>
                          <span className="text-[10px] font-mono text-[#A88952] uppercase">{pista.tipo}</span>
                        </div>
                        <p className="text-xs text-[#666666] mt-1 line-clamp-1">{pista.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Status da Campanha & Ruptura */}
              <div className="space-y-6">
                <div className="bg-[#171717] border border-[#292929] p-6 rounded-sm">
                  <span className="text-xs font-mono tracking-widest text-[#666666] uppercase block mb-3">
                    Índice de Ruptura da Crônica
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-4xl text-[#F5F3EE] font-normal">
                      {campanha.rupturaGeral}
                    </span>
                    <span className="text-xs font-mono text-[#666666]">/ 6</span>
                  </div>
                  <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                    {campanha.rupturaGeral >= 4
                      ? 'O véu do Sonhar está gravemente instável. Anomalias espontâneas ocorrem na vigília.'
                      : campanha.rupturaGeral >= 2
                      ? 'Ligeiras distorções perceptíveis por animais e indivíduos sensíveis.'
                      : 'A vigília consensual permanece estável na maior parte da cidade.'}
                  </p>
                </div>

                <div className="bg-[#171717] border border-[#292929] p-6 rounded-sm">
                  <span className="text-xs font-mono tracking-widest text-[#666666] uppercase block mb-4">
                    Desvelados Vinculados
                  </span>
                  <div className="space-y-2.5">
                    {personagens.slice(0, 3).map(pj => (
                      <div
                        key={pj.id}
                        onClick={() => onAbrirFichaPersonagem(pj)}
                        className="flex items-center justify-between p-2.5 bg-[#0B0B0B] border border-[#292929] hover:border-[#3a3a3a] cursor-pointer transition-colors rounded-sm"
                      >
                        <div>
                          <div className="text-xs text-[#F5F3EE] font-medium">{pj.nome}</div>
                          <div className="text-[10px] font-mono text-[#666666]">{pj.conceito} · Nível {pj.nivel}</div>
                        </div>
                        <div className="text-right text-[11px] font-mono text-[#D9D7D2]">
                          <span>{pj.vidaAtual}/{pj.vidaMaxima} V</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 21. ABA: SESSÕES */}
        {abaAtiva === 'sessoes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Sessões</h2>
                <p className="text-xs text-[#666666] mt-0.5">Histórico e planejamento cronológico.</p>
              </div>
              <button
                onClick={() => setModalNovaSessao(true)}
                className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#F5F3EE] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#333333]"
              >
                + Nova Sessão
              </button>
            </div>

            <div className="space-y-4">
              {sessoesCampanha.map(sessao => (
                <div
                  key={sessao.id}
                  className="bg-[#171717] border border-[#292929] p-6 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-[#3a3a3a]"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#A88952] block mb-1">
                      Sessão {String(sessao.numero).padStart(2, '0')}
                    </span>
                    <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">
                      {sessao.titulo}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-mono text-[#666666] mt-2">
                      <span>{sessao.jogadoresCount} jogadores</span>
                      <span>·</span>
                      <span>{sessao.data}</span>
                      {sessao.concluida && (
                        <>
                          <span>·</span>
                          <span className="text-[#666666]">Concluída</span>
                        </>
                      )}
                    </div>
                    {sessao.resumo && (
                      <p className="text-xs text-[#D9D7D2]/80 mt-2.5 max-w-2xl font-normal leading-relaxed">
                        {sessao.resumo}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => onIniciarSessao(campanha)}
                      className="px-4 py-2 bg-[#292929] hover:bg-[#A88952] hover:text-[#0B0B0B] text-[#D9D7D2] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#292929]"
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 22. ABA: PERSONAGENS */}
        {abaAtiva === 'personagens' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Personagens Desvelados</h2>
                <p className="text-xs text-[#666666] mt-0.5">Membros do grupo nesta crônica.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {personagens.map(pj => (
                <div
                  key={pj.id}
                  onClick={() => onAbrirFichaPersonagem(pj)}
                  className="bg-[#171717] border border-[#292929] p-5 rounded-sm hover:border-[#3a3a3a] cursor-pointer transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Retrato sutil */}
                    <div className="h-32 bg-[#0B0B0B] border border-[#292929] mb-4 flex items-center justify-center text-2xl font-serif text-[#A88952]">
                      {pj.nome.slice(0, 1)}
                    </div>

                    <h3 className="font-serif text-xl text-[#F5F3EE] font-normal leading-snug">
                      {pj.nome}
                    </h3>
                    <p className="text-[11px] font-mono text-[#666666] mt-1 uppercase tracking-wider">
                      {pj.conceito} · Nível {pj.nivel}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#292929] space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[#D9D7D2]">
                      <span className="text-[#666666] uppercase text-[10px]">Vida</span>
                      <span>{pj.vidaAtual} / {pj.vidaMaxima}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#D9D7D2]">
                      <span className="text-[#666666] uppercase text-[10px]">Ruptura</span>
                      <span className={pj.ruptura >= 4 ? 'text-[#F5F3EE]' : 'text-[#A88952]'}>
                        {pj.ruptura} / 6
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 23. ABA: NPCs */}
        {abaAtiva === 'npcs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Personagens Não-Jogadores (NPCs)</h2>
                <p className="text-xs text-[#666666] mt-0.5">Aliados, informantes e contatos da vigília.</p>
              </div>
              <button
                onClick={() => setModalNovoItem('npcs')}
                className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#F5F3EE] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#333333]"
              >
                + Novo NPC
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {npcsCampanha.map(npc => (
                <div key={npc.id} className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">{npc.nome}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#0B0B0B] border border-[#292929] text-[#A88952]">
                      {npc.atitude}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#666666]">{npc.papel} · {npc.localizacao}</p>
                  <p className="text-xs text-[#D9D7D2]/80 leading-relaxed">{npc.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: ADVERSÁRIOS */}
        {abaAtiva === 'adversarios' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Adversários & Ameaças</h2>
                <p className="text-xs text-[#666666] mt-0.5">Pesadelos, sombras e corrompidos pelo Sonhar.</p>
              </div>
              <button
                onClick={() => setModalNovoItem('adversarios')}
                className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#F5F3EE] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#333333]"
              >
                + Novo Adversário
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adversariosCampanha.map(adv => (
                <div key={adv.id} className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">{adv.nome}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#0B0B0B] border border-[#292929] text-[#D9D7D2]">
                      {adv.tipo} · Nível {adv.nivel}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-[#666666]">
                    <span>Vida: {adv.vida}/{adv.vidaMaxima}</span>
                    <span>Defesa: {adv.defesa}</span>
                    <span>Resistência: {adv.resistencia}</span>
                  </div>
                  <div className="text-xs font-mono text-[#A88952]">{adv.ataquePrincipal}</div>
                  <p className="text-xs text-[#D9D7D2]/80 leading-relaxed">{adv.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: LOCAIS */}
        {abaAtiva === 'locais' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Locais & Fronteiras</h2>
                <p className="text-xs text-[#666666] mt-0.5">Espaços urbanos onde o Sonhar se manifesta.</p>
              </div>
              <button
                onClick={() => setModalNovoItem('locais')}
                className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#F5F3EE] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#333333]"
              >
                + Novo Local
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locaisCampanha.map(loc => (
                <div key={loc.id} className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">{loc.nome}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#0B0B0B] border border-[#292929] text-[#A88952]">
                      {loc.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-[#D9D7D2]/80 leading-relaxed">{loc.descricao}</p>
                  {loc.anomaliaDetectada && (
                    <div className="p-3 bg-[#0B0B0B] border border-[#292929] text-xs font-mono text-[#666666]">
                      <span className="text-[#A88952]">Anomalia: </span>
                      {loc.anomaliaDetectada}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: PISTAS */}
        {abaAtiva === 'pistas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Pistas & Evidências</h2>
                <p className="text-xs text-[#666666] mt-0.5">Documentos, gravações e objetos anômalos.</p>
              </div>
              <button
                onClick={() => setModalNovoItem('pistas')}
                className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#F5F3EE] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#333333]"
              >
                + Nova Pista
              </button>
            </div>

            <div className="space-y-4">
              {pistasCampanha.map(pista => (
                <div key={pista.id} className="bg-[#171717] border border-[#292929] p-6 rounded-sm flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#0B0B0B] border border-[#292929] text-[#A88952]">
                        {pista.tipo}
                      </span>
                      <span className="text-xs font-mono text-[#666666]">
                        Status: {pista.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">{pista.titulo}</h3>
                    <p className="text-xs text-[#D9D7D2]/80 mt-2 leading-relaxed">{pista.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: LORE */}
        {abaAtiva === 'lore' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Arquivos de Lore & Conhecimento</h2>
                <p className="text-xs text-[#666666] mt-0.5">Tradição, leis do Sonhar e facções urbanas.</p>
              </div>
              <button
                onClick={() => setModalNovoItem('lore')}
                className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#F5F3EE] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#333333]"
              >
                + Novo Arquivo
              </button>
            </div>

            <div className="space-y-4">
              {loreCampanha.map(lore => (
                <div key={lore.id} className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A88952]">
                    {lore.categoria}
                  </span>
                  <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">{lore.titulo}</h3>
                  <p className="text-xs text-[#D9D7D2]/80 leading-relaxed">{lore.conteudo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: ANOTAÇÕES */}
        {abaAtiva === 'anotacoes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
              <div>
                <h2 className="font-serif text-2xl text-[#F5F3EE]">Anotações do Narrador</h2>
                <p className="text-xs text-[#666666] mt-0.5">Planejamento secreto e notas da crônica.</p>
              </div>
              <button
                onClick={() => setModalNovoItem('anotacoes')}
                className="px-4 py-2 bg-[#292929] hover:bg-[#333333] text-[#F5F3EE] text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-[#333333]"
              >
                + Nova Anotação
              </button>
            </div>

            <div className="space-y-4">
              {anotacoesCampanha.map(nota => (
                <div key={nota.id} className="bg-[#171717] border border-[#292929] p-6 rounded-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[#666666]">
                    <span>{nota.atualizadaEm}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#F5F3EE] font-normal">{nota.titulo}</h3>
                  <p className="text-xs text-[#D9D7D2]/80 leading-relaxed whitespace-pre-line">{nota.conteudo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: CONFIGURAÇÕES */}
        {abaAtiva === 'configuracoes' && (
          <div className="max-w-2xl space-y-8">
            <div className="pb-4 border-b border-[#292929]">
              <h2 className="font-serif text-2xl text-[#F5F3EE]">Configurações da Campanha</h2>
              <p className="text-xs text-[#666666] mt-0.5">Identificadores e sincronização da crônica.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[#666666] mb-2">
                  Código de Conexão da Mesa
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={campanha.codigo}
                    className="bg-[#171717] border border-[#292929] px-4 py-2.5 text-xs font-mono text-[#F5F3EE] rounded-sm w-48"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(campanha.codigo)}
                    className="px-4 py-2.5 bg-[#292929] hover:bg-[#333333] text-xs text-[#D9D7D2] rounded-sm border border-[#292929]"
                  >
                    Copiar Código
                  </button>
                </div>
                <p className="text-[11px] text-[#666666] mt-1.5">
                  Os jogadores utilizam este código para conectar seus Desvelados a esta mesa.
                </p>
              </div>

              {onExcluirCampanha && (
                <div className="pt-8 border-t border-[#292929]">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-rose-400 mb-2">
                    Zona de Exclusão
                  </h3>
                  <p className="text-xs text-[#666666] mb-4">
                    Remover esta campanha e suas referências locais.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente remover "${campanha.nome}"?`)) {
                        onExcluirCampanha(campanha.id);
                      }
                    }}
                    className="px-4 py-2 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 text-xs rounded-sm transition-colors"
                  >
                    Excluir Campanha
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Criar Nova Sessão */}
      {modalNovaSessao && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#292929] max-w-md w-full p-6 rounded-sm">
            <h3 className="font-serif text-2xl text-[#F5F3EE] mb-2">Criar Nova Sessão</h3>
            <p className="text-xs text-[#666666] mb-5">Adicione o próximo capítulo à crônica.</p>
            <form onSubmit={handleCriarSessaoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#666666] uppercase mb-1.5">Título da Sessão</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: A sombra sobre o asfalto..."
                  value={tituloNovaSessao}
                  onChange={(e) => setTituloNovaSessao(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#292929] px-3.5 py-2.5 text-xs text-[#F5F3EE] rounded-sm focus:border-[#A88952] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setModalNovaSessao(false)}
                  className="px-4 py-2 text-xs text-[#666666] hover:text-[#D9D7D2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium rounded-sm uppercase tracking-wider"
                >
                  Criar Sessão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Genérico para Adicionar Item (NPC, Adversário, Local, etc.) */}
      {modalNovoItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#292929] max-w-md w-full p-6 rounded-sm">
            <h3 className="font-serif text-2xl text-[#F5F3EE] mb-2 capitalize">
              Adicionar {modalNovoItem === 'npcs' ? 'NPC' : modalNovoItem === 'adversarios' ? 'Adversário' : modalNovoItem === 'locais' ? 'Local' : modalNovoItem === 'pistas' ? 'Pista' : modalNovoItem === 'lore' ? 'Lore' : 'Anotação'}
            </h3>
            <form onSubmit={handleCriarItemSubmit} className="space-y-4 pt-3">
              <div>
                <label className="block text-xs font-mono text-[#666666] uppercase mb-1.5">Nome / Título</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={itemNome}
                  onChange={(e) => setItemNome(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#292929] px-3.5 py-2.5 text-xs text-[#F5F3EE] rounded-sm focus:border-[#A88952] focus:outline-none"
                />
              </div>

              {(modalNovoItem === 'npcs' || modalNovoItem === 'adversarios' || modalNovoItem === 'locais') && (
                <div>
                  <label className="block text-xs font-mono text-[#666666] uppercase mb-1.5">
                    {modalNovoItem === 'npcs' ? 'Papel / Conceito' : modalNovoItem === 'adversarios' ? 'Ataque Principal' : 'Anomalia Detectada'}
                  </label>
                  <input
                    type="text"
                    value={itemExtra}
                    onChange={(e) => setItemExtra(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-[#292929] px-3.5 py-2.5 text-xs text-[#F5F3EE] rounded-sm focus:border-[#A88952] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[#666666] uppercase mb-1.5">Descrição / Conteúdo</label>
                <textarea
                  rows={3}
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-[#292929] px-3.5 py-2.5 text-xs text-[#D9D7D2] rounded-sm focus:border-[#A88952] focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setModalNovoItem(null)}
                  className="px-4 py-2 text-xs text-[#666666] hover:text-[#D9D7D2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-medium rounded-sm uppercase tracking-wider"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
