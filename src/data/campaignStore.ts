import { useState, useEffect } from 'react';
import { Campanha, Sessao, NPC, Adversario, Local, Pista, LoreEntry, Anotacao, NovaSessaoInput, Contador, MapaNarrativo, TokenMapa, Cena, Handout } from '../types/campaign';
const STORAGE_KEYS = {
  CAMPANHAS: 'reinos_oniricos_campanhas_v2',
  SESSOES: 'reinos_oniricos_sessoes_v2',
  NPCS: 'reinos_oniricos_npcs_v2',
  ADVERSARIOS: 'reinos_oniricos_adversarios_v2',
  LOCAIS: 'reinos_oniricos_locais_v2',
  PISTAS: 'reinos_oniricos_pistas_v2',
  LORE: 'reinos_oniricos_lore_v2',
  ANOTACOES: 'reinos_oniricos_anotacoes_v2',
  CONTADORES: 'reinos_oniricos_contadores_v1',
  MAPAS: 'reinos_oniricos_mapas_v1',
  TOKENS_MAPA: 'reinos_oniricos_tokens_mapa_v1',
  CENAS: 'reinos_oniricos_cenas_v1',
  HANDOUTS: 'reinos_oniricos_handouts_v1',
  ATIVA_ID: 'reinos_oniricos_campanha_ativa_v2'
};

export function useCampaignStorage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CAMPANHAS);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [campanhaAtivaId, setCampanhaAtivaId] = useState<string | null>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.ATIVA_ID);
      return salvo || null;
    } catch {
      return null;
    }
  });

  const [sessoes, setSessoes] = useState<Sessao[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.SESSOES);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [npcs, setNpcs] = useState<NPC[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.NPCS);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [adversarios, setAdversarios] = useState<Adversario[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.ADVERSARIOS);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [locais, setLocais] = useState<Local[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LOCAIS);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [pistas, setPistas] = useState<Pista[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.PISTAS);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LORE);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [anotacoes, setAnotacoes] = useState<Anotacao[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.ANOTACOES);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [contadores, setContadores] = useState<Contador[]>(() => {
    try { const salvo = localStorage.getItem(STORAGE_KEYS.CONTADORES); return salvo ? JSON.parse(salvo) : []; } catch { return []; }
  });
  const [mapas, setMapas] = useState<MapaNarrativo[]>(() => {
    try { const salvo = localStorage.getItem(STORAGE_KEYS.MAPAS); return salvo ? JSON.parse(salvo) : []; } catch { return []; }
  });
  const [tokensMapa, setTokensMapa] = useState<TokenMapa[]>(() => {
    try { const salvo = localStorage.getItem(STORAGE_KEYS.TOKENS_MAPA); return salvo ? JSON.parse(salvo) : []; } catch { return []; }
  });
  const [cenas, setCenas] = useState<Cena[]>(() => {
    try { const salvo = localStorage.getItem(STORAGE_KEYS.CENAS); return salvo ? JSON.parse(salvo) : []; } catch { return []; }
  });
  const [handouts, setHandouts] = useState<Handout[]>(() => {
    try { const salvo = localStorage.getItem(STORAGE_KEYS.HANDOUTS); return salvo ? JSON.parse(salvo) : []; } catch { return []; }
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
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONTADORES, JSON.stringify(contadores)); }, [contadores]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MAPAS, JSON.stringify(mapas)); }, [mapas]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TOKENS_MAPA, JSON.stringify(tokensMapa)); }, [tokensMapa]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CENAS, JSON.stringify(cenas)); }, [cenas]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HANDOUTS, JSON.stringify(handouts)); }, [handouts]);

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
      nome: dados.nome.trim() || 'Nova campanha',
      descricao: dados.descricao.trim(),
      imagemUrl: dados.imagemUrl,
      tipo: dados.tipo,
      status: 'em_andamento',
      jogadoresCount: 0,
      sessaoAtual: 0,
      rupturaGeral: 0,
      criadaEm: new Date().toISOString(),
      ultimaSessaoData: '',
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
      jogadoresCount: campanhaAtiva?.jogadoresCount || 0,
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
    return item;
  };
  const atualizarNPC = (id: string, parcial: Partial<NPC>) => setNpcs(prev => prev.map(item => item.id === id ? { ...item, ...parcial } : item));
  const removerNPC = (id: string) => setNpcs(prev => prev.filter(item => item.id !== id));

  const adicionarAdversario = (novo: Omit<Adversario, 'id'>) => {
    const item: Adversario = { ...novo, id: `adv-${Date.now()}` };
    setAdversarios(prev => [...prev, item]);
    return item;
  };
  const atualizarAdversario = (id: string, parcial: Partial<Adversario>) => setAdversarios(prev => prev.map(item => item.id === id ? { ...item, ...parcial } : item));
  const removerAdversario = (id: string) => setAdversarios(prev => prev.filter(item => item.id !== id));

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

  const adicionarContador = (novo: Omit<Contador, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const agora = new Date().toISOString();
    const item: Contador = { ...novo, id: `contador-${Date.now()}`, criadoEm: agora, atualizadoEm: agora };
    setContadores(anteriores => [...anteriores, item]);
    return item;
  };
  const atualizarContador = (id: string, parcial: Partial<Contador>) => setContadores(anteriores => anteriores.map(item => item.id === id ? { ...item, ...parcial, atualizadoEm: new Date().toISOString() } : item));
  const removerContador = (id: string) => setContadores(anteriores => anteriores.filter(item => item.id !== id));
  const duplicarContador = (id: string) => {
    const origem = contadores.find(item => item.id === id);
    if (!origem) return null;
    return adicionarContador({ ...origem, nome: `${origem.nome} (cópia)`, valorAtual: origem.direcao === 'crescente' ? 0 : origem.valorMaximo, estado: 'ativo' });
  };

  const adicionarMapa = (novo: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const agora = new Date().toISOString();
    const item: MapaNarrativo = { ...novo, id: `mapa-${Date.now()}`, criadoEm: agora, atualizadoEm: agora };
    setMapas(anteriores => [...anteriores, item]);
    return item;
  };
  const atualizarMapa = (id: string, parcial: Partial<MapaNarrativo>) => setMapas(anteriores => anteriores.map(item => item.id === id ? { ...item, ...parcial, atualizadoEm: new Date().toISOString() } : item));
  const removerMapa = (id: string) => { setMapas(anteriores => anteriores.filter(item => item.id !== id)); setTokensMapa(anteriores => anteriores.filter(item => item.mapaId !== id)); };
  const adicionarTokenMapa = (novo: Omit<TokenMapa, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const agora = new Date().toISOString();
    const item: TokenMapa = { ...novo, id: `token-${Date.now()}`, criadoEm: agora, atualizadoEm: agora };
    setTokensMapa(anteriores => [...anteriores, item]);
    return item;
  };
  const atualizarTokenMapa = (id: string, parcial: Partial<TokenMapa>) => setTokensMapa(anteriores => anteriores.map(item => item.id === id ? { ...item, ...parcial, atualizadoEm: new Date().toISOString() } : item));
  const removerTokenMapa = (id: string) => setTokensMapa(anteriores => anteriores.filter(item => item.id !== id));

  const adicionarCena = (novo: Omit<Cena, 'id'>) => {
    const item: Cena = { ...novo, id: `cena-${Date.now()}` };
    setCenas(anteriores => [...anteriores, item]);
    return item;
  };
  const atualizarCena = (id: string, parcial: Partial<Cena>) => setCenas(anteriores => anteriores.map(item => item.id === id ? { ...item, ...parcial } : item));
  const removerCena = (id: string) => setCenas(anteriores => anteriores.filter(item => item.id !== id));

  const adicionarHandout = (novo: Omit<Handout, 'id'>) => {
    const item: Handout = { ...novo, id: `handout-${Date.now()}` };
    setHandouts(anteriores => [...anteriores, item]);
    return item;
  };
  const atualizarHandout = (id: string, parcial: Partial<Handout>) => setHandouts(anteriores => anteriores.map(item => item.id === id ? { ...item, ...parcial } : item));
  const removerHandout = (id: string) => setHandouts(anteriores => anteriores.filter(item => item.id !== id));

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
    atualizarNPC,
    removerNPC,
    adversarios,
    adicionarAdversario,
    atualizarAdversario,
    removerAdversario,
    locais,
    adicionarLocal,
    pistas,
    adicionarPista,
    loreEntries,
    adicionarLore,
    anotacoes,
    adicionarAnotacao,
    contadores,
    adicionarContador,
    atualizarContador,
    removerContador,
    duplicarContador,
    mapas,
    adicionarMapa,
    atualizarMapa,
    removerMapa,
    tokensMapa,
    adicionarTokenMapa,
    atualizarTokenMapa,
    removerTokenMapa,
    cenas,
    adicionarCena,
    atualizarCena,
    removerCena,
    handouts,
    adicionarHandout,
    atualizarHandout,
    removerHandout
  };
}
