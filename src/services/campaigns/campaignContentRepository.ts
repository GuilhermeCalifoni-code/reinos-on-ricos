import { supabase } from '../../lib/supabaseClient';
import { Adversario, Anotacao, Cena, Handout, Local, LoreEntry, MapaNarrativo, NPC, NovaSessaoInput, Pista, Sessao, VisibilidadeConteudo } from '../../types/campaign';

const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  return supabase;
};

const visibility = 'mestre_privado';

const mapSession = (row: any): Sessao => ({
  id: row.id,
  campanhaId: row.campaign_id,
  numero: row.numero,
  titulo: row.titulo,
  data: row.data_text || '',
  jogadoresCount: row.jogadores_count || 0,
  resumo: row.resumo || undefined,
  concluida: Boolean(row.concluida),
  descricao: row.descricao || undefined,
  imagemUrl: row.imagem_url || undefined,
  status: row.status,
  anotacoesMestre: row.anotacoes_mestre || undefined,
  cenaIds: row.cena_ids || [],
  npcIds: row.npc_ids || [],
  localIds: row.local_ids || [],
  pistaIds: row.pista_ids || [],
  adversarioIds: row.adversario_ids || [],
  mapaIds: row.mapa_ids || [],
  handoutIds: row.handout_ids || [],
  visibilidade: row.visibilidade,
  conteudoDeCena: row.conteudo_de_cena,
  criadoPor: row.criado_por
});

const mapNpc = (row: any): NPC => ({
  id: row.id, campanhaId: row.campaign_id, nome: row.nome, papel: row.papel,
  conceito: row.conceito, descricao: row.descricao, atitude: row.atitude,
  localizacao: row.localizacao,
  nivelAmeaca: row.nivel_ameaca ?? 0,
  vida: row.vida ?? 1,
  resistencia: row.resistencia ?? 0,
  dificuldade: row.dificuldade ?? 10,
  deslocamento: row.deslocamento || 'Próximo',
  habilidades: Array.isArray(row.habilidades) ? row.habilidades : [],
  imagemUrl: row.imagem_url || undefined,
  visibilidade: row.visibilidade
});

const mapAdversary = (row: any): Adversario => ({
  id: row.id, campanhaId: row.campaign_id, nome: row.nome, tipo: row.tipo,
  nivel: row.nivel, vida: row.vida, vidaMaxima: row.vida_maxima, defesa: row.defesa,
  resistencia: row.resistencia,
  dificuldade: row.dificuldade ?? row.defesa ?? 10,
  deslocamento: row.deslocamento || 'Próximo',
  habilidades: Array.isArray(row.habilidades) && row.habilidades.length
    ? row.habilidades
    : (row.ataque_principal ? [{ id: 'legacy-action', categoria: 'acao', nome: 'Ação', descricao: row.ataque_principal, teste: 'mundano', dt: row.dificuldade ?? row.defesa ?? 10 }] : []),
  ataquePrincipal: row.ataque_principal,
  descricao: row.descricao, imagemUrl: row.imagem_url || undefined, visibilidade: row.visibilidade
});

const mapLocation = (row: any): Local => ({
  id: row.id, campanhaId: row.campaign_id, nome: row.nome, tipo: row.tipo,
  descricao: row.descricao, anomaliaDetectada: row.anomalia_detectada || undefined,
  imagemUrl: row.imagem_url || undefined,
  visibilidade: row.visibilidade
});

const mapClue = (row: any): Pista => ({
  id: row.id, campanhaId: row.campaign_id, titulo: row.titulo, tipo: row.tipo,
  status: row.status, descricao: row.descricao, imagemUrl: row.imagem_url || undefined, visibilidade: row.visibilidade
});

const mapLore = (row: any): LoreEntry => ({
  id: row.id, campanhaId: row.campaign_id, titulo: row.titulo,
  categoria: row.categoria, conteudo: row.conteudo, visibilidade: row.visibilidade
});

const mapNote = (row: any): Anotacao => ({
  id: row.id, campanhaId: row.campaign_id, titulo: row.titulo,
  conteudo: row.conteudo,
  atualizadaEm: new Date(row.atualizado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
  visibilidade: row.visibilidade
});

const mapScene = (row: any): Cena => ({
  id: row.id,
  campanhaId: row.campaign_id,
  titulo: row.titulo,
  descricao: row.descricao || undefined,
  visibilidade: row.visibilidade,
  tipoDeConteudo: row.tipo_de_conteudo,
  imagemUrl: row.imagem_url || undefined
});

const mapHandout = (row: any): Handout => ({
  id: row.id,
  campanhaId: row.campaign_id,
  titulo: row.titulo,
  descricao: row.descricao || undefined,
  arquivoUrl: row.arquivo_url || undefined,
  storagePath: row.storage_path || undefined,
  visibilidade: row.visibilidade
});

const mapMap = (row: any): MapaNarrativo => ({
  id: row.id,
  campanhaId: row.campaign_id,
  titulo: row.titulo,
  imagemUrl: row.imagem_url || undefined,
  storagePath: row.storage_path || undefined,
  visibilidade: row.visibilidade,
  gradeVisivel: Boolean(row.grade_visivel),
  criadoEm: row.criado_em,
  atualizadoEm: row.atualizado_em,
  criadoPor: row.criado_por || undefined
});

export const campaignContentRepository = {
  async carregar(campaignId: string) {
    const api = client();
    const [sessions, npcs, adversaries, locations, clues, lore, notes, scenes, handouts, maps] = await Promise.all([
      api.from('campaign_sessions').select('*').eq('campaign_id', campaignId).order('numero', { ascending: false }),
      api.from('campaign_npcs').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_adversaries').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_locations').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_clues').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_lore').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_notes').select('*').eq('campaign_id', campaignId).order('atualizado_em', { ascending: false }),
      api.from('campaign_scenes').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_handouts').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('narrative_maps').select('*').eq('campaign_id', campaignId).order('criado_em')
    ]);
    for (const result of [sessions, npcs, adversaries, locations, clues, lore, notes, scenes, handouts, maps]) if (result.error) throw result.error;
    return {
      sessoes: (sessions.data || []).map(mapSession),
      npcs: (npcs.data || []).map(mapNpc),
      adversarios: (adversaries.data || []).map(mapAdversary),
      locais: (locations.data || []).map(mapLocation),
      pistas: (clues.data || []).map(mapClue),
      loreEntries: (lore.data || []).map(mapLore),
      anotacoes: (notes.data || []).map(mapNote),
      cenas: (scenes.data || []).map(mapScene),
      handouts: (handouts.data || []).map(mapHandout),
      mapas: (maps.data || []).map(mapMap)
    };
  },

  async criarSessao(campaignId: string, dados: NovaSessaoInput) {
    const { count, error: countError } = await client().from('campaign_sessions').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId);
    if (countError) throw countError;
    const numero = (count || 0) + 1;
    const { data, error } = await client().from('campaign_sessions').insert({
      campaign_id: campaignId,
      numero,
      titulo: dados.titulo.trim() || `Sessão ${numero}`,
      data_text: dados.data || '',
      descricao: dados.descricao?.trim() || null,
      status: dados.status || 'planejamento',
      concluida: dados.status === 'concluida',
      anotacoes_mestre: dados.anotacoesMestre?.trim() || null,
      imagem_url: dados.imagemUrl || null,
      cena_ids: dados.cenaIds || [],
      npc_ids: dados.npcIds || [],
      local_ids: dados.localIds || [],
      pista_ids: dados.pistaIds || [],
      adversario_ids: dados.adversarioIds || [],
      mapa_ids: dados.mapaIds || [],
      handout_ids: dados.handoutIds || [],
      visibilidade: visibility,
      conteudo_de_cena: 'ambientacao'
    }).select().single();
    if (error) throw error;
    await client().from('campaigns').update({ sessao_atual: numero }).eq('id', campaignId);
    return mapSession(data);
  },

  async atualizarSessao(id: string, patch: Partial<Sessao>) {
    const values: Record<string, unknown> = {};
    if (patch.titulo !== undefined) values.titulo = patch.titulo;
    if (patch.data !== undefined) values.data_text = patch.data;
    if (patch.jogadoresCount !== undefined) values.jogadores_count = patch.jogadoresCount;
    if (patch.resumo !== undefined) values.resumo = patch.resumo || null;
    if (patch.concluida !== undefined) values.concluida = patch.concluida;
    if (patch.descricao !== undefined) values.descricao = patch.descricao || null;
    if (patch.imagemUrl !== undefined) values.imagem_url = patch.imagemUrl || null;
    if (patch.status !== undefined) {
      values.status = patch.status;
      values.concluida = patch.status === 'concluida';
    }
    if (patch.anotacoesMestre !== undefined) values.anotacoes_mestre = patch.anotacoesMestre || null;
    if (patch.cenaIds !== undefined) values.cena_ids = patch.cenaIds;
    if (patch.npcIds !== undefined) values.npc_ids = patch.npcIds;
    if (patch.localIds !== undefined) values.local_ids = patch.localIds;
    if (patch.pistaIds !== undefined) values.pista_ids = patch.pistaIds;
    if (patch.adversarioIds !== undefined) values.adversario_ids = patch.adversarioIds;
    if (patch.mapaIds !== undefined) values.mapa_ids = patch.mapaIds;
    if (patch.handoutIds !== undefined) values.handout_ids = patch.handoutIds;
    if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade;
    if (patch.conteudoDeCena !== undefined) values.conteudo_de_cena = patch.conteudoDeCena;
    if (!Object.keys(values).length) {
      const { data, error } = await client().from('campaign_sessions').select('*').eq('id', id).single();
      if (error) throw error;
      return mapSession(data);
    }
    values.atualizado_em = new Date().toISOString();
    const { data, error } = await client().from('campaign_sessions').update(values).eq('id', id).select().single();
    if (error) throw error;
    return mapSession(data);
  },

  async adicionarNPC(novo: Omit<NPC, 'id'>) {
    const { data, error } = await client().from('campaign_npcs').insert({
      campaign_id: novo.campanhaId, nome: novo.nome, papel: novo.papel, conceito: novo.conceito,
      descricao: novo.descricao, atitude: novo.atitude, localizacao: novo.localizacao,
      nivel_ameaca: novo.nivelAmeaca ?? 0, vida: novo.vida ?? 1, resistencia: novo.resistencia ?? 0,
      dificuldade: novo.dificuldade ?? 10, deslocamento: novo.deslocamento || 'Próximo',
      habilidades: novo.habilidades || [],
      imagem_url: novo.imagemUrl || null,
      visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapNpc(data);
  },

  async adicionarAdversario(novo: Omit<Adversario, 'id'>) {
    const { data, error } = await client().from('campaign_adversaries').insert({
      campaign_id: novo.campanhaId, nome: novo.nome, tipo: novo.tipo, nivel: novo.nivel,
      vida: novo.vida, vida_maxima: novo.vidaMaxima, defesa: novo.defesa,
      resistencia: novo.resistencia, dificuldade: novo.dificuldade ?? novo.defesa ?? 10,
      deslocamento: novo.deslocamento || 'Próximo', habilidades: novo.habilidades || [],
      imagem_url: novo.imagemUrl || null,
      ataque_principal: novo.ataquePrincipal,
      descricao: novo.descricao, visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapAdversary(data);
  },

  async atualizarNPC(id: string, patch: Partial<NPC>) {
    const values: Record<string, unknown> = {};
    if (patch.nome !== undefined) values.nome = patch.nome;
    if (patch.papel !== undefined) values.papel = patch.papel;
    if (patch.conceito !== undefined) values.conceito = patch.conceito;
    if (patch.descricao !== undefined) values.descricao = patch.descricao;
    if (patch.atitude !== undefined) values.atitude = patch.atitude;
    if (patch.localizacao !== undefined) values.localizacao = patch.localizacao;
    if (patch.nivelAmeaca !== undefined) values.nivel_ameaca = patch.nivelAmeaca;
    if (patch.vida !== undefined) values.vida = patch.vida;
    if (patch.resistencia !== undefined) values.resistencia = patch.resistencia;
    if (patch.dificuldade !== undefined) values.dificuldade = patch.dificuldade;
    if (patch.deslocamento !== undefined) values.deslocamento = patch.deslocamento;
    if (patch.habilidades !== undefined) values.habilidades = patch.habilidades;
    if (patch.imagemUrl !== undefined) values.imagem_url = patch.imagemUrl || null;
    if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade;
    const { data, error } = await client().from('campaign_npcs').update(values).eq('id', id).select().single();
    if (error) throw error;
    return mapNpc(data);
  },

  async removerNPC(id: string) {
    const { error } = await client().from('campaign_npcs').delete().eq('id', id);
    if (error) throw error;
  },

  async atualizarAdversario(id: string, patch: Partial<Adversario>) {
    const values: Record<string, unknown> = {};
    if (patch.nome !== undefined) values.nome = patch.nome;
    if (patch.tipo !== undefined) values.tipo = patch.tipo;
    if (patch.nivel !== undefined) values.nivel = patch.nivel;
    if (patch.vida !== undefined) values.vida = patch.vida;
    if (patch.vidaMaxima !== undefined) values.vida_maxima = patch.vidaMaxima;
    if (patch.defesa !== undefined) values.defesa = patch.defesa;
    if (patch.resistencia !== undefined) values.resistencia = patch.resistencia;
    if (patch.dificuldade !== undefined) values.dificuldade = patch.dificuldade;
    if (patch.deslocamento !== undefined) values.deslocamento = patch.deslocamento;
    if (patch.habilidades !== undefined) values.habilidades = patch.habilidades;
    if (patch.ataquePrincipal !== undefined) values.ataque_principal = patch.ataquePrincipal;
    if (patch.descricao !== undefined) values.descricao = patch.descricao;
    if (patch.imagemUrl !== undefined) values.imagem_url = patch.imagemUrl || null;
    if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade;
    const { data, error } = await client().from('campaign_adversaries').update(values).eq('id', id).select().single();
    if (error) throw error;
    return mapAdversary(data);
  },

  async removerAdversario(id: string) {
    const { error } = await client().from('campaign_adversaries').delete().eq('id', id);
    if (error) throw error;
  },

  async adicionarLocal(novo: Omit<Local, 'id'>) {
    const { data, error } = await client().from('campaign_locations').insert({
      campaign_id: novo.campanhaId, nome: novo.nome, tipo: novo.tipo, descricao: novo.descricao,
      anomalia_detectada: novo.anomaliaDetectada || null, imagem_url: novo.imagemUrl || null,
      visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapLocation(data);
  },

  async adicionarPista(novo: Omit<Pista, 'id'>) {
    const { data, error } = await client().from('campaign_clues').insert({
      campaign_id: novo.campanhaId, titulo: novo.titulo, tipo: novo.tipo,
      status: novo.status, descricao: novo.descricao, imagem_url: novo.imagemUrl || null,
      visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapClue(data);
  },

  async atualizarPista(id: string, patch: Partial<Pista>) {
    const values: Record<string, unknown> = {};
    if (patch.titulo !== undefined) values.titulo = patch.titulo;
    if (patch.tipo !== undefined) values.tipo = patch.tipo;
    if (patch.status !== undefined) values.status = patch.status;
    if (patch.descricao !== undefined) values.descricao = patch.descricao;
    if (patch.imagemUrl !== undefined) values.imagem_url = patch.imagemUrl || null;
    if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade;
    const { data, error } = await client().from('campaign_clues').update(values).eq('id', id).select().single();
    if (error) throw error;
    return mapClue(data);
  },

  async removerPista(id: string) {
    const { error } = await client().from('campaign_clues').delete().eq('id', id);
    if (error) throw error;
  },

  async adicionarLore(novo: Omit<LoreEntry, 'id'>) {
    const { data, error } = await client().from('campaign_lore').insert({
      campaign_id: novo.campanhaId, titulo: novo.titulo, categoria: novo.categoria,
      conteudo: novo.conteudo, visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapLore(data);
  },

  async adicionarAnotacao(campaignId: string, titulo: string, conteudo: string) {
    const { data, error } = await client().from('campaign_notes').insert({
      campaign_id: campaignId, titulo, conteudo, visibilidade: visibility
    }).select().single();
    if (error) throw error;
    return mapNote(data);
  },

  async adicionarCena(nova: Omit<Cena, 'id'>) {
    const { data, error } = await client().from('campaign_scenes').insert({
      campaign_id: nova.campanhaId,
      titulo: nova.titulo,
      descricao: nova.descricao || null,
      visibilidade: nova.visibilidade,
      tipo_de_conteudo: nova.tipoDeConteudo,
      imagem_url: nova.imagemUrl || null
    }).select().single();
    if (error) throw error;
    return mapScene(data);
  },

  async atualizarCena(id: string, patch: Partial<Cena>) {
    const values: Record<string, unknown> = {};
    if (patch.titulo !== undefined) values.titulo = patch.titulo;
    if (patch.descricao !== undefined) values.descricao = patch.descricao || null;
    if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade;
    if (patch.tipoDeConteudo !== undefined) values.tipo_de_conteudo = patch.tipoDeConteudo;
    if (patch.imagemUrl !== undefined) values.imagem_url = patch.imagemUrl || null;
    const { data, error } = await client().from('campaign_scenes').update(values).eq('id', id).select().single();
    if (error) throw error;
    return mapScene(data);
  },

  async removerCena(id: string) {
    const { error } = await client().from('campaign_scenes').delete().eq('id', id);
    if (error) throw error;
  },

  async adicionarHandout(novo: Omit<Handout, 'id'>) {
    const { data, error } = await client().from('campaign_handouts').insert({
      campaign_id: novo.campanhaId,
      titulo: novo.titulo,
      descricao: novo.descricao || null,
      arquivo_url: novo.arquivoUrl || null,
      storage_path: novo.storagePath || null,
      visibilidade: novo.visibilidade
    }).select().single();
    if (error) throw error;
    return mapHandout(data);
  },

  async atualizarHandout(id: string, patch: Partial<Handout>) {
    const values: Record<string, unknown> = {};
    if (patch.titulo !== undefined) values.titulo = patch.titulo;
    if (patch.descricao !== undefined) values.descricao = patch.descricao || null;
    if (patch.arquivoUrl !== undefined) values.arquivo_url = patch.arquivoUrl || null;
    if (patch.storagePath !== undefined) values.storage_path = patch.storagePath || null;
    if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade;
    const { data, error } = await client().from('campaign_handouts').update(values).eq('id', id).select().single();
    if (error) throw error;
    return mapHandout(data);
  },

  async removerHandout(id: string) {
    const { error } = await client().from('campaign_handouts').delete().eq('id', id);
    if (error) throw error;
  },

  async adicionarMapa(novo: Omit<MapaNarrativo, 'id' | 'criadoEm' | 'atualizadoEm'>) {
    const { data, error } = await client().from('narrative_maps').insert({
      campaign_id: novo.campanhaId,
      titulo: novo.titulo,
      imagem_url: novo.imagemUrl || null,
      storage_path: novo.storagePath || null,
      visibilidade: novo.visibilidade,
      grade_visivel: Boolean(novo.gradeVisivel)
    }).select().single();
    if (error) throw error;
    return mapMap(data);
  },

  async atualizarMapa(id: string, patch: Partial<MapaNarrativo>) {
    const values: Record<string, unknown> = {};
    if (patch.titulo !== undefined) values.titulo = patch.titulo;
    if (patch.imagemUrl !== undefined) values.imagem_url = patch.imagemUrl || null;
    if (patch.storagePath !== undefined) values.storage_path = patch.storagePath || null;
    if (patch.visibilidade !== undefined) values.visibilidade = patch.visibilidade;
    if (patch.gradeVisivel !== undefined) values.grade_visivel = patch.gradeVisivel;
    values.atualizado_em = new Date().toISOString();
    const { data, error } = await client().from('narrative_maps').update(values).eq('id', id).select().single();
    if (error) throw error;
    return mapMap(data);
  },

  async removerMapa(id: string) {
    const { error } = await client().from('narrative_maps').delete().eq('id', id);
    if (error) throw error;
  }

};