import { supabase } from '../../lib/supabaseClient';
import { Adversario, Anotacao, Local, LoreEntry, NPC, NovaSessaoInput, Pista, Sessao } from '../../types/campaign';

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
  status: row.status,
  anotacoesMestre: row.anotacoes_mestre || undefined,
  cenaIds: row.cena_ids || [],
  npcIds: row.npc_ids || [],
  localIds: row.local_ids || [],
  pistaIds: row.pista_ids || [],
  adversarioIds: row.adversario_ids || [],
  visibilidade: row.visibilidade,
  conteudoDeCena: row.conteudo_de_cena,
  criadoPor: row.criado_por
});

const mapNpc = (row: any): NPC => ({
  id: row.id, campanhaId: row.campaign_id, nome: row.nome, papel: row.papel,
  conceito: row.conceito, descricao: row.descricao, atitude: row.atitude,
  localizacao: row.localizacao, visibilidade: row.visibilidade
});

const mapAdversary = (row: any): Adversario => ({
  id: row.id, campanhaId: row.campaign_id, nome: row.nome, tipo: row.tipo,
  nivel: row.nivel, vida: row.vida, vidaMaxima: row.vida_maxima, defesa: row.defesa,
  resistencia: row.resistencia, ataquePrincipal: row.ataque_principal,
  descricao: row.descricao, visibilidade: row.visibilidade
});

const mapLocation = (row: any): Local => ({
  id: row.id, campanhaId: row.campaign_id, nome: row.nome, tipo: row.tipo,
  descricao: row.descricao, anomaliaDetectada: row.anomalia_detectada || undefined,
  visibilidade: row.visibilidade
});

const mapClue = (row: any): Pista => ({
  id: row.id, campanhaId: row.campaign_id, titulo: row.titulo, tipo: row.tipo,
  status: row.status, descricao: row.descricao, visibilidade: row.visibilidade
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

export const campaignContentRepository = {
  async carregar(campaignId: string) {
    const api = client();
    const [sessions, npcs, adversaries, locations, clues, lore, notes] = await Promise.all([
      api.from('campaign_sessions').select('*').eq('campaign_id', campaignId).order('numero', { ascending: false }),
      api.from('campaign_npcs').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_adversaries').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_locations').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_clues').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_lore').select('*').eq('campaign_id', campaignId).order('criado_em'),
      api.from('campaign_notes').select('*').eq('campaign_id', campaignId).order('atualizado_em', { ascending: false })
    ]);
    for (const result of [sessions, npcs, adversaries, locations, clues, lore, notes]) if (result.error) throw result.error;
    return {
      sessoes: (sessions.data || []).map(mapSession),
      npcs: (npcs.data || []).map(mapNpc),
      adversarios: (adversaries.data || []).map(mapAdversary),
      locais: (locations.data || []).map(mapLocation),
      pistas: (clues.data || []).map(mapClue),
      loreEntries: (lore.data || []).map(mapLore),
      anotacoes: (notes.data || []).map(mapNote)
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
      visibilidade: visibility,
      conteudo_de_cena: 'ambientacao'
    }).select().single();
    if (error) throw error;
    await client().from('campaigns').update({ sessao_atual: numero }).eq('id', campaignId);
    return mapSession(data);
  },

  async adicionarNPC(novo: Omit<NPC, 'id'>) {
    const { data, error } = await client().from('campaign_npcs').insert({
      campaign_id: novo.campanhaId, nome: novo.nome, papel: novo.papel, conceito: novo.conceito,
      descricao: novo.descricao, atitude: novo.atitude, localizacao: novo.localizacao,
      visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapNpc(data);
  },

  async adicionarAdversario(novo: Omit<Adversario, 'id'>) {
    const { data, error } = await client().from('campaign_adversaries').insert({
      campaign_id: novo.campanhaId, nome: novo.nome, tipo: novo.tipo, nivel: novo.nivel,
      vida: novo.vida, vida_maxima: novo.vidaMaxima, defesa: novo.defesa,
      resistencia: novo.resistencia, ataque_principal: novo.ataquePrincipal,
      descricao: novo.descricao, visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapAdversary(data);
  },

  async adicionarLocal(novo: Omit<Local, 'id'>) {
    const { data, error } = await client().from('campaign_locations').insert({
      campaign_id: novo.campanhaId, nome: novo.nome, tipo: novo.tipo, descricao: novo.descricao,
      anomalia_detectada: novo.anomaliaDetectada || null, visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapLocation(data);
  },

  async adicionarPista(novo: Omit<Pista, 'id'>) {
    const { data, error } = await client().from('campaign_clues').insert({
      campaign_id: novo.campanhaId, titulo: novo.titulo, tipo: novo.tipo,
      status: novo.status, descricao: novo.descricao, visibilidade: novo.visibilidade || visibility
    }).select().single();
    if (error) throw error;
    return mapClue(data);
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
  }
};
