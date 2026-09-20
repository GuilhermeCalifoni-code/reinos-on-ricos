import React, { useState } from 'react';
import { Personagem, DistanciaFaixa } from '../types/character';
import { 
  CenaCompleta, 
  AntagonistaCena, 
  ContadorCena, 
  ObjetivoCena, 
  LogEventoCena, 
  EstadoCenaTipo 
} from '../types/tension';
import { DISTANCIAS_REINOS_ONIRICOS } from '../rules/rulesData';
import { MasterActionsModal, MasterActionTab } from './master/MasterActionsModal';
import { DreamResolverModal } from './master/DreamResolverModal';
import { EndSceneModal } from './master/EndSceneModal';

interface MasterPanelProps {
  personagens: Personagem[];
  onAtualizarPersonagem: (p: Personagem) => void;
  onAbrirModalRupturaPara: (p: Personagem, delta: number, motivo: string) => void;
}

const DISTANCIAS_ORDEM: DistanciaFaixa[] = [
  'imediata',
  'muito_proxima',
  'proxima',
  'longe',
  'muito_longe'
];

const PRESETS_ANTAGONISTAS: Omit<AntagonistaCena, 'id'>[] = [
  {
    nome: 'Agente Tático do Véu',
    tipo: 'ameaca',
    vidaMaxima: 4,
    vidaAtual: 4,
    resistencia: 8,
    defesa: 11,
    danoPadrao: 'd10',
    distancia: 'longe',
    condicoes: [],
    passivas: [
      { id: 'p-1', nome: 'Blindagem Tática', descricao: 'Equipamento de contenção pesada (+2 R contra balístico comum).' }
    ],
    acoes: [
      { id: 'a-1', nome: 'Disparo de Fuzil Tático', descricao: 'Disparo em rajada controlada à distância.', dano: 'd10', tipo: 'ataque' },
      { id: 'a-2', nome: 'Avançar com Escudo', descricao: 'Avança uma faixa de distância sob cobertura rígida.', tipo: 'movimento' },
      { id: 'a-3', nome: 'Granada Estroboscópica', descricao: 'Clarão ofuscante que impõe cegueira temporária.', tipo: 'controle' }
    ],
    reacoes: [
      { id: 'r-1', gatilho: 'Quando alvejado de perto', efeito: 'Recua imediatamente para trás de cobertura sólida (+2 Defesa temporária).' }
    ],
    observacoes: 'Opera em coordenação com a DCR. Carrega rádio criptografado.'
  },
  {
    nome: 'Eco de Concreto',
    tipo: 'criatura_onirica',
    vidaMaxima: 4,
    vidaAtual: 4,
    resistencia: 8,
    defesa: 10,
    danoPadrao: 'd8',
    distancia: 'muito_proxima',
    condicoes: [],
    passivas: [
      { id: 'p-2', nome: 'Mimetismo Estrutural', descricao: 'Indistinguível das paredes de cimento até se movimentar.' }
    ],
    acoes: [
      { id: 'a-4', nome: 'Garras de Cimento Armado', descricao: 'Golpe pesado rasgando a matéria.', dano: 'd8', tipo: 'ataque' },
      { id: 'a-5', nome: 'Dobrar Pavimento', descricao: 'Prende as pernas do alvo no asfalto (exige teste de Corpo DT 12 para soltar).', tipo: 'controle' }
    ],
    reacoes: [
      { id: 'r-2', gatilho: 'Quando sofrer dano', efeito: 'Estilhaços de concreto ricocheteiam atingindo quem estiver em distância Imediata.' }
    ],
    observacoes: 'Manifestação da metrópole ferida. Responde a vibrações de passos.'
  },
  {
    nome: 'Policial Velado',
    tipo: 'humano',
    vidaMaxima: 3,
    vidaAtual: 3,
    resistencia: 7,
    defesa: 9,
    danoPadrao: 'd8',
    distancia: 'proxima',
    condicoes: [],
    passivas: [
      { id: 'p-3', nome: 'Vigilância Urbana', descricao: 'Percebe movimentações suspeitas rapidamente na Realidade consensual.' }
    ],
    acoes: [
      { id: 'a-6', nome: 'Disparo de Pistola .40', descricao: 'Disparo convencional rápido.', dano: 'd8', tipo: 'ataque' },
      { id: 'a-7', nome: 'Alerta pelo Rádio', descricao: 'Pede apoio policial (+1 no Contador de Intervenção DCR).', tipo: 'habilidade' }
    ],
    reacoes: [
      { id: 'r-3', gatilho: 'Se testemunhar Sonhar', efeito: 'Entra em choque ou delírio (+1 Ruptura local e perde próxima ação).' }
    ],
    observacoes: 'Despreparado para o impossível. Tenta agir pelo protocolo padrão.'
  },
  {
    nome: 'Pesadelo Urbano (Colapso)',
    tipo: 'pesadelo',
    vidaMaxima: 6,
    vidaAtual: 6,
    resistencia: 10,
    defesa: 13,
    danoPadrao: 'd12',
    distancia: 'proxima',
    condicoes: [],
    passivas: [
      { id: 'p-4', nome: 'Distorção do Véu', descricao: 'O ar ondula ao redor; reflexos em vidraças mostram mortes passadas.' }
    ],
    acoes: [
      { id: 'a-8', nome: 'Devorar Certezas', descricao: 'Golpe onírico destruidor de ancoragem consensual.', dano: 'd12', tipo: 'ataque' },
      { id: 'a-9', nome: 'Onda de Pânico Invertido', descricao: 'Impõe teste de Vontade DT 14 em todos em distância Próxima.', tipo: 'controle' }
    ],
    reacoes: [
      { id: 'r-4', gatilho: 'Quando um Desvelado manifestar Sonhar', efeito: 'Canaliza o eco da manifestação para regenerar 1 de Vida ou fechar uma saída.' }
    ],
    observacoes: 'Entidade pura da Ruptura. Não pode ser ferida permanentemente sem uso de Domínios.'
  }
];

export const MasterPanel: React.FC<MasterPanelProps> = ({
  personagens,
  onAtualizarPersonagem,
  onAbrirModalRupturaPara
}) => {
  // Estado Completo da Cena de Tensão
  const [cena, setCena] = useState<CenaCompleta>({
    id: 'cena-' + Date.now(),
    titulo: 'Confronto no Beco da Névoa',
    descricao: 'As luzes piscam e o asfalto parece respirar. Figuras em sobretudos táticos cercam a saída do beco.',
    estado: 'tensao',
    elementosFiccao: [
      'Viatura descaracterizada bloqueia o final da travessa.',
      'Poças de chuva refletem um céu noturno sem estrelas nem prédios.',
      'Container de descarte de metal oferece cobertura parcial.'
    ],
    objetivos: [
      { id: 'obj-1', descricao: 'Atravessar o bloqueio antes da chegada de reforços do Véu', estado: 'em_andamento' },
      { id: 'obj-2', descricao: 'Impedir que o Eco de Concreto colapse a saída do beco', estado: 'em_andamento' }
    ],
    contadores: [
      { id: 'c-1', nome: 'Chegada da Intervenção DCR', descricao: 'Viaturas táticas e bloqueio de perímetro', valorAtual: 2, valorMaximo: 6, concluido: false },
      { id: 'c-2', nome: 'Distorção do Tecido Urbano', descricao: 'Rompimento da ancoragem no beco', valorAtual: 1, valorMaximo: 4, concluido: false }
    ],
    antagonistas: [
      {
        id: 'ant-1',
        nome: 'Agente Tático do Véu',
        tipo: 'ameaca',
        vidaMaxima: 4,
        vidaAtual: 4,
        resistencia: 8,
        defesa: 11,
        danoPadrao: 'd10',
        distancia: 'longe',
        condicoes: [],
        passivas: [
          { id: 'p-1', nome: 'Blindagem Tática', descricao: 'Equipamento de contenção (+2 R).' }
        ],
        acoes: [
          { id: 'a-1', nome: 'Disparo de Fuzil Tático', descricao: 'Disparo preciso à distância.', dano: 'd10', tipo: 'ataque' },
          { id: 'a-2', nome: 'Avançar com Escudo', descricao: 'Avança uma faixa de distância sob cobertura.', tipo: 'movimento' }
        ],
        reacoes: [
          { id: 'r-1', gatilho: 'Quando alvejado', efeito: 'Busca abrigo imediato (+2 DEF temporário).' }
        ],
        observacoes: 'Atrás do capô da viatura.'
      },
      {
        id: 'ant-2',
        nome: 'Eco de Concreto',
        tipo: 'criatura_onirica',
        vidaMaxima: 4,
        vidaAtual: 4,
        resistencia: 8,
        defesa: 10,
        danoPadrao: 'd8',
        distancia: 'muito_proxima',
        condicoes: [],
        passivas: [
          { id: 'p-2', nome: 'Mimetismo Estrutural', descricao: 'Confunde-se com a parede até golpear.' }
        ],
        acoes: [
          { id: 'a-3', nome: 'Garras de Cimento', descricao: 'Golpe rasgante.', dano: 'd8', tipo: 'ataque' },
          { id: 'a-4', nome: 'Dobrar Asfalto', descricao: 'Prende pés dos alvos no chão.', tipo: 'controle' }
        ],
        reacoes: [
          { id: 'r-2', gatilho: 'Ao sofrer dano', efeito: 'Estilhaços afiados atingem distância Imediata.' }
        ],
        observacoes: 'Surgindo da parede lateral úmida.'
      }
    ],
    fluxo: {
      rodadaAtual: 1,
      fase: 'jogador',
      ultimoJogadorId: undefined,
      jogadoresQueAgiramIds: [],
      mestreAcaoPendente: false
    },
    log: [
      {
        id: 'log-init',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: 'sistema',
        autor: 'Narrador',
        descricao: 'A Cena de Tensão "Confronto no Beco da Névoa" foi iniciada na Rodada 01.'
      }
    ]
  });

  // Antagonista em Progressive Disclosure (card expandido)
  const [antagonistaExpandidoId, setAntagonistaExpandidoId] = useState<string | null>(null);

  // Modais do Modo Mestre
  const [modalAcaoMestreAberto, setModalAcaoMestreAberto] = useState(false);
  const [abaAcaoMestreInicial, setAbaAcaoMestreInicial] = useState<MasterActionTab>('antagonista');
  const [modalSonharAberto, setModalSonharAberto] = useState(false);
  const [modalEncerrarCenaAberto, setModalEncerrarCenaAberto] = useState(false);

  // Inputs locais rápidos
  const [novoElementoFiccao, setNovoElementoFiccao] = useState('');
  const [novoObjetivoTexto, setNovoObjetivoTexto] = useState('');
  const [novoContadorNome, setNovoContadorNome] = useState('');
  const [novoContadorMax, setNovoContadorMax] = useState(6);

  // Adicionar Log
  const registrarLog = (tipo: LogEventoCena['tipo'], descricao: string, detalhes?: string) => {
    const novoItem: LogEventoCena = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo,
      autor: tipo === 'jogador' ? 'Desvelado' : 'Mestre',
      descricao,
      detalhes
    };
    setCena(prev => ({
      ...prev,
      log: [novoItem, ...prev.log].slice(0, 40)
    }));
  };

  // Turno Alternado Canônico:
  // Jogador age -> Mestre tem Ação do Mestre -> Próximo Jogador -> Mestre tem Ação do Mestre -> ...
  // Quando todos os personagens agirem -> Rodada termina!
  const handleJogadorAgiu = (personagemId: string) => {
    const p = personagens.find(x => x.id === personagemId);
    if (!p) return;

    setCena(prev => {
      const novosAgiram = Array.from(new Set([...prev.fluxo.jogadoresQueAgiramIds, personagemId]));
      const todosAgiram = personagens.length > 0 && novosAgiram.length >= personagens.length;

      const novoFluxo = {
        ...prev.fluxo,
        ultimoJogadorId: personagemId,
        jogadoresQueAgiramIds: novosAgiram,
        mestreAcaoPendente: true, // Libera ação imediata do mestre!
        fase: 'mestre' as const
      };

      return {
        ...prev,
        fluxo: novoFluxo
      };
    });

    registrarLog('jogador', `${p.nome} concluiu sua ação na Rodada ${cena.fluxo.rodadaAtual}.`, 'Vez do Mestre executar uma Ação do Mestre.');
  };

  // Consumir Ação do Mestre
  const handleConsumirAcaoMestre = () => {
    setCena(prev => {
      const todosAgiram = personagens.length > 0 && prev.fluxo.jogadoresQueAgiramIds.length >= personagens.length;

      if (todosAgiram) {
        // Rodada completa! Avança para próxima rodada e reseta lista de quem agiu
        return {
          ...prev,
          fluxo: {
            rodadaAtual: prev.fluxo.rodadaAtual + 1,
            fase: 'jogador',
            ultimoJogadorId: undefined,
            jogadoresQueAgiramIds: [],
            mestreAcaoPendente: false
          }
        };
      } else {
        // Próximo jogador
        return {
          ...prev,
          fluxo: {
            ...prev.fluxo,
            fase: 'jogador',
            mestreAcaoPendente: false
          }
        };
      }
    });
  };

  // Abrir Ação do Mestre Direta
  const abrirAcaoMestre = (aba: MasterActionTab) => {
    setAbaAcaoMestreInicial(aba);
    setModalAcaoMestreAberto(true);
  };

  // Manipulação de Distância com [←] e [→]
  const alterarDistanciaAntagonista = (antId: string, direcao: 'aproximar' | 'afastar') => {
    setCena(prev => ({
      ...prev,
      antagonistas: prev.antagonistas.map(a => {
        if (a.id !== antId) return a;
        const indexAtual = DISTANCIAS_ORDEM.indexOf(a.distancia);
        let novoIndex = indexAtual;
        if (direcao === 'aproximar' && indexAtual > 0) {
          novoIndex = indexAtual - 1;
        } else if (direcao === 'afastar' && indexAtual < DISTANCIAS_ORDEM.length - 1) {
          novoIndex = indexAtual + 1;
        }
        const novaDist = DISTANCIAS_ORDEM[novoIndex];
        if (novaDist !== a.distancia) {
          registrarLog('distancia', `${a.nome} alterou distância para ${DISTANCIAS_REINOS_ONIRICOS[novaDist].nome}.`);
        }
        return { ...a, distancia: novaDist };
      })
    }));
  };

  // Manipulação de Vida do Antagonista
  const alterarVidaAntagonista = (antId: string, delta: number) => {
    setCena(prev => ({
      ...prev,
      antagonistas: prev.antagonistas.map(a => {
        if (a.id !== antId) return a;
        const nova = Math.max(0, Math.min(a.vidaMaxima, a.vidaAtual + delta));
        if (nova === 0 && a.vidaAtual > 0) {
          registrarLog('mestre', `${a.nome} foi neutralizado (0 Vida).`);
        }
        return { ...a, vidaAtual: nova };
      })
    }));
  };

  // Adicionar Antagonista de Preset
  const handleAdicionarAntagonistaPreset = (presetIndex: number) => {
    const p = PRESETS_ANTAGONISTAS[presetIndex];
    const novo: AntagonistaCena = {
      ...p,
      id: 'ant-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
    };
    setCena(prev => ({
      ...prev,
      antagonistas: [...prev.antagonistas, novo]
    }));
    registrarLog('mestre', `Nova ameaça entrou na cena: ${novo.nome} (${DISTANCIAS_REINOS_ONIRICOS[novo.distancia].nome}).`);
  };

  // Remover Antagonista
  const handleRemoverAntagonista = (id: string) => {
    const a = cena.antagonistas.find(x => x.id === id);
    setCena(prev => ({
      ...prev,
      antagonistas: prev.antagonistas.filter(x => x.id !== id)
    }));
    if (a) {
      registrarLog('mestre', `${a.nome} foi removido da cena.`);
    }
  };

  // Contadores
  const handleAvancarContador = (contadorId: string, delta: number) => {
    setCena(prev => ({
      ...prev,
      contadores: prev.contadores.map(c => {
        if (c.id !== contadorId) return c;
        const novoValor = Math.max(0, Math.min(c.valorMaximo, c.valorAtual + delta));
        const concluido = novoValor >= c.valorMaximo;
        registrarLog(
          'contador',
          `Contador "${c.nome}" avançou para ${novoValor}/${c.valorMaximo}`,
          concluido ? 'CONTADOR CONCLUÍDO! O Mestre decide a consequência na ficção.' : undefined
        );
        return { ...c, valorAtual: novoValor, concluido };
      })
    }));
  };

  const handleCriarContador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoContadorNome.trim()) return;
    const novo: ContadorCena = {
      id: 'c-' + Date.now(),
      nome: novoContadorNome.trim(),
      valorAtual: 0,
      valorMaximo: novoContadorMax,
      concluido: false
    };
    setCena(prev => ({
      ...prev,
      contadores: [...prev.contadores, novo]
    }));
    setNovoContadorNome('');
    registrarLog('contador', `Novo contador criado: "${novo.nome}" (0/${novo.valorMaximo}).`);
  };

  const handleRemoverContador = (id: string) => {
    setCena(prev => ({
      ...prev,
      contadores: prev.contadores.filter(c => c.id !== id)
    }));
  };

  // Objetivos da Cena
  const handleAlternarObjetivoEstado = (id: string) => {
    setCena(prev => ({
      ...prev,
      objetivos: prev.objetivos.map(obj => {
        if (obj.id !== id) return obj;
        const prox = obj.estado === 'em_andamento' ? 'concluido' : obj.estado === 'concluido' ? 'falhou' : 'em_andamento';
        registrarLog('mestre', `Objetivo "${obj.descricao}" marcado como ${prox.toUpperCase()}.`);
        return { ...obj, estado: prox };
      })
    }));
  };

  const handleCriarObjetivo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoObjetivoTexto.trim()) return;
    const novo: ObjetivoCena = {
      id: 'obj-' + Date.now(),
      descricao: novoObjetivoTexto.trim(),
      estado: 'em_andamento'
    };
    setCena(prev => ({
      ...prev,
      objetivos: [...prev.objetivos, novo]
    }));
    setNovoObjetivoTexto('');
    registrarLog('mestre', `Novo objetivo da cena: "${novo.descricao}".`);
  };

  const handleRemoverObjetivo = (id: string) => {
    setCena(prev => ({
      ...prev,
      objetivos: prev.objetivos.filter(o => o.id !== id)
    }));
  };

  // Elementos da Ficção
  const handleAdicionarElementoFiccao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoElementoFiccao.trim()) return;
    setCena(prev => ({
      ...prev,
      elementosFiccao: [...prev.elementosFiccao, novoElementoFiccao.trim()]
    }));
    setNovoElementoFiccao('');
  };

  const handleRemoverElementoFiccao = (index: number) => {
    setCena(prev => ({
      ...prev,
      elementosFiccao: prev.elementosFiccao.filter((_, i) => i !== index)
    }));
  };

  // Concluir Encerramento da Cena
  const handleConfirmarEncerramentoCena = (consequenciasFinais: string) => {
    setCena(prev => ({
      ...prev,
      estado: 'encerrada'
    }));
    registrarLog(
      'sistema',
      `Cena de Tensão "${cena.titulo}" encerrada.`,
      consequenciasFinais ? `Desfecho: ${consequenciasFinais}` : 'Cena concluída.'
    );
    setModalEncerrarCenaAberto(false);
  };

  // Jogadores que faltam agir na rodada atual
  const jogadoresPendentes = personagens.filter(p => !cena.fluxo.jogadoresQueAgiramIds.includes(p.id));
  const ultimoJogador = personagens.find(p => p.id === cena.fluxo.ultimoJogadorId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans text-xs">
      
      {/* ========================================================================= */}
      {/* 1. TOPO DA CENA: POSTO DE COMANDO & ESTADO OPERACIONAL                    */}
      {/* ========================================================================= */}
      <div className="bg-[#171717] border border-[#292929] p-5 rounded-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#292929] pb-4">
          
          {/* Identificação da Cena e Estado */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#A88952] border border-[#75603D]/60 px-1.5 py-0.5 rounded-sm">
                REINOS ONÍRICOS · MODO MESTRE
              </span>
              <span className="text-[#292929]">|</span>
              <select
                value={cena.estado}
                onChange={(e) => {
                  const est = e.target.value as EstadoCenaTipo;
                  setCena(prev => ({ ...prev, estado: est }));
                  registrarLog('mestre', `Estado da cena alterado para: ${est.toUpperCase()}`);
                }}
                className="bg-[#0B0B0B] border border-[#292929] text-xs font-mono uppercase text-[#D9D7D2] px-2 py-1 rounded-sm focus:outline-none"
              >
                <option value="tensao">Cena de Tensão</option>
                <option value="normal">Cena Normal</option>
                <option value="investigacao">Investigação</option>
                <option value="exploracao">Exploração</option>
                <option value="transicao">Transição</option>
                <option value="encerrada">Encerrada</option>
              </select>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#F5F3EE] tracking-tight">
              {cena.titulo}
            </h1>
          </div>

          {/* Rodada & Ação do Mestre Disponível */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#0B0B0B] border border-[#292929] px-3.5 py-2 rounded-sm text-center font-mono">
              <div className="text-[10px] text-[#666666] uppercase">Rodada Atual</div>
              <div className="text-xl font-bold text-[#F5F3EE]">
                {String(cena.fluxo.rodadaAtual).padStart(2, '0')}
              </div>
            </div>

            {/* Indicador Chamativo de Turno Alternado */}
            {cena.fluxo.mestreAcaoPendente ? (
              <div className="bg-amber-950/30 border border-[#A88952] px-4 py-2 rounded-sm flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#A88952] animate-pulse" />
                <div>
                  <div className="font-mono text-xs font-bold text-[#F5F3EE] uppercase tracking-wider">
                    Sua Vez · Ação do Mestre Disponível
                  </div>
                  <div className="text-[10px] text-[#A88952] font-mono">
                    {ultimoJogador ? `${ultimoJogador.nome} acabou de agir.` : 'Reaja à ficção.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => abrirAcaoMestre('antagonista')}
                  className="px-3 py-1 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-mono font-semibold uppercase tracking-wider rounded-sm transition-colors"
                >
                  Agir Agora →
                </button>
              </div>
            ) : (
              <div className="bg-[#0B0B0B] border border-[#292929] px-4 py-2 rounded-sm flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                <div>
                  <div className="font-mono text-xs text-[#D9D7D2] uppercase tracking-wider">
                    Vez dos Desvelados
                  </div>
                  <div className="text-[10px] text-[#666666] font-mono">
                    {jogadoresPendentes.length} {jogadoresPendentes.length === 1 ? 'jogador falta' : 'jogadores faltam'} agir nesta rodada
                  </div>
                </div>
              </div>
            )}

            {/* Ações de Gestão da Cena */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalSonharAberto(true)}
                className="px-3 py-2 bg-[#171717] hover:bg-[#292929] border border-[#292929] text-xs font-mono text-[#D9D7D2] rounded-sm transition-colors"
              >
                ✦ Resolver Sonhar
              </button>

              <button
                type="button"
                onClick={() => setModalEncerrarCenaAberto(true)}
                className="px-3 py-2 bg-[#171717] hover:bg-rose-950/30 border border-[#292929] hover:border-rose-900/60 text-xs font-mono text-[#D9D7D2] hover:text-rose-300 rounded-sm transition-colors"
              >
                Encerrar Cena
              </button>
            </div>

          </div>

        </div>

        {/* Sinopse da Cena & Elementos da Ficção */}
        <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <div className="lg:col-span-2 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#666666]">
              Atmosfera & Cenário Atual
            </div>
            <p className="font-serif text-sm text-[#D9D7D2] leading-relaxed italic">
              "{cena.descricao}"
            </p>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#666666] mb-1.5 flex items-center justify-between">
              <span>Elementos Importantes da Ficção</span>
              <span className="text-[#A88952]">{cena.elementosFiccao.length} ativos</span>
            </div>
            <div className="space-y-1">
              {cena.elementosFiccao.map((el, idx) => (
                <div key={idx} className="flex items-start justify-between text-[#F5F3EE] bg-[#0B0B0B] border border-[#292929] px-2.5 py-1 rounded-sm text-[11px] font-mono">
                  <span>• {el}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoverElementoFiccao(idx)}
                    className="text-[#666666] hover:text-rose-400 ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}

              <form onSubmit={handleAdicionarElementoFiccao} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={novoElementoFiccao}
                  onChange={(e) => setNovoElementoFiccao(e.target.value)}
                  placeholder="+ Elemento físico ou onírico..."
                  className="flex-1 bg-[#0B0B0B] border border-[#292929] text-[11px] font-mono text-[#F5F3EE] px-2 py-1 rounded-sm focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-[#292929] text-[#D9D7D2] text-[11px] font-mono rounded-sm hover:bg-[#333333]"
                >
                  Adicionar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE AÇÃO CENTRAL DO MESTRE                                       */}
      {/* ========================================================================= */}
      <div className="bg-[#171717] border border-[#292929] p-4 rounded-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#A88952]">
              Ações Rápidas do Mestre:
            </span>
            <span className="text-[#666666] text-[11px] hidden md:inline">
              (Escolha como intervir na ficção após a ação de cada Desvelado)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => abrirAcaoMestre('antagonista')}
              className="px-3 py-2 bg-[#0B0B0B] hover:bg-[#292929] border border-[#292929] hover:border-[#A88952]/60 text-xs font-mono uppercase tracking-wider text-[#F5F3EE] rounded-sm transition-colors text-center"
            >
              ⚔ Ativar Antagonista
            </button>

            <button
              type="button"
              onClick={() => abrirAcaoMestre('ambiente')}
              className="px-3 py-2 bg-[#0B0B0B] hover:bg-[#292929] border border-[#292929] hover:border-[#A88952]/60 text-xs font-mono uppercase tracking-wider text-[#F5F3EE] rounded-sm transition-colors text-center"
            >
              ⚡ Ativar Ambiente
            </button>

            <button
              type="button"
              onClick={() => abrirAcaoMestre('ficcao')}
              className="px-3 py-2 bg-[#0B0B0B] hover:bg-[#292929] border border-[#292929] hover:border-[#A88952]/60 text-xs font-mono uppercase tracking-wider text-[#F5F3EE] rounded-sm transition-colors text-center"
            >
              ✦ Mover Ficção
            </button>

            <button
              type="button"
              onClick={() => abrirAcaoMestre('contador')}
              className="px-3 py-2 bg-[#0B0B0B] hover:bg-[#292929] border border-[#292929] hover:border-[#A88952]/60 text-xs font-mono uppercase tracking-wider text-[#F5F3EE] rounded-sm transition-colors text-center"
            >
              ⏳ Avançar Contador
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRID PRINCIPAL: SEQUÊNCIA + ANTAGONISTAS + CONTADORES & LOG           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUNA ESQUERDA (3 colunas): SEQUÊNCIA DE AÇÕES NA RODADA & OBJETIVOS */}
        <div className="lg:col-span-3 space-y-6">

          {/* SEQUÊNCIA DA RODADA (Alternada e Colaborativa) */}
          <div className="bg-[#171717] border border-[#292929] p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#292929] pb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#F5F3EE]">
                Sequência · Rodada {String(cena.fluxo.rodadaAtual).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono text-[#A88952]">
                {cena.fluxo.jogadoresQueAgiramIds.length}/{personagens.length} Agiram
              </span>
            </div>

            <div className="text-[11px] text-[#666666] leading-snug font-mono">
              Os jogadores decidem quem age primeiro. A cada ação de um jogador, o Mestre tem uma ação.
            </div>

            {/* Lista dos Desvelados */}
            <div className="space-y-2 pt-1">
              {personagens.map(p => {
                const jaAgiu = cena.fluxo.jogadoresQueAgiramIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 border rounded-sm transition-colors font-mono ${
                      jaAgiu
                        ? 'bg-[#0B0B0B] border-[#292929] opacity-70'
                        : 'bg-[#171717] border-[#333333] hover:border-[#A88952]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-[#F5F3EE] flex items-center gap-1.5">
                          <span>{jaAgiu ? '✓' : '○'}</span>
                          <span>{p.nome}</span>
                        </div>
                        <div className="text-[10px] text-[#666666] mt-0.5">
                          Vida {p.vidaAtual}/{p.vidaMaxima} · DEF {p.defesa} · Ruptura {p.ruptura}/6
                        </div>
                      </div>

                      {!jaAgiu ? (
                        <button
                          type="button"
                          onClick={() => handleJogadorAgiu(p.id)}
                          className="px-2 py-1 bg-[#292929] hover:bg-[#A88952] hover:text-[#0B0B0B] text-[#D9D7D2] text-[10px] uppercase tracking-wider rounded-sm transition-colors"
                        >
                          Agiu →
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400">
                          Concluído
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão de Fechar / Forçar Próxima Rodada se necessário */}
            <div className="pt-2 border-t border-[#292929] flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#666666]">
                {jogadoresPendentes.length === 0 ? 'Todos agiram nesta rodada' : 'Aguardando ações'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCena(prev => ({
                    ...prev,
                    fluxo: {
                      rodadaAtual: prev.fluxo.rodadaAtual + 1,
                      fase: 'jogador',
                      ultimoJogadorId: undefined,
                      jogadoresQueAgiramIds: [],
                      mestreAcaoPendente: false
                    }
                  }));
                  registrarLog('sistema', `Rodada ${cena.fluxo.rodadaAtual + 1} iniciada manualmente.`);
                }}
                className="text-[#A88952] hover:underline"
              >
                Nova Rodada →
              </button>
            </div>
          </div>

          {/* OBJETIVOS DA CENA */}
          <div className="bg-[#171717] border border-[#292929] p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#292929] pb-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#F5F3EE]">
                Objetivos da Cena
              </span>
            </div>

            <div className="space-y-2">
              {cena.objetivos.map(obj => (
                <div
                  key={obj.id}
                  className="p-2 bg-[#0B0B0B] border border-[#292929] rounded-sm font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#D9D7D2] leading-snug">{obj.descricao}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoverObjetivo(obj.id)}
                      className="text-[#666666] hover:text-rose-400 text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1f1f1f]">
                    <button
                      type="button"
                      onClick={() => handleAlternarObjetivoEstado(obj.id)}
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-sm transition-colors ${
                        obj.estado === 'concluido'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                          : obj.estado === 'falhou'
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                          : 'bg-[#292929] text-[#D9D7D2]'
                      }`}
                    >
                      {obj.estado === 'concluido' ? '✓ Concluído' : obj.estado === 'falhou' ? '✕ Falhou' : '○ Em Andamento'}
                    </button>
                    <span className="text-[10px] text-[#666666]">Clique p/ alternar</span>
                  </div>
                </div>
              ))}

              <form onSubmit={handleCriarObjetivo} className="pt-1">
                <input
                  type="text"
                  value={novoObjetivoTexto}
                  onChange={(e) => setNovoObjetivoTexto(e.target.value)}
                  placeholder="+ Novo objetivo narrativo..."
                  className="w-full bg-[#0B0B0B] border border-[#292929] text-xs font-mono text-[#F5F3EE] p-2 rounded-sm focus:outline-none"
                />
              </form>
            </div>
          </div>

        </div>

        {/* COLUNA CENTRAL (6 colunas): AMEAÇAS & ANTAGONISTAS COM PROGRESSIVE DISCLOSURE */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="flex items-center justify-between border-b border-[#292929] pb-2 font-mono">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#F5F3EE]">
                Ameaças & Antagonistas Ativos
              </span>
              <span className="text-[#666666] ml-2 text-[11px]">({cena.antagonistas.length})</span>
            </div>

            {/* Menu Rápido de Adicionar Preset */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-[#666666]">Adicionar Preset:</span>
              <select
                onChange={(e) => {
                  if (e.target.value !== '') {
                    handleAdicionarAntagonistaPreset(Number(e.target.value));
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-[#171717] border border-[#292929] text-[#D9D7D2] px-2 py-1 rounded-sm focus:outline-none"
              >
                <option value="" disabled>+ Selecionar Preset...</option>
                {PRESETS_ANTAGONISTAS.map((pr, idx) => (
                  <option key={idx} value={idx}>
                    {pr.nome} ({pr.tipo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cena.antagonistas.length === 0 ? (
            <div className="bg-[#171717] border border-[#292929] p-8 rounded-sm text-center font-mono text-xs text-[#666666]">
              Nenhuma ameaça na cena atual. Use os presets acima ou crie um antagonista para conduzir o confronto.
            </div>
          ) : (
            <div className="space-y-3">
              {cena.antagonistas.map(ant => {
                const isExpandido = antagonistaExpandidoId === ant.id;
                const estaNeutralizado = ant.vidaAtual <= 0;

                return (
                  <div
                    key={ant.id}
                    className={`bg-[#171717] border rounded-sm transition-all font-mono ${
                      estaNeutralizado
                        ? 'border-[#292929] opacity-50'
                        : isExpandido
                        ? 'border-[#A88952]/80'
                        : 'border-[#292929] hover:border-[#333333]'
                    }`}
                  >
                    {/* CARD PRINCIPAL (PROGRESSIVE DISCLOSURE: Mostra apenas o essencial) */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${estaNeutralizado ? 'bg-zinc-600' : 'bg-rose-500'}`} />
                          <h3 className="text-sm font-semibold text-[#F5F3EE] uppercase tracking-wide">
                            {ant.nome}
                          </h3>
                          <span className="text-[10px] text-[#666666] border border-[#292929] px-1.5 py-0.5 rounded-sm uppercase">
                            {ant.tipo}
                          </span>
                        </div>

                        {/* Estatísticas Essenciais: Vida, Resistência, Defesa, Distância */}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#666666] text-[10px] uppercase">Vida:</span>
                            <span className="font-bold text-[#F5F3EE]">{ant.vidaAtual}/{ant.vidaMaxima}</span>
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                type="button"
                                onClick={() => alterarVidaAntagonista(ant.id, -1)}
                                className="w-5 h-5 bg-[#0B0B0B] hover:bg-[#292929] border border-[#292929] rounded-sm text-center leading-none text-[#D9D7D2]"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => alterarVidaAntagonista(ant.id, 1)}
                                className="w-5 h-5 bg-[#0B0B0B] hover:bg-[#292929] border border-[#292929] rounded-sm text-center leading-none text-[#D9D7D2]"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="text-[#666666]">
                            <span className="text-[10px] uppercase">R: </span>
                            <strong className="text-[#F5F3EE]">{ant.resistencia}</strong>
                          </div>

                          <div className="text-[#666666]">
                            <span className="text-[10px] uppercase">DEF: </span>
                            <strong className="text-[#F5F3EE]">{ant.defesa}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Controle Rápido de Distância e Ações */}
                      <div className="flex items-center gap-3">
                        
                        {/* Seletor Visual Rápido [←] Distância [→] */}
                        <div className="flex items-center bg-[#0B0B0B] border border-[#292929] rounded-sm p-0.5 text-xs">
                          <button
                            type="button"
                            title="Aproximar (mais perto)"
                            onClick={() => alterarDistanciaAntagonista(ant.id, 'aproximar')}
                            className="px-2 py-1 text-[#666666] hover:text-[#F5F3EE] transition-colors"
                          >
                            ←
                          </button>
                          <span className="px-2 py-0.5 text-[11px] uppercase tracking-wider text-[#A88952] font-semibold border-x border-[#292929]">
                            {DISTANCIAS_REINOS_ONIRICOS[ant.distancia].nome}
                          </span>
                          <button
                            type="button"
                            title="Afastar (mais longe)"
                            onClick={() => alterarDistanciaAntagonista(ant.id, 'afastar')}
                            className="px-2 py-1 text-[#666666] hover:text-[#F5F3EE] transition-colors"
                          >
                            →
                          </button>
                        </div>

                        {/* Botão [ ATIVAR ] */}
                        <button
                          type="button"
                          onClick={() => {
                            abrirAcaoMestre('antagonista');
                          }}
                          className="px-3 py-1.5 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors"
                        >
                          Ativar
                        </button>

                        {/* Botão [⋯] para Expandir Progressive Disclosure */}
                        <button
                          type="button"
                          onClick={() => setAntagonistaExpandidoId(isExpandido ? null : ant.id)}
                          className="px-2 py-1 bg-[#0B0B0B] hover:bg-[#292929] border border-[#292929] text-[#666666] hover:text-[#F5F3EE] text-xs rounded-sm transition-colors"
                          title="Detalhes, Ações, Passivas e Reações"
                        >
                          {isExpandido ? '▲' : '⋯'}
                        </button>
                      </div>
                    </div>

                    {/* ÁREA EXPANDIDA CONTEXTUAL (PROGRESSIVE DISCLOSURE) */}
                    {isExpandido && (
                      <div className="p-4 border-t border-[#292929] bg-[#0B0B0B] space-y-3 text-xs">
                        
                        {/* Ações */}
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#666666] mb-1">
                            Ações Ofensivas & Táticas:
                          </div>
                          <div className="space-y-1">
                            {ant.acoes?.map(ac => (
                              <div key={ac.id} className="p-2 bg-[#171717] border border-[#292929] rounded-sm flex items-center justify-between">
                                <div>
                                  <span className="text-[#F5F3EE] font-medium">{ac.nome}</span>
                                  {ac.dano && <span className="text-[#A88952] ml-1.5 font-bold">[{ac.dano}]</span>}
                                  <span className="text-[#666666] ml-2 text-[11px]">{ac.descricao}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Reações e Passivas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#666666] mb-1">
                              Reações Disponíveis (Com Gatilho Claro):
                            </div>
                            {ant.reacoes?.length > 0 ? (
                              ant.reacoes.map(r => (
                                <div key={r.id} className="p-2 bg-[#171717] border border-[#292929] rounded-sm text-[11px]">
                                  <span className="text-amber-400 font-semibold block">{r.gatilho}</span>
                                  <span className="text-[#D9D7D2]">{r.efeito}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-[#666666] text-[11px]">Nenhuma reação especial configurada.</div>
                            )}
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#666666] mb-1">
                              Habilidades Passivas:
                            </div>
                            {ant.passivas?.length > 0 ? (
                              ant.passivas.map(p => (
                                <div key={p.id} className="p-2 bg-[#171717] border border-[#292929] rounded-sm text-[11px]">
                                  <span className="text-[#F5F3EE] font-semibold block">{p.nome}</span>
                                  <span className="text-[#666666]">{p.descricao}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-[#666666] text-[11px]">Nenhuma passiva ativa.</div>
                            )}
                          </div>
                        </div>

                        {/* Notas & Remover */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-[11px]">
                          <span className="text-[#666666] italic">
                            {ant.observacoes || 'Sem notas adicionais.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverAntagonista(ant.id)}
                            className="text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            Remover da Cena
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* COLUNA DIREITA (3 colunas): CONTADORES / RELÓGIOS & LOG DA CENA */}
        <div className="lg:col-span-3 space-y-6">

          {/* CONTADORES DA CENA (CLOCKS: ████░░) */}
          <div className="bg-[#171717] border border-[#292929] p-4 rounded-sm space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#292929] pb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#F5F3EE]">
                Contadores da Cena
              </span>
              <span className="text-[10px] text-[#A88952]">
                {cena.contadores.filter(c => c.concluido).length}/{cena.contadores.length} Concluídos
              </span>
            </div>

            <div className="space-y-2">
              {cena.contadores.map(c => {
                const progresso = Math.min(100, Math.round((c.valorAtual / c.valorMaximo) * 100));
                return (
                  <div key={c.id} className="p-2.5 bg-[#0B0B0B] border border-[#292929] rounded-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#F5F3EE]">{c.nome}</div>
                        {c.descricao && (
                          <div className="text-[10px] text-[#666666] mt-0.5">{c.descricao}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoverContador(c.id)}
                        className="text-[#666666] hover:text-rose-400 text-sm leading-none ml-1"
                      >
                        ×
                      </button>
                    </div>

                    {/* Representação em Blocos ████░░ */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#A88952] tracking-wider">
                          {'█'.repeat(c.valorAtual)}{'░'.repeat(Math.max(0, c.valorMaximo - c.valorAtual))}
                        </span>
                        <span className="text-[#D9D7D2] font-bold">
                          {c.valorAtual}/{c.valorMaximo}
                        </span>
                      </div>

                      {c.concluido && (
                        <div className="text-[10px] text-amber-400 font-bold tracking-wide uppercase">
                          CONTADOR CONCLUÍDO
                        </div>
                      )}
                    </div>

                    {/* Controles +1 / -1 */}
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#1f1f1f]">
                      <button
                        type="button"
                        onClick={() => handleAvancarContador(c.id, -1)}
                        className="px-2 py-0.5 bg-[#171717] hover:bg-[#292929] text-[#D9D7D2] text-[10px] rounded-sm"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAvancarContador(c.id, 1)}
                        className="px-2.5 py-0.5 bg-[#A88952] hover:bg-[#75603D] text-[#0B0B0B] font-bold text-[10px] rounded-sm"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                );
              })}

              <form onSubmit={handleCriarContador} className="pt-1 flex gap-2">
                <input
                  type="text"
                  value={novoContadorNome}
                  onChange={(e) => setNovoContadorNome(e.target.value)}
                  placeholder="+ Novo contador..."
                  className="flex-1 bg-[#0B0B0B] border border-[#292929] text-xs p-1.5 rounded-sm focus:outline-none text-[#F5F3EE]"
                />
                <select
                  value={novoContadorMax}
                  onChange={(e) => setNovoContadorMax(Number(e.target.value))}
                  className="bg-[#0B0B0B] border border-[#292929] text-xs p-1.5 rounded-sm text-[#F5F3EE]"
                >
                  <option value={4}>/4</option>
                  <option value={6}>/6</option>
                  <option value={8}>/8</option>
                </select>
                <button
                  type="submit"
                  className="px-2 py-1 bg-[#292929] text-[#D9D7D2] text-xs rounded-sm hover:bg-[#333333]"
                >
                  Criar
                </button>
              </form>
            </div>
          </div>

          {/* LOG DA CENA (Memória da Cena em Tempo Real) */}
          <div className="bg-[#171717] border border-[#292929] p-4 rounded-sm space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#292929] pb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#F5F3EE]">
                Log da Cena
              </span>
              <span className="text-[10px] text-[#666666]">
                Histórico
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {cena.log.length === 0 ? (
                <div className="text-[11px] text-[#666666] py-4 text-center">Nenhum evento registrado ainda.</div>
              ) : (
                cena.log.map(item => (
                  <div key={item.id} className="text-[11px] border-b border-[#1f1f1f] pb-1.5 last:border-none">
                    <div className="flex items-center justify-between text-[#666666]">
                      <span className="text-[10px]">{item.timestamp}</span>
                      <span className="uppercase text-[9px] text-[#A88952]">{item.tipo}</span>
                    </div>
                    <div className="text-[#D9D7D2] font-medium mt-0.5 leading-snug">
                      {item.descricao}
                    </div>
                    {item.detalhes && (
                      <div className="text-[10px] text-[#666666] mt-0.5 leading-relaxed">
                        {item.detalhes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODAIS DO MODO MESTRE                                                 */}
      {/* ========================================================================= */}
      
      {/* Modal de Ações do Mestre */}
      <MasterActionsModal
        isOpen={modalAcaoMestreAberto}
        onClose={() => setModalAcaoMestreAberto(false)}
        abaInicial={abaAcaoMestreInicial}
        antagonistas={cena.antagonistas}
        personagens={personagens}
        contadores={cena.contadores}
        onAtualizarAntagonista={(antAtualizado) => {
          setCena(prev => ({
            ...prev,
            antagonistas: prev.antagonistas.map(a => a.id === antAtualizado.id ? antAtualizado : a)
          }));
        }}
        onAtualizarPersonagem={onAtualizarPersonagem}
        onAvancarContador={handleAvancarContador}
        onRegistrarNoLog={registrarLog}
        onConsumirAcaoMestre={handleConsumirAcaoMestre}
      />

      {/* Assistente de Sonhar & Percepção Onírica */}
      <DreamResolverModal
        isOpen={modalSonharAberto}
        onClose={() => setModalSonharAberto(false)}
        personagens={personagens}
        onRegistrarNoLog={(tipo, desc, det) => registrarLog(tipo, desc, det)}
      />

      {/* Modal de Encerramento de Cena */}
      <EndSceneModal
        isOpen={modalEncerrarCenaAberto}
        onClose={() => setModalEncerrarCenaAberto(false)}
        objetivos={cena.objetivos}
        contadores={cena.contadores}
        antagonistas={cena.antagonistas}
        onConfirmarEncerramento={handleConfirmarEncerramentoCena}
      />

    </div>
  );
};
