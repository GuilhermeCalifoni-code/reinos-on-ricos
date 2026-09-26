import { Campanha, CampanhaTipo, MembroCampanha } from '../../types/campaign';
import { supabase } from '../../lib/supabaseClient';

const client = () => { if (!supabase) throw new Error('Supabase não está configurado.'); return supabase; };
const mapCampaign = (row: any): Campanha => ({ id: row.id, ownerId: row.owner_id, codigo: row.codigo_convite, nome: row.nome, descricao: row.descricao || '', imagemUrl: row.imagem_url || '', tipo: row.tipo, status: row.status, jogadoresCount: row.jogadores_count || 0, sessaoAtual: row.sessao_atual || 1, rupturaGeral: row.ruptura_geral || 0, criadaEm: row.criado_em, ultimaSessaoData: row.atualizado_em || row.criado_em, personagensIds: [] });
const mapMember = (row: any): MembroCampanha => ({ campaignId: row.campaign_id, userId: row.user_id, role: row.role, characterId: row.character_id || undefined, status: row.status, joinedAt: row.joined_at });

export const campaignRepository = {
  async listar() { const { data, error } = await client().from('campaigns').select('*').order('atualizado_em', { ascending: false }); if (error) throw error; return (data || []).map(mapCampaign); },
  async membros() { const { data, error } = await client().from('campaign_members').select('*'); if (error) throw error; return (data || []).map(mapMember); },
  async criar(input: { nome: string; descricao: string; imagemUrl: string; tipo: CampanhaTipo }) { const { data, error } = await client().rpc('create_campaign', { p_nome: input.nome, p_descricao: input.descricao, p_imagem_url: input.imagemUrl, p_tipo: input.tipo }); if (error) throw error; const { data: row, error: readError } = await client().from('campaigns').select('*').eq('id', data).single(); if (readError) throw readError; return mapCampaign(row); },
  async entrarComCodigo(codigo: string) { const { data, error } = await client().rpc('join_campaign_by_code', { p_codigo: codigo.trim().toUpperCase() }); if (error) throw error; return data as string; },
  async regenerarCodigo(campaignId: string) { const { data, error } = await client().rpc('regenerate_campaign_invite', { p_campaign_id: campaignId }); if (error) throw error; return data as string; },
  async vincularPersonagem(campaignId: string, characterId: string) { const { error } = await client().rpc('link_own_character_to_membership', { p_campaign_id: campaignId, p_character_id: characterId }); if (error) throw error; }
};
