import { useState, useEffect } from 'react';
import { Campanha, Sessao, NPC, Adversario, Local, Pista, LoreEntry, Anotacao, NovaSessaoInput } from '../types/campaign';
import {
  CAMPANHAS_INICIAIS,
  SESSOES_INICIAIS,
  NPCS_INICIAIS,
  ADVERSARIOS_INICIAIS,
  LOCAIS_INICIAIS,
  PISTAS_INICIAIS,
  LORE_INICIAIS,
  ANOTACOES_INICIAIS
} from './campaignsData';

const STORAGE_KEYS = {
  CAMPANHAS: 'reinos_oniricos_campanhas_v2',
  SESSOES: 'reinos_oniricos_sessoes_v2',
  NPCS: 'reinos_oniricos_npcs_v2',
  ADVERSARIOS: 'reinos_oniricos_adversarios_v2',
  LOCAIS: 'reinos_oniricos_locais_v2',
  PISTAS: 'reinos_oniricos_pistas_v2',
  LORE: 'reinos_oniricos_lore_v2',
  ANOTACOES: 'reinos_oniricos_anotacoes_v2',
  ATIVA_ID: 'reinos_oniricos_campanha_ativa_v2'
};

export function useCampaignStorage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CAMPANHAS);
      return salvo ? JSON.parse(salvo) : CAMPANHAS_INICIAIS;
    } catch {
      return CAMPANHAS_INICIAIS;
    }
  });

  const [campanhaAtivaId, setCampanhaAtivaId] = useState<string | null>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.ATIVA_ID);
      return salvo || (CAMPANHAS_INICIAIS[0]?.id ?? null);
    } catch {
      return CAMPANHAS_INICIAIS[0]?.id ?? null;
    }
  });

  const [sessoes, setSessoes] = useState<Sessao[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.SESSOES);
      return salvo ? JSON.parse(salvo) : SESSOES_INICIAIS;
    } catch {
      return SESSOES_INICIAIS;
    }
  });

  const [npcs, setNpcs] = useState<NPC[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.NPCS);
      return salvo ? JSON.parse(salvo) : NPCS_INICIAIS;
    } catch {
      return NPCS_INICIAIS;
    }
  });

  const [adversarios, setAdversarios] = useState<Adversario[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.ADVERSARIOS);
      return salvo ? JSON.parse(salvo) : ADVERSARIOS_INICIAIS;
    } catch {
      return ADVERSARIOS_INICIAIS;
    }
  });

  const [locais, setLocais] = useState<Local[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LOCAIS);
      return salvo ? JSON.parse(salvo) : LOCAIS_INICIAIS;
    } catch {
      return LOCAIS_INICIAIS;
    }
  });

  const [pistas, setPistas] = useState<Pista[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.PISTAS);
      return salvo ? JSON.parse(salvo) : PISTAS_INICIAIS;
    } catch {
      return PISTAS_INICIAIS;
    }
  });

  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LORE);
      return salvo ? JSON.parse(salvo) : LORE_INICIAIS;
    } catch {
      return LORE_INICIAIS;
    }
  });

  const [anotacoes, setAnotacoes] = useState<Anotacao[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.ANOTACOES);
      return salvo ? JSON.parse(salvo) : ANOTACOES_INICIAIS;
    } catch {
      return ANOTACOES_INICIAIS;
    }
  });

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPANHAS, JSON.stringify(campanhas));
  }, [campanhas]);

  useEffect(() => {
    if (campanhaAtivaId) {
      localStorage.setItem(STORAGE_KEYS.ATIVA_ID, campanhaAtivaId);
    }
  }, [campanhaAtivaId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSOES, JSON.stringify(sessoes));
  }, [sessoes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NPCS, JSON.stringify(npcs));
  }, [npcs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADVERSARIOS, JSON.stringify(adversarios));
  }, [adversarios]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAIS, JSON.stringify(locais));
  }, [locais]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PISTAS, JSON.stringify(pistas));
  }, [pistas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LORE, JSON.stringify(loreEntries));
  }, [loreEntries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANOTACOES, JSON.stringify(anotacoes));
  }, [anotacoes]);

  const campanhaAtiva = campanhas.find(c => c.id === campanhaAtivaId) || campanhas[0] || null;

  const criarCampanha = (dados: {
    nome: string;
    descricao: string;
    imagemUrl: string;
    tipo: 'campanha' | 'oneshot' | 'playtest';
  }): Campanha => {
    const nova: Campanha = {
      id: `camp-${Date.now()}`,
      codigo: `ONIRICO-${Math.floor(10 + Math.random() * 90)}`,
      nome: dados.nome.trim() || 'Nova História',
      descricao: dados.descricao.trim() || 'Fronteira silenciosa entre a vigília e o Sonhar.',
      imagemUrl: dados.imagemUrl || 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
      tipo: dados.tipo,
      status: 'em_andamento',
      jogadoresCount: 0,
      sessaoAtual: 1,
      rupturaGeral: 0,
      criadaEm: new Date().toISOString(),
      ultimaSessaoData: new Date().toLocaleDateString('pt-BR'),
      personagensIds: []
    };

    setCampanhas(antigas => [nova, ...antigas]);
    setCampanhaAtivaId(nova.id);
    return nova;
  };

  const atualizarCampanha = (id: string, partial: Partial<Campanha>) => {
    setCampanhas(antigas =>
      antigas.map(c => (c.id === id ? { ...c, ...partial } : c))
    );
  };

  const removerCampanha = (id: string) => {
    setCampanhas(antigas => antigas.filter(c => c.id !== id));
    if (campanhaAtivaId === id) {
      const restantes = campanhas.filter(c => c.id !== id);
      setCampanhaAtivaId(restantes[0]?.id || null);
    }
  };

  const criarSessao = (campanhaId: string, dados: NovaSessaoInput): Sessao => {
    const sessoesDaCamp = sessoes.filter(s => s.campanhaId === campanhaId);
    const proxNumero = sessoesDaCamp.length > 0 ? Math.max(...sessoesDaCamp.map(s => s.numero)) + 1 : 1;
    const nova: Sessao = {
      id: `sessao-${Date.now()}`,
      campanhaId,
      numero: proxNumero,
      titulo: dados.titulo.trim() || `Sessão ${String(proxNumero).padStart(2, '0')}`,
      data: dados.data || new Date().toLocaleDateString('pt-BR'),
      jogadoresCount: campanhaAtiva?.jogadoresCount || 4,
      concluida: dados.status === 'concluida',
      descricao: dados.descricao?.trim() || undefined,
      status: dados.status || 'planejamento',
      anotacoesMestre: dados.anotacoesMestre?.trim() || undefined,
      cenaIds: [],
      npcIds: [],
      localIds: [],
      pistaIds: [],
      adversarioIds: [],
      visibilidade: 'mestre_privado',
      conteudoDeCena: 'ambientacao'
    };
    setSessoes(prev => [nova, ...prev]);
    atualizarCampanha(campanhaId, { sessaoAtual: proxNumero });
    return nova;
  };

  const atualizarSessao = (id: string, partial: Partial<Sessao>) => {
    setSessoes(anteriores => anteriores.map(sessao => sessao.id === id ? { ...sessao, ...partial } : sessao));
  };

  const adicionarNPC = (novo: Omit<NPC, 'id'>) => {
    const item: NPC = { ...novo, id: `npc-${Date.now()}` };
    setNpcs(prev => [...prev, item]);
  };

  const adicionarAdversario = (novo: Omit<Adversario, 'id'>) => {
    const item: Adversario = { ...novo, id: `adv-${Date.now()}` };
    setAdversarios(prev => [...prev, item]);
  };

  const adicionarLocal = (novo: Omit<Local, 'id'>) => {
    const item: Local = { ...novo, id: `loc-${Date.now()}` };
    setLocais(prev => [...prev, item]);
  };

  const adicionarPista = (novo: Omit<Pista, 'id'>) => {
    const item: Pista = { ...novo, id: `pis-${Date.now()}` };
    setPistas(prev => [...prev, item]);
  };

  const adicionarLore = (novo: Omit<LoreEntry, 'id'>) => {
    const item: LoreEntry = { ...novo, id: `lore-${Date.now()}` };
    setLoreEntries(prev => [...prev, item]);
  };

  const adicionarAnotacao = (campanhaId: string, titulo: string, conteudo: string) => {
    const item: Anotacao = {
      id: `not-${Date.now()}`,
      campanhaId,
      titulo,
      conteudo,
      atualizadaEm: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    };
    setAnotacoes(prev => [item, ...prev]);
  };

  return {
    campanhas,
    campanhaAtivaId,
    campanhaAtiva,
    setCampanhaAtivaId,
    criarCampanha,
    atualizarCampanha,
    removerCampanha,
    sessoes,
    criarSessao,
    atualizarSessao,
    npcs,
    adicionarNPC,
    adversarios,
    adicionarAdversario,
    locais,
    adicionarLocal,
    pistas,
    adicionarPista,
    loreEntries,
    adicionarLore,
    anotacoes,
    adicionarAnotacao
  };
}
